import { createFileRoute } from "@tanstack/react-router";
import { createParser } from "eventsource-parser";
import { z } from "zod";

import {
  authenticate,
  base64ToBytes,
  callImageEdit,
  friendlyGatewayError,
  IMAGE_MODEL,
  jsonError,
  STORAGE_BUCKET,
} from "@/lib/pixora.server";
import {
  buildEditPrompt,
  decideGenerationAllowed,
  IN_FLIGHT_WINDOW_MINUTES,
  MAX_AVOID_CHARS,
  MAX_PROMPT_CHARS,
  MAX_UPLOAD_BYTES,
  moderatePrompt,
  outputSizeFor,
  sniffImageType,
} from "@/lib/generation-rules";

const fieldsSchema = z.object({
  requestId: z.string().min(8).max(64).regex(/^[A-Za-z0-9_-]+$/),
  category: z.string().min(1).max(32),
  style: z.string().min(1).max(48),
  customPrompt: z.string().max(MAX_PROMPT_CHARS).optional(),
  avoidPrompt: z.string().max(MAX_AVOID_CHARS).optional(),
  aspectRatio: z.enum(["1:1", "4:5", "3:4", "16:9", "original"]),
  width: z.coerce.number().int().min(1).max(20000).optional(),
  height: z.coerce.number().int().min(1).max(20000).optional(),
  consent: z.literal("true"),
});

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticate(request);
        if (auth instanceof Response) return auth;
        const { userId } = auth;

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return jsonError(400, "The upload could not be read. Please try again.");
        }

        const str = (k: string) => {
          const v = form.get(k);
          return typeof v === "string" && v.length > 0 ? v : undefined;
        };
        const parsed = fieldsSchema.safeParse({
          requestId: str("requestId"),
          category: str("category"),
          style: str("style"),
          customPrompt: str("customPrompt"),
          avoidPrompt: str("avoidPrompt"),
          aspectRatio: str("aspectRatio"),
          width: str("width"),
          height: str("height"),
          consent: str("consent"),
        });
        if (!parsed.success) {
          const consentMissing = parsed.error.issues.some((i) => i.path[0] === "consent");
          return jsonError(
            400,
            consentMissing
              ? "Please confirm you have permission to edit this photo."
              : "Some settings were invalid. Please check your choices and try again.",
            consentMissing ? "consent_required" : "invalid_input",
          );
        }
        const fields = parsed.data;

        const image = form.get("image");
        if (!(image instanceof File)) return jsonError(400, "Please upload a photo first.", "no_image");
        if (image.size > MAX_UPLOAD_BYTES) return jsonError(413, "This photo is too large (max 10 MB).", "too_large");
        const bytes = new Uint8Array(await image.arrayBuffer());
        const realType = sniffImageType(bytes);
        if (!realType) {
          return jsonError(415, "Unsupported format. Please upload a JPG, PNG or WEBP photo.", "bad_format");
        }

        const moderation = moderatePrompt(`${fields.customPrompt ?? ""} ${fields.avoidPrompt ?? ""}`);
        if (!moderation.ok) return jsonError(422, moderation.reason, "moderation");

        const prompt = buildEditPrompt(fields);
        if (!prompt) {
          return jsonError(
            400,
            fields.category === "custom"
              ? "Please describe the edit you want in the instructions box."
              : "Please choose an editing style.",
            "invalid_style",
          );
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return jsonError(
            503,
            "The AI image service is not configured yet. The site owner needs to enable Lovable AI for this project.",
            "ai_not_configured",
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Server-side credit, concurrency and rate checks.
        const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const inFlightSince = new Date(Date.now() - IN_FLIGHT_WINDOW_MINUTES * 60 * 1000).toISOString();
        const [balanceRes, inFlightRes, hourRes] = await Promise.all([
          supabaseAdmin.from("credit_balances").select("credits").eq("user_id", userId).maybeSingle(),
          supabaseAdmin
            .from("generations")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("status", "processing")
            .gte("created_at", inFlightSince),
          supabaseAdmin
            .from("generations")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("created_at", since),
        ]);
        if (balanceRes.error || inFlightRes.error || hourRes.error) {
          return jsonError(500, "We couldn't check your account. Please try again.");
        }
        const decision = decideGenerationAllowed({
          credits: balanceRes.data?.credits ?? 0,
          inFlight: inFlightRes.count ?? 0,
          lastHourCount: hourRes.count ?? 0,
        });
        if (!decision.allowed) {
          const code = decision.status === 402 ? "insufficient_credits" : decision.status === 409 ? "in_progress" : "rate_limited";
          return jsonError(decision.status, decision.reason, code);
        }

        const size = outputSizeFor(
          fields.aspectRatio,
          fields.width && fields.height ? { width: fields.width, height: fields.height } : undefined,
        );

        const { data: gen, error: insertError } = await supabaseAdmin
          .from("generations")
          .insert({
            user_id: userId,
            request_id: fields.requestId,
            category: fields.category,
            style: fields.style,
            custom_prompt: fields.customPrompt ?? null,
            avoid_prompt: fields.avoidPrompt ?? null,
            aspect_ratio: fields.aspectRatio,
            output_size: size,
            model: IMAGE_MODEL,
            status: "processing",
          })
          .select("id")
          .single();
        if (insertError || !gen) {
          if (insertError?.code === "23505") {
            return jsonError(409, "This request was already submitted.", "duplicate");
          }
          return jsonError(500, "We couldn't start the generation. Please try again.");
        }
        const generationId = gen.id;
        const originalPath = `${userId}/${generationId}/original.${EXT[realType]}`;

        const failGeneration = async (message: string) => {
          await supabaseAdmin
            .from("generations")
            .update({ status: "failed", error_message: message.slice(0, 500), completed_at: new Date().toISOString() })
            .eq("id", generationId);
        };

        const up = await supabaseAdmin.storage
          .from(STORAGE_BUCKET)
          .upload(originalPath, bytes, { contentType: realType, upsert: false });
        if (up.error) {
          await failGeneration("Original upload failed");
          return jsonError(500, "Your photo couldn't be stored. Please try again.", "storage_failed");
        }
        await supabaseAdmin.from("generations").update({ original_path: originalPath }).eq("id", generationId);

        const encoder = new TextEncoder();
        const imageBlob = new Blob([bytes], { type: realType });
        const filename = `photo.${EXT[realType]}`;

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            let closed = false;
            const send = (event: string, data: unknown) => {
              if (closed) return;
              try {
                controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
              } catch {
                closed = true;
              }
            };
            // Keep-alive comments while the model works silently; never aborts the request.
            const heartbeat = setInterval(() => {
              if (closed) return;
              try {
                controller.enqueue(encoder.encode(`: keep-alive\n\n`));
              } catch {
                closed = true;
              }
            }, 10_000);

            const fail = async (message: string, retryable: boolean) => {
              await failGeneration(message);
              send("error", { message, retryable, generationId });
            };

            try {
              send("status", { stage: "generating", generationId });

              let finalB64: string | null = null;
              let upstreamError: { message: string; retryable: boolean } | null = null;
              let eventCount = 0;

              const upstream = await callImageEdit({ apiKey, image: imageBlob, filename, prompt, size, stream: true });
              if (!upstream.ok || !upstream.body) {
                const body = await upstream.json().catch(() => null);
                upstreamError = friendlyGatewayError(upstream.status, body);
              } else {
                const parser = createParser({
                  onEvent(evt) {
                    let payload: { type?: string; b64_json?: string; error?: { message?: string; code?: string } };
                    try {
                      payload = JSON.parse(evt.data);
                    } catch {
                      return;
                    }
                    const type = payload.type ?? evt.event ?? "";
                    if (evt.event === "error" || type === "error") {
                      eventCount++;
                      upstreamError = friendlyGatewayError(400, payload);
                      return;
                    }
                    if (type.endsWith(".partial_image") && payload.b64_json) {
                      eventCount++;
                      send("partial", { b64: payload.b64_json });
                    } else if (type.endsWith(".completed") && payload.b64_json) {
                      eventCount++;
                      finalB64 = payload.b64_json;
                    }
                  },
                });
                const reader = upstream.body.pipeThrough(new TextDecoderStream()).getReader();
                try {
                  for (;;) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    parser.feed(value);
                  }
                } catch {
                  // fall through to the zero-event replay below
                }
              }

              // Single buffered replay only when the stream produced nothing at all.
              if (!finalB64 && !upstreamError && eventCount === 0) {
                const replay = await callImageEdit({ apiKey, image: imageBlob, filename, prompt, size, stream: false });
                const body = (await replay.json().catch(() => null)) as { data?: { b64_json?: string }[] } | null;
                if (replay.ok && body?.data?.[0]?.b64_json) finalB64 = body.data[0].b64_json;
                else upstreamError = friendlyGatewayError(replay.status, body);
              }

              if (!finalB64) {
                const e = upstreamError as { message: string; retryable: boolean } | null;
                await fail(e?.message ?? "The AI service didn't return an image. Please try again.", e?.retryable ?? true);
                return;
              }

              const resultPath = `${userId}/${generationId}/result.png`;
              const resultUp = await supabaseAdmin.storage
                .from(STORAGE_BUCKET)
                .upload(resultPath, base64ToBytes(finalB64), { contentType: "image/png", upsert: true });
              if (resultUp.error) {
                await fail("The image was created but couldn't be saved. You were not charged. Please try again.", true);
                return;
              }

              // Deduct credit only after the image exists.
              const { data: remaining, error: creditError } = await supabaseAdmin.rpc("consume_generation_credit", {
                _user_id: userId,
                _generation_id: generationId,
              });
              if (creditError) {
                await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([resultPath]);
                await fail("You don't have enough credits for this generation.", false);
                return;
              }

              await supabaseAdmin
                .from("generations")
                .update({ status: "succeeded", result_path: resultPath, completed_at: new Date().toISOString() })
                .eq("id", generationId);

              send("done", {
                generationId,
                originalPath,
                resultPath,
                credits: remaining,
              });
            } catch (err) {
              console.error("generate failed", err);
              await fail("Something went wrong while generating. You were not charged. Please try again.", true);
            } finally {
              clearInterval(heartbeat);
              if (!closed) {
                closed = true;
                try {
                  controller.close();
                } catch {
                  /* already closed */
                }
              }
            }
          },
        });

        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});

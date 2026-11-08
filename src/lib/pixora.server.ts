// Server-only helpers for the generate route. Never import from browser code.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const IMAGE_MODEL = "openai/gpt-image-2.6-sunburst";
export const GATEWAY_BASE_URL = "https://ai.gateway.lovable.dev";
export const STORAGE_BUCKET = "pixora-images";

export function jsonError(status: number, message: string, code?: string) {
  return Response.json({ error: { message, code: code ?? String(status) } }, { status });
}

/** Verifies the bearer token and returns the user id, or an error Response. */
export async function authenticate(request: Request): Promise<{ userId: string } | Response> {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return jsonError(500, "Server is not configured. Please try again later.");
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || token.split(".").length !== 3) {
    return jsonError(401, "Please sign in again to continue.", "unauthorized");
  }
  const client = createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await client.auth.getClaims(token);
  const sub = data?.claims?.sub;
  if (error || !sub) return jsonError(401, "Your session has expired. Please sign in again.", "unauthorized");
  return { userId: sub };
}

export function callImageEdit(opts: {
  apiKey: string;
  image: Blob;
  filename: string;
  prompt: string;
  size: string;
  stream: boolean;
}) {
  const form = new FormData();
  form.set("model", IMAGE_MODEL);
  form.set("prompt", opts.prompt);
  form.set("image", opts.image, opts.filename);
  form.set("size", opts.size);
  form.set("quality", "medium");
  if (opts.stream) {
    form.set("stream", "true");
    form.set("partial_images", "2");
  }
  return fetch(`${GATEWAY_BASE_URL}/v1/images/edits`, {
    method: "POST",
    headers: { Authorization: `Bearer ${opts.apiKey}` },
    body: form,
  });
}

/** Turns a gateway error status/body into a friendly, safe message. */
export function friendlyGatewayError(status: number, raw: unknown): { message: string; retryable: boolean } {
  const err = (raw as { error?: { message?: string; code?: string } } | null)?.error;
  const code = err?.code ?? "";
  if (code === "content_policy_violation" || code === "moderation_blocked") {
    return {
      message:
        "The AI safety system declined this photo or request. Try a different photo or instructions.",
      retryable: false,
    };
  }
  if (status === 429) return { message: "The AI service is busy right now. Please try again in a minute.", retryable: true };
  if (status === 402) return { message: "The AI service is temporarily unavailable (provider credits). Please try again later.", retryable: false };
  if (status === 401) return { message: "The AI service is not configured correctly. The site owner needs to fix the AI key.", retryable: false };
  if (status === 403) return { message: err?.message ?? "The AI service refused this request.", retryable: false };
  if (status === 400) return { message: err?.message ? `The AI service rejected the request: ${err.message}` : "The AI service rejected the request.", retryable: false };
  if (status >= 500) return { message: "The AI service had a temporary problem. Please try again.", retryable: true };
  return { message: err?.message ?? "Image generation failed.", retryable: false };
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

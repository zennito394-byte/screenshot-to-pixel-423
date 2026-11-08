// Browser client for /api/generate. Uses XHR so upload progress is real, and parses the SSE reply.
import { createParser } from "eventsource-parser";
import { supabase } from "@/integrations/supabase/client";

export type GenerateRequest = {
  image: Blob;
  width: number;
  height: number;
  category: string;
  style: string;
  customPrompt?: string;
  avoidPrompt?: string;
  aspectRatio: string;
  consent: boolean;
};

export type GenerateDone = {
  generationId: string;
  originalPath: string;
  resultPath: string;
  credits: number;
};

export class GenerateError extends Error {
  code: string;
  retryable: boolean;
  constructor(message: string, code = "error", retryable = false) {
    super(message);
    this.code = code;
    this.retryable = retryable;
  }
}

export type GenerateHandlers = {
  onUploadProgress?: (pct: number) => void;
  onStage?: (stage: "uploading" | "generating") => void;
  onPartial?: (dataUrl: string) => void;
};

export function newRequestId() {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function generateImage(req: GenerateRequest, handlers: GenerateHandlers = {}): Promise<GenerateDone> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new GenerateError("Please sign in again to continue.", "unauthorized");

  const form = new FormData();
  form.set("requestId", newRequestId());
  form.set("image", req.image, "photo.jpg");
  form.set("width", String(req.width));
  form.set("height", String(req.height));
  form.set("category", req.category);
  form.set("style", req.style);
  if (req.customPrompt?.trim()) form.set("customPrompt", req.customPrompt.trim());
  if (req.avoidPrompt?.trim()) form.set("avoidPrompt", req.avoidPrompt.trim());
  form.set("aspectRatio", req.aspectRatio);
  if (req.consent) form.set("consent", "true");

  return new Promise<GenerateDone>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/generate");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    let seen = 0;
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const parser = createParser({
      onEvent(evt) {
        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(evt.data);
        } catch {
          return;
        }
        if (evt.event === "status") handlers.onStage?.("generating");
        else if (evt.event === "partial" && typeof payload.b64 === "string") {
          handlers.onPartial?.(`data:image/png;base64,${payload.b64}`);
        } else if (evt.event === "done") {
          finish(() => resolve(payload as unknown as GenerateDone));
        } else if (evt.event === "error") {
          finish(() =>
            reject(
              new GenerateError(
                String(payload.message ?? "Generation failed."),
                "generation_failed",
                Boolean(payload.retryable),
              ),
            ),
          );
        }
      },
    });

    const isStream = () => (xhr.getResponseHeader("Content-Type") ?? "").includes("text/event-stream");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) handlers.onUploadProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.upload.onload = () => handlers.onStage?.("generating");

    xhr.onprogress = () => {
      if (xhr.status !== 200 || !isStream()) return;
      const chunk = xhr.responseText.slice(seen);
      seen = xhr.responseText.length;
      if (chunk) parser.feed(chunk);
    };

    xhr.onload = () => {
      if (xhr.status === 200 && isStream()) {
        const chunk = xhr.responseText.slice(seen);
        seen = xhr.responseText.length;
        if (chunk) parser.feed(chunk);
        finish(() =>
          reject(new GenerateError("The connection ended before the image was ready. Please try again.", "incomplete", true)),
        );
        return;
      }
      let message = "Something went wrong. Please try again.";
      let code = String(xhr.status);
      try {
        const body = JSON.parse(xhr.responseText) as { error?: { message?: string; code?: string } };
        if (body.error?.message) message = body.error.message;
        if (body.error?.code) code = body.error.code;
      } catch {
        if (xhr.status === 413) message = "This photo is too large to upload.";
      }
      const retryable = xhr.status >= 500 || xhr.status === 429 || xhr.status === 409;
      finish(() => reject(new GenerateError(message, code, retryable)));
    };

    xhr.onerror = () =>
      finish(() =>
        reject(new GenerateError("Network problem. Check your connection and try again.", "network", true)),
      );
    xhr.onabort = () => finish(() => reject(new GenerateError("The request was cancelled.", "aborted", true)));

    handlers.onStage?.("uploading");
    xhr.send(form);
  });
}

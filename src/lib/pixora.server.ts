// Server-only helpers for the generate route. Never import from browser code.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const TEXT_MODEL = "@cf/black-forest-labs/flux-1-schnell";
export const INPAINT_MODEL = "@cf/runwayml/stable-diffusion-v1-5-inpainting";
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

/** Calls Cloudflare Workers AI for photo editing using SD inpainting */
export async function callCloudflareImageEdit(opts: {
  accountId: string;
  apiToken: string;
  imageBytes: Uint8Array;
  prompt: string;
  numSteps?: number;
  strength?: number;
}): Promise<Uint8Array> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${opts.accountId}/ai/run/${INPAINT_MODEL}`;
  const imgArray = Array.from(opts.imageBytes);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: opts.prompt,
      image: imgArray,
      mask: imgArray,
      num_steps: opts.numSteps ?? 20,
      strength: opts.strength ?? 0.65,
    }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    throw new Error(friendlyCloudflareError(res.status, errJson).message);
  }

  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

/** Calls Cloudflare Workers AI FLUX.1 [schnell] for text-to-image */
export async function callCloudflareTextToImage(opts: {
  accountId: string;
  apiToken: string;
  prompt: string;
  steps?: number;
}): Promise<Uint8Array> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${opts.accountId}/ai/run/${TEXT_MODEL}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: opts.prompt,
      steps: opts.steps ?? 4,
    }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => null);
    throw new Error(friendlyCloudflareError(res.status, errJson).message);
  }

  const json = (await res.json()) as { result?: { image?: string } };
  if (!json?.result?.image) {
    throw new Error("Cloudflare did not return image data.");
  }
  return base64ToBytes(json.result.image);
}

/** Turns a Cloudflare error status/body into a friendly, safe message. */
export function friendlyCloudflareError(status: number, raw: unknown): { message: string; retryable: boolean } {
  const errs = (raw as { errors?: Array<{ message?: string; code?: number }> } | null)?.errors;
  const first = errs?.[0];
  const code = first?.code;
  const msg = first?.message ?? "";

  if (code === 3036 || status === 429) {
    return {
      message: "Daily free generation limit reached on Cloudflare. Resets at midnight UTC.",
      retryable: false,
    };
  }
  if (status === 401 || status === 403) {
    return {
      message: "The AI service credentials need attention. Please verify your Cloudflare token.",
      retryable: false,
    };
  }
  if (msg.includes("content") || msg.includes("moderation") || msg.includes("safety")) {
    return {
      message: "The AI safety system declined this request. Try a different photo or prompt.",
      retryable: false,
    };
  }
  if (status >= 500) {
    return {
      message: "Cloudflare Workers AI had a temporary issue. Please try again.",
      retryable: true,
    };
  }
  return {
    message: msg || "Image generation failed. Please try again.",
    retryable: true,
  };
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}


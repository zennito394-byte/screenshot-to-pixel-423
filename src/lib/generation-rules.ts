// Pure rules shared by the browser and the server. Covered by src/test/generation-rules.test.ts.
import { findStyle, type AspectRatioId } from "./pixora-catalog";

export const FREE_SIGNUP_CREDITS = 10;
export const CREDITS_PER_GENERATION = 1;
/** Temporary testing switch: while true, edits don't need or use credits. Set to false to charge again. */
export const CREDITS_PAUSED = true;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // what the server accepts
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024; // what the browser accepts before resizing
export const MAX_GENERATIONS_PER_HOUR = 10;
export const IN_FLIGHT_WINDOW_MINUTES = 5;
export const MAX_PROMPT_CHARS = 1500;
export const MAX_AVOID_CHARS = 400;

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export type UploadCheck = { ok: true } | { ok: false; reason: string };

export function checkSourceFile(file: { name: string; type: string; size: number }): UploadCheck {
  const name = file.name.toLowerCase();
  const typeOk = (ACCEPTED_TYPES as readonly string[]).includes(file.type);
  const extOk = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!typeOk && !extOk) {
    return { ok: false, reason: "Unsupported format. Please upload a JPG, JPEG, PNG or WEBP photo." };
  }
  if (file.size === 0) return { ok: false, reason: "This file is empty. Please choose another photo." };
  if (file.size > MAX_SOURCE_BYTES) {
    return { ok: false, reason: "This photo is larger than 15 MB. Please choose a smaller photo." };
  }
  return { ok: true };
}

/** Detects the real image type from the first bytes, ignoring the declared MIME type. */
export function sniffImageType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  )
    return "image/png";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  )
    return "image/webp";
  return null;
}

const round16 = (n: number) => Math.max(16, Math.round(n / 16) * 16);

/** Output size for the image model. Sides are multiples of 16, ratio clamped to 1:3–3:1. */
export function outputSizeFor(aspect: AspectRatioId, original?: { width: number; height: number }): string {
  switch (aspect) {
    case "1:1":
      return "1024x1024";
    case "4:5":
      return "1024x1280";
    case "3:4":
      return "1152x1536";
    case "16:9":
      return "1536x864";
    case "original": {
      if (!original || original.width <= 0 || original.height <= 0) return "auto";
      let ratio = original.width / original.height;
      ratio = Math.min(3, Math.max(1 / 3, ratio));
      const longSide = 1536;
      const w = ratio >= 1 ? longSide : longSide * ratio;
      const h = ratio >= 1 ? longSide / ratio : longSide;
      let width = round16(w);
      let height = round16(h);
      // keep at least ~655k pixels
      while (width * height < 655_360) {
        width += 16;
        height = round16(width / ratio);
      }
      return `${width}x${height}`;
    }
  }
}

const BLOCKED_PATTERNS: RegExp[] = [
  /\bnude\b/i,
  /\bnudes?\b/i,
  /\bnaked\b/i,
  /\bnudity\b/i,
  /\bundress(ed|ing)?\b/i,
  /\btopless\b/i,
  /\bnsfw\b/i,
  /\bporn/i,
  /\bsexual(ly)?\b/i,
  /\berotic\b/i,
  /\bexplicit\b/i,
  /\bremove (his|her|their|the) (clothes|clothing|shirt|top|bra|underwear)\b/i,
  /\bwithout (clothes|clothing)\b/i,
  /\blingerie\b/i,
  /\bdeep ?fake\b/i,
  /\bimpersonat/i,
  /\bmake (me|him|her|them) look like (a |the )?(president|celebrity|politician)\b/i,
  /\bfake (id|passport|driver'?s licen[cs]e|document)\b/i,
  /\bchild\b.*\b(sexy|sexual)\b/i,
];

export function moderatePrompt(text: string): UploadCheck {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        ok: false,
        reason:
          "This request can't be processed. PIXORA does not create intimate, sexual, impersonation or fake-identity edits.",
      };
    }
  }
  return { ok: true };
}

export type GenerationInput = {
  category: string;
  style: string;
  customPrompt?: string | undefined;
  avoidPrompt?: string | undefined;
};

export function buildEditPrompt(input: GenerationInput): string | null {
  const found = findStyle(input.category, input.style);
  if (!found) return null;
  const { category, style } = found;
  const custom = input.customPrompt?.trim();
  const avoid = input.avoidPrompt?.trim();
  if (category.id === "custom" && !custom) return null;

  const parts = [
    "Edit the provided photograph.",
    style.instruction,
    custom ? `Additional instructions from the user: "${custom}"` : "",
    `Keep unchanged: ${category.preserve}.`,
    avoid ? `Avoid the following: ${avoid}.` : "",
    "Output a single realistic, high-quality image with natural detail. No text, captions, watermarks or borders.",
  ];
  return parts.filter(Boolean).join("\n");
}

export type RateDecision = { allowed: true } | { allowed: false; status: 402 | 409 | 429; reason: string };

export function decideGenerationAllowed(state: {
  credits: number;
  inFlight: number;
  lastHourCount: number;
  creditsPaused?: boolean;
}): RateDecision {
  if (!state.creditsPaused && state.credits < CREDITS_PER_GENERATION) {
    return { allowed: false, status: 402, reason: "You've used all your free credits." };
  }
  if (state.inFlight > 0) {
    return {
      allowed: false,
      status: 409,
      reason: "A generation is already in progress. Please wait for it to finish.",
    };
  }
  if (state.lastHourCount >= MAX_GENERATIONS_PER_HOUR) {
    return {
      allowed: false,
      status: 429,
      reason: `You've reached the limit of ${MAX_GENERATIONS_PER_HOUR} generations per hour. Please try again later.`,
    };
  }
  return { allowed: true };
}

import { describe, expect, it } from "vitest";

import {
  buildEditPrompt,
  checkSourceFile,
  CREDITS_PAUSED,
  decideGenerationAllowed,
  FREE_SIGNUP_CREDITS,
  MAX_GENERATIONS_PER_HOUR,
  moderatePrompt,
  outputSizeFor,
  sniffImageType,
} from "@/lib/generation-rules";

describe("credits and limits", () => {
  it("gives 10 free credits on signup", () => {
    expect(FREE_SIGNUP_CREDITS).toBe(10);
  });

  it("blocks generation with 0 credits (402)", () => {
    const d = decideGenerationAllowed({ credits: 0, inFlight: 0, lastHourCount: 0 });
    expect(d).toMatchObject({ allowed: false, status: 402 });
  });

  it("allows generation with 1 credit left", () => {
    expect(decideGenerationAllowed({ credits: 1, inFlight: 0, lastHourCount: 0 })).toEqual({ allowed: true });
  });

  it("allows edits with 0 credits while credits are paused", () => {
    expect(decideGenerationAllowed({ credits: 0, inFlight: 0, lastHourCount: 0, creditsPaused: true })).toEqual({ allowed: true });
  });

  it("still limits 10 per hour while credits are paused", () => {
    expect(
      decideGenerationAllowed({ credits: 0, inFlight: 0, lastHourCount: 10, creditsPaused: true }),
    ).toMatchObject({ allowed: false, status: 429 });
  });

  it("allows only one generation at a time (409)", () => {
    const d = decideGenerationAllowed({ credits: 5, inFlight: 1, lastHourCount: 0 });
    expect(d).toMatchObject({ allowed: false, status: 409 });
  });

  it("limits to 10 generations per hour (429 on the 11th)", () => {
    expect(MAX_GENERATIONS_PER_HOUR).toBe(10);
    expect(decideGenerationAllowed({ credits: 5, inFlight: 0, lastHourCount: 9 })).toEqual({ allowed: true });
    expect(decideGenerationAllowed({ credits: 5, inFlight: 0, lastHourCount: 10 })).toMatchObject({
      allowed: false,
      status: 429,
    });
  });
});

describe("upload validation", () => {
  it("accepts JPG, PNG and WEBP", () => {
    expect(checkSourceFile({ name: "a.jpg", type: "image/jpeg", size: 1000 }).ok).toBe(true);
    expect(checkSourceFile({ name: "a.png", type: "image/png", size: 1000 }).ok).toBe(true);
    expect(checkSourceFile({ name: "a.webp", type: "image/webp", size: 1000 }).ok).toBe(true);
  });

  it("rejects other formats, empty files and files over 15 MB", () => {
    expect(checkSourceFile({ name: "a.gif", type: "image/gif", size: 1000 }).ok).toBe(false);
    expect(checkSourceFile({ name: "a.jpg", type: "image/jpeg", size: 0 }).ok).toBe(false);
    expect(checkSourceFile({ name: "a.jpg", type: "image/jpeg", size: 15 * 1024 * 1024 + 1 }).ok).toBe(false);
  });

  it("detects the real image type from file bytes", () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffImageType(new TextEncoder().encode("<html>not an image</html>"))).toBeNull();
  });
});

describe("prompts and safety", () => {
  it("blocks intimate or impersonation requests", () => {
    expect(moderatePrompt("make her naked").ok).toBe(false);
    expect(moderatePrompt("create a deepfake of him").ok).toBe(false);
    expect(moderatePrompt("give me a blue blazer").ok).toBe(true);
  });

  it("requires instructions for custom edits and rejects unknown styles", () => {
    expect(buildEditPrompt({ category: "custom", style: "custom" })).toBeNull();
    expect(buildEditPrompt({ category: "portraits", style: "does-not-exist" })).toBeNull();
    expect(buildEditPrompt({ category: "portraits", style: "professional" })).toContain("facial identity");
  });

  it("maps aspect ratios to output sizes", () => {
    expect(outputSizeFor("1:1")).toBe("1024x1024");
    expect(outputSizeFor("4:5")).toBe("1024x1280");
    expect(outputSizeFor("16:9")).toBe("1536x864");
  });
});

import { describe, expect, it } from "vitest";
import { ADMIN_CREDIT_LIMIT, parseCreditAmount } from "@/lib/admin-data";

describe("admin credit amount", () => {
  it("accepts a whole number of credits", () => {
    expect(parseCreditAmount(" 50 ")).toEqual({ ok: true, value: 50 });
  });
  it("rejects zero", () => {
    expect(parseCreditAmount("0").ok).toBe(false);
  });
  it("rejects more than 10000 at once", () => {
    expect(ADMIN_CREDIT_LIMIT).toBe(10000);
    expect(parseCreditAmount("10001").ok).toBe(false);
    expect(parseCreditAmount("10000")).toEqual({ ok: true, value: 10000 });
  });
  it("rejects decimals and negatives", () => {
    expect(parseCreditAmount("1.5").ok).toBe(false);
    expect(parseCreditAmount("-5").ok).toBe(false);
  });
});

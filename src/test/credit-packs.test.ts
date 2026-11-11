import { describe, expect, it } from "vitest";
import { CREDIT_PACKS, centsPerCredit, formatPrice, getPack } from "@/lib/credit-packs";

describe("credit packs", () => {
  it("Starter is 50 credits for $5", () => {
    expect(getPack("starter")).toMatchObject({ credits: 50, priceCents: 500 });
  });
  it("Creator is 150 credits for $12", () => {
    expect(getPack("creator")).toMatchObject({ credits: 150, priceCents: 1200 });
  });
  it("Pro is 500 credits for $35", () => {
    expect(getPack("pro")).toMatchObject({ credits: 500, priceCents: 3500 });
  });
  it("bigger packs never cost more per credit", () => {
    const rates = CREDIT_PACKS.map(centsPerCredit);
    for (let i = 1; i < rates.length; i++) expect(rates[i]).toBeLessThanOrEqual(rates[i - 1]!);
  });
  it("unknown packs are rejected", () => {
    expect(getPack("free-forever")).toBeUndefined();
  });
  it("formats whole-dollar prices without cents", () => {
    expect(formatPrice(1200)).toBe("$12");
    expect(formatPrice(499)).toBe("$4.99");
  });
});

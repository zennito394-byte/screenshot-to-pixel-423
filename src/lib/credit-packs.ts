// Credit packs sold manually (no card payments yet). The database function
// `credit_pack_info` holds the same list and is the source of truth for what gets granted.
export type CreditPackId = "starter" | "creator" | "pro";

export type CreditPack = {
  id: CreditPackId;
  name: string;
  credits: number;
  priceCents: number;
  blurb: string;
  popular?: boolean;
};

export const CURRENCY = "USD";

export const CREDIT_PACKS: CreditPack[] = [
  { id: "starter", name: "Starter", credits: 50, priceCents: 500, blurb: "Try a few looks and keep your favourites." },
  { id: "creator", name: "Creator", credits: 150, priceCents: 1200, blurb: "For regular portraits, outfits and art.", popular: true },
  { id: "pro", name: "Pro", credits: 500, priceCents: 3500, blurb: "Best value for heavy creators and small teams." },
];

export function getPack(id: string) {
  return CREDIT_PACKS.find((p) => p.id === id);
}

export function formatPrice(cents: number, currency = CURRENCY) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
}

/** Price per credit in cents, rounded to one decimal. */
export function centsPerCredit(pack: Pick<CreditPack, "credits" | "priceCents">) {
  return Math.round((pack.priceCents / pack.credits) * 10) / 10;
}

export function requestErrorMessage(raw: string | undefined) {
  if (!raw) return "Something went wrong. Please try again.";
  if (raw.includes("request_pending")) return "You already have a pending request. We'll process it soon, or cancel it to pick another pack.";
  if (raw.includes("unknown_pack")) return "That pack isn't available.";
  if (raw.includes("not_signed_in")) return "Please sign in first.";
  return "Couldn't send your request. Please try again.";
}

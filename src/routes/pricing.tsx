import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Coins, Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHero, SiteLayout } from "@/components/pixora/SiteLayout";
import { CONTACT_EMAIL } from "@/components/pixora/SiteFooter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { myCreditRequestsQuery } from "@/lib/admin-data";
import { CREDIT_PACKS, centsPerCredit, formatPrice, getPack, requestErrorMessage, type CreditPack } from "@/lib/credit-packs";
import { FREE_SIGNUP_CREDITS } from "@/lib/generation-rules";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing & credits — PIXORA AI" },
      { name: "description", content: "Start free, then buy credit packs for more AI photo edits. One credit per finished photo — failed edits are never charged." },
      { property: "og:title", content: "Pricing & credits — PIXORA AI" },
      { property: "og:description", content: "Start free, then top up with simple credit packs. No subscription." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const { session } = useAuth();
  const [picked, setPicked] = useState<CreditPack | null>(null);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Pricing"
        title={<>Simple credits. <span className="text-gradient">No subscription.</span></>}
        intro="Every finished photo uses 1 credit. If an edit fails, you're never charged."
      />

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="grid gap-5 md:grid-cols-4">
          <div className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-card">
            <p className="text-sm font-semibold text-muted-foreground">Free</p>
            <p className="mt-3 font-display text-4xl font-bold">$0</p>
            <p className="mt-1 text-sm text-muted-foreground">{FREE_SIGNUP_CREDITS} credits when you sign up</p>
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              <Feature>All editing styles</Feature>
              <Feature>Private gallery</Feature>
              <Feature>Full-quality downloads</Feature>
            </ul>
            <Button asChild variant="glass" className="mt-6">
              {session ? <Link to="/dashboard">Open dashboard</Link> : <Link to="/auth" search={{ mode: "signup" }}>Sign up free</Link>}
            </Button>
          </div>

          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={
                pack.popular
                  ? "relative flex flex-col rounded-3xl border border-primary/60 bg-card p-6 shadow-glow"
                  : "flex flex-col rounded-3xl border border-border bg-card p-6 shadow-card"
              }
            >
              {pack.popular ? (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-gradient-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
                  <Sparkles className="size-3" aria-hidden /> Most popular
                </span>
              ) : null}
              <p className="text-sm font-semibold text-muted-foreground">{pack.name}</p>
              <p className="mt-3 font-display text-4xl font-bold">{formatPrice(pack.priceCents)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {pack.credits} credits · {centsPerCredit(pack)}¢ each
              </p>
              <p className="mt-5 flex-1 text-sm">{pack.blurb}</p>
              {session ? (
                <Button variant={pack.popular ? "hero" : "glass"} className="mt-6" onClick={() => setPicked(pack)}>
                  <Coins /> Buy {pack.credits} credits
                </Button>
              ) : (
                <Button asChild variant={pack.popular ? "hero" : "glass"} className="mt-6">
                  <Link to="/auth" search={{ mode: "signup", redirect: "/pricing" }}>Sign up to buy</Link>
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Prices in US dollars. Credits never expire. Card checkout is coming soon — for now we send you payment details by email and add your credits as soon as payment arrives.
        </p>
      </section>

      {session ? <MyRequests /> : null}

      <BuyDialog pack={picked} onClose={() => setPicked(null)} />
    </SiteLayout>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <Check className="size-4 text-primary" aria-hidden /> {children}
    </li>
  );
}

function BuyDialog({ pack, onClose }: { pack: CreditPack | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!pack) return;
    setBusy(true);
    const { error } = await supabase.rpc("request_credit_pack", { _pack: pack.id, _note: note });
    setBusy(false);
    if (error) {
      toast.error(requestErrorMessage(error.message));
      return;
    }
    toast.success("Request sent! We'll email you payment details shortly.");
    setNote("");
    void queryClient.invalidateQueries({ queryKey: ["my-credit-requests"] });
    onClose();
  }

  return (
    <Dialog open={Boolean(pack)} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className="border-border bg-card">
        <DialogHeader>
          <DialogTitle>
            {pack?.name} — {pack?.credits} credits for {pack ? formatPrice(pack.priceCents) : ""}
          </DialogTitle>
          <DialogDescription>
            We'll email you payment details to the address on your account. Your credits are added as soon as payment is confirmed — usually within a day.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label htmlFor="buy-note" className="text-sm font-medium">
            Anything we should know? <span className="text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            id="buy-note"
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. preferred payment method or a phone number"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="hero" onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Coins />} Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Waiting for payment",
  approved: "Credits added",
  declined: "Declined",
  cancelled: "Cancelled",
};

function MyRequests() {
  const queryClient = useQueryClient();
  const requests = useQuery(myCreditRequestsQuery());
  if (!requests.data?.length) return null;

  async function cancel(id: string) {
    const { error } = await supabase.rpc("cancel_credit_request", { _id: id });
    if (error) {
      toast.error("Couldn't cancel this request.");
      return;
    }
    toast.success("Request cancelled");
    void queryClient.invalidateQueries({ queryKey: ["my-credit-requests"] });
  }

  return (
    <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      <h2 className="mb-3 text-lg font-bold">Your requests</h2>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {requests.data.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div>
              <p className="font-semibold">
                {getPack(r.pack)?.name ?? r.pack} · {r.credits} credits · {formatPrice(r.price_cents, r.currency)}
              </p>
              <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                {r.status === "pending" ? <Clock className="size-3" aria-hidden /> : null}
                {STATUS_LABEL[r.status] ?? r.status}
              </span>
              {r.status === "pending" ? (
                <Button size="sm" variant="ghost" onClick={() => cancel(r.id)}>
                  <X /> Cancel
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Questions about a payment? Email <a className="text-primary" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </section>
  );
}

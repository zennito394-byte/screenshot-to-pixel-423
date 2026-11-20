import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Coins, Crown, ImagePlus, Images, Sparkles } from "lucide-react";

import { AppShell } from "@/components/pixora/AppShell";
import { CreationCard } from "@/components/pixora/CreationCard";
import { CATEGORY_IMAGES } from "@/components/pixora/showcase";
import { Button } from "@/components/ui/button";
import { DAILY_FREE_CREDITS, FREE_SIGNUP_CREDITS } from "@/lib/generation-rules";
import { CATEGORIES, type CategoryId } from "@/lib/pixora-catalog";
import { creationsQuery, creditsQuery, profileQuery, signedUrlsQuery } from "@/lib/pixora-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Dashboard — Musafa AI" },
      { name: "description", content: "Your Musafa AI dashboard: credits, recent creations, and iconic African retro archetypes." },
      { property: "og:title", content: "Dashboard — Musafa AI" },
      { property: "og:description", content: "Your Musafa AI dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const POPULAR: { category: CategoryId; style: string }[] = [
  { category: "portraits", style: "vintage-70s" },
  { category: "fashion", style: "botswana-kgosi" },
  { category: "portraits", style: "vintage-80s" },
  { category: "artistic", style: "afrofuturist-cyborg" },
];

function popularStyles() {
  return POPULAR.flatMap(({ category, style }) => {
    const cat = CATEGORIES.find((c) => c.id === category);
    if (!cat) return [];
    const s = cat.styles.find((x) => x.id === style) ?? cat.styles[0];
    if (!s) return [];
    return [{ category: cat, style: s }];
  });
}

function Dashboard() {
  const profile = useQuery(profileQuery());
  const credits = useQuery(creditsQuery());
  const recent = useQuery(creationsQuery({ savedOnly: false, limit: 4 }));
  const paths = (recent.data ?? []).map((g) => g.result_path).filter((p): p is string => Boolean(p));
  const urls = useQuery(signedUrlsQuery(paths));
  const remaining = credits.data?.credits ?? 0;
  const pct = Math.min(100, Math.round((remaining / FREE_SIGNUP_CREDITS) * 100));
  const firstName = profile.data?.display_name?.split(" ")[0];

  return (
    <AppShell>
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Time Machine Studio</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Welcome back{firstName ? `, ${firstName}` : ""}</h1>
          <p className="mt-2 text-muted-foreground">Pick an iconic archetype or prompt to travel through African cultural eras.</p>
        </div>
        <Button asChild variant="hero" size="lg">
          <Link to="/studio" search={{ category: undefined, style: undefined, from: undefined, use: undefined }}>
            <Sparkles /> Generate portrait
          </Link>
        </Button>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card md:col-span-2">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Coins className="size-4 text-primary" aria-hidden /> Remaining credits
            </p>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
              {credits.data?.plan ?? "free"} plan
            </span>
          </div>
          <p className="mt-2 font-display text-5xl font-bold text-gradient">
            {credits.isLoading ? "…" : credits.isError ? "—" : remaining}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface" aria-hidden>
            <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Each successful portrait uses 1 credit. Failed attempts are never charged. Daily balance resets back up to {DAILY_FREE_CREDITS} every midnight.
          </p>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-primary/40 bg-card p-6 shadow-glow">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/20 blur-3xl" aria-hidden />
          <Crown className="size-6 text-primary" aria-hidden />
          <h2 className="mt-3 text-lg font-bold">Need more credits?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Top up your balance anytime with instant credit packs.
          </p>
          <Button asChild variant="hero" className="mt-4">
            <Link to="/pricing">View credit packs</Link>
          </Button>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-bold">Recent portraits</h2>
          {recent.data?.length ? (
            <Link to="/creations" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              View all <ArrowRight className="size-4" aria-hidden />
            </Link>
          ) : null}
        </div>
        {recent.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        ) : recent.isError ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            We couldn't load your recent creations. Please refresh the page.
          </p>
        ) : recent.data?.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recent.data.map((g) => (
              <CreationCard key={g.id} gen={g} url={g.result_path ? urls.data?.[g.result_path] : undefined} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
            <Images className="size-8 text-muted-foreground" aria-hidden />
            <p className="mt-3 font-semibold">No portraits yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Your generated portraits will appear here.</p>
            <Button asChild variant="hero" className="mt-5">
              <Link to="/studio" search={{ category: undefined, style: undefined, from: undefined, use: undefined }}>
                <ImagePlus /> Generate your first
              </Link>
            </Button>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold">Popular eras & archetypes</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {popularStyles().map(({ category, style }) => (
            <Link
              key={`${category.id}-${style.id}`}
              to="/studio"
              search={{ category: category.id, style: style.id, from: undefined, use: undefined }}
              className="group relative block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-transform hover:-translate-y-0.5"
            >
              <div className="aspect-[4/5]">
                <img
                  src={CATEGORY_IMAGES[category.id]}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent p-3 pt-10">
                <p className="text-sm font-semibold">{style.label}</p>
                <p className="text-[11px] text-muted-foreground">{category.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

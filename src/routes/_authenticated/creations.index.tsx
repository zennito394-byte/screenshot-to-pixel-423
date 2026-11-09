import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ImagePlus, Images } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/pixora/AppShell";
import { CreationCard } from "@/components/pixora/CreationCard";
import { Button } from "@/components/ui/button";
import { creationsQuery, signedUrlsQuery } from "@/lib/pixora-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/creations/")({
  head: () => ({
    meta: [
      { title: "My Creations — PIXORA AI" },
      { name: "description", content: "All your AI-edited photos in one private gallery." },
      { property: "og:title", content: "My Creations — PIXORA AI" },
      { property: "og:description", content: "Your private gallery of AI-edited photos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Creations,
});

function Creations() {
  const [savedOnly, setSavedOnly] = useState(false);
  const list = useQuery(creationsQuery({ savedOnly }));
  const paths = (list.data ?? []).map((g) => g.result_path).filter((p): p is string => Boolean(p));
  const urls = useQuery(signedUrlsQuery(paths));

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Gallery</p>
          <h1 className="mt-1 text-3xl font-bold">My Creations</h1>
        </div>
        <div className="inline-flex rounded-xl border border-border bg-surface p-1" role="group" aria-label="Filter">
          {[
            { v: false, label: "All" },
            { v: true, label: "Saved" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={savedOnly === o.v}
              onClick={() => setSavedOnly(o.v)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium",
                savedOnly === o.v ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {list.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : list.isError ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center">
          <p>{list.error.message}</p>
          <Button variant="outline" className="mt-3" onClick={() => list.refetch()}>
            Try again
          </Button>
        </div>
      ) : list.data && list.data.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.data.map((g) => (
            <CreationCard key={g.id} gen={g} url={g.result_path ? urls.data?.[g.result_path] : undefined} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-brand-soft">
            <Images className="size-6 text-primary" />
          </span>
          <h2 className="mt-4 text-lg font-bold">{savedOnly ? "Nothing saved yet" : "No creations yet"}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {savedOnly ? "Tap Save on any result to keep it here." : "Upload a photo in the studio and your results will appear here."}
          </p>
          <Button asChild variant="hero" className="mt-5">
            <Link to="/studio">
              <ImagePlus /> Open the studio
            </Link>
          </Button>
        </div>
      )}
    </AppShell>
  );
}

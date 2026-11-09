import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { findStyle } from "@/lib/pixora-catalog";
import type { Generation } from "@/lib/pixora-data";

export function styleLabel(gen: Pick<Generation, "category" | "style">) {
  const found = findStyle(gen.category, gen.style);
  return found ? (found.category.id === "custom" ? "Custom edit" : `${found.style.label} · ${found.category.label}`) : gen.style;
}

export function CreationCard({ gen, url }: { gen: Generation; url: string | undefined }) {
  return (
    <Link
      to="/creations/$id"
      params={{ id: gen.id }}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-transform hover:-translate-y-0.5"
    >
      <div className="aspect-[4/5] bg-surface">
        {url ? (
          <img src={url} alt={styleLabel(gen)} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full animate-pulse bg-surface-raised" />
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-3 pt-8">
        <p className="truncate text-xs font-semibold">{styleLabel(gen)}</p>
        <p className="text-[11px] text-muted-foreground">{new Date(gen.created_at).toLocaleDateString()}</p>
      </div>
      {gen.saved ? (
        <span className="absolute right-2 top-2 rounded-full glass p-1.5" aria-label="Saved">
          <Heart className="size-3.5 fill-primary text-primary" />
        </span>
      ) : null}
    </Link>
  );
}

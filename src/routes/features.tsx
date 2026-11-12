import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, SiteLayout } from "@/components/pixora/SiteLayout";
import { CATEGORY_IMAGES } from "@/components/pixora/showcase";
import { CATEGORIES } from "@/lib/pixora-catalog";
import { FREE_SIGNUP_CREDITS } from "@/lib/generation-rules";

export const Route = createFileRoute("/features")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Features — PIXORA AI photo editing studio" },
      { name: "description", content: "AI portraits, fashion, hairstyles, backgrounds, art styles and custom AI edits — all in one studio." },
      { property: "og:title", content: "Features — PIXORA AI photo editing studio" },
      { property: "og:description", content: "Explore every PIXORA AI editing category and studio tool." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeaturesPage,
});

const STUDIO = [
  "Drag-and-drop upload with live preview",
  "JPG, JPEG, PNG and WEBP up to 15 MB",
  "Automatic resizing and location-data removal",
  "Output shapes: 1:1, 4:5, 3:4, 16:9 or original",
  "Custom instructions plus a ‘things to avoid’ field",
  "Before/after slider, download, regenerate and save",
  `${FREE_SIGNUP_CREDITS} free credits — charged only on success`,
  "Private gallery with one-tap deletion",
];

function FeaturesPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Features"
        title={<>A full AI studio <span className="text-gradient">in your pocket</span></>}
        intro="Six editing studios powered by a genuine image-to-image AI model, designed for phones first."
      />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {CATEGORIES.map((cat) => (
            <article key={cat.id} className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card sm:flex-row">
              <img src={CATEGORY_IMAGES[cat.id]} alt="" loading="lazy" width={800} height={1000} className="h-48 w-full object-cover sm:h-auto sm:w-44" />
              <div className="flex-1 p-6">
                <h2 className="text-xl font-bold">{cat.label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{cat.tagline}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {cat.styles.map((s) => (
                    <li key={s.id} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{s.label}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
        <div className="rounded-[2rem] border border-border bg-card p-8 shadow-card sm:p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">Studio tools</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {STUDIO.map((item) => (
              <li key={item} className="flex gap-3 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {item}
              </li>
            ))}
          </ul>
          <Button asChild variant="hero" size="lg" className="mt-8">
            <Link to="/auth" search={{ mode: "signup" }}>Start Creating <ArrowRight /></Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}

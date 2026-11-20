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
      { title: "Features — Musafa AI Retro Time Machine" },
      { name: "description", content: "Explore African vintage eras, royal heritage attire, hairstyles, and iconic cultural portraits with Musafa AI." },
      { property: "og:title", content: "Features — Musafa AI Retro Time Machine" },
      { property: "og:description", content: "Explore Musafa AI archetypes, vintage eras, and portrait studio tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeaturesPage,
});

const STUDIO = [
  "Curated African vintage eras (50s Sophiatown, 70s Soul, 80s & 90s)",
  "Royal heritage archetypes (Botswana Kgosi, West African Agbada, Haute Couture)",
  "Output aspect ratios: 1:1, 4:5, 3:4, 16:9, and widescreen",
  "Custom prompt controls with negative avoidance guidance",
  "Instant high-definition download and prompt re-use",
  `${FREE_SIGNUP_CREDITS} free credits upon sign up — charged only on successful generations`,
  "Daily free credit top-up every night at midnight",
  "Private personal gallery with instant one-tap deletion",
];

function FeaturesPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Features & Eras"
        title={<>An African cultural time machine <span className="text-gradient">in your pocket</span></>}
        intro="Step into iconic retro decades and royal styling powered by advanced AI portrait generation."
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
          <h2 className="text-2xl font-bold sm:text-3xl">Studio capabilities</h2>
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

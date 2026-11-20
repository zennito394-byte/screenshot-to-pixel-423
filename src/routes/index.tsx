import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Camera,
  Crown,
  Download,
  History,
  Lock,
  Radio,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SiteLayout } from "@/components/pixora/SiteLayout";
import { CATEGORY_IMAGES } from "@/components/pixora/showcase";
import { CATEGORIES } from "@/lib/pixora-catalog";
import { DAILY_FREE_CREDITS, FREE_SIGNUP_CREDITS } from "@/lib/generation-rules";
import { useAuth } from "@/hooks/use-auth";

const seoDescription =
  "Step back into iconic eras with Musafa AI. Generate authentic 35mm African retro portraits, Setswana royal heritage, 70s disco funk, 80s township nostalgia, and Afrofuturistic art in seconds.";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Musafa AI – African Retro Time Machine & AI Cultural Portraits" },
      {
        name: "description",
        content: seoDescription,
      },
      {
        property: "og:title",
        content: "Musafa AI – African Retro Time Machine & AI Cultural Portraits",
      },
      {
        property: "og:description",
        content: seoDescription,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function StartCta({ size = "xl" as const }: { size?: "lg" | "xl" }) {
  const { session } = useAuth();
  return (
    <Button asChild variant="hero" size={size}>
      {session ? (
        <Link to="/studio">
          Enter Time Machine <ArrowRight />
        </Link>
      ) : (
        <Link to="/auth" search={{ mode: "signup" }}>
          Start Creating Free <ArrowRight />
        </Link>
      )}
    </Button>
  );
}

const STEPS = [
  {
    icon: History,
    title: "1. Pick an Era or Archetype",
    text: "Choose from 70s Afro Funk, 80s Township Retro, Setswana Royal Heritage, Okavango Sunset, or Afrofuturism.",
  },
  {
    icon: Wand2,
    title: "2. Generate with One Click",
    text: "Zero prompting required. Our AI engine automatically crafts era-accurate 35mm film textures, lighting, and cultural styling.",
  },
  {
    icon: Download,
    title: "3. Download & Go Viral",
    text: "Save high-resolution portraits instantly formatted for WhatsApp Status, Instagram, and TikTok.",
  },
];

const HIGHLIGHTS = [
  {
    icon: Camera,
    title: "Authentic 35mm Film Grain",
    text: "Warm analog color tones, natural film grain, and cinematic golden-hour lighting inspired by classic African photography.",
  },
  {
    icon: Crown,
    title: "Royal Cultural Heritage",
    text: "Kaross fur mantles, imperial Agbada with gold thread embroidery, and traditional woven crowns.",
  },
  {
    icon: Zap,
    title: "Zero-Prompt Simplicity",
    text: "No complicated prompt writing needed. Every archetype is pre-engineered for instant, photorealistic results.",
  },
  {
    icon: Sparkles,
    title: `${DAILY_FREE_CREDITS} Free Daily Credits`,
    text: `Start with ${FREE_SIGNUP_CREDITS} free credits on signup, plus ${DAILY_FREE_CREDITS} free credits refreshed automatically every single night at midnight.`,
  },
];

const RETRO_FAQS = [
  {
    q: "What is the African Retro Time Machine?",
    a: "Musafa AI is a cultural portrait studio that transports you into legendary cultural eras and archetypes—including 70s Soul & Funk, 80s Township Retro, Setswana Royal Heritage, 1950s Jazz Lounges, and Afrofuturistic visions—with zero prompting needed.",
  },
  {
    q: "Do I have to upload a photo to generate?",
    a: "No! You can generate breathtaking retro portraits instantly by picking any era or archetype and clicking Generate. You can also upload a reference photo optionally if you want.",
  },
  {
    q: "How many free generations do I get?",
    a: `Every new account starts with ${FREE_SIGNUP_CREDITS} free credits. In addition, every night at midnight (Botswana time), your balance is topped back up to ${DAILY_FREE_CREDITS} free credits. You can create fresh portraits every day for free.`,
  },
  {
    q: "Can I download and share my creations?",
    a: "Yes! Every portrait can be downloaded in high resolution and shared directly to your WhatsApp Status, TikTok, Instagram, or profile pictures.",
  },
  {
    q: "Are my creations private?",
    a: "Yes. All your generated portraits are saved securely in your private gallery under My Creations, visible only to you.",
  },
];

function Index() {
  return (
    <SiteLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-aurora" aria-hidden />
        <div className="absolute inset-0 grid-fade" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:pb-24">
          <div className="animate-rise">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border glass px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
              <span className="size-2 animate-glow-pulse rounded-full bg-gradient-brand" />
              Musafa AI · African Retro Time Machine
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Step Back Into <span className="text-gradient">Iconic Cultural Eras</span>.
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              Generate authentic 35mm vintage portraits, Setswana royal heritage, 70s disco-funk, 80s township nostalgia, and Afrofuturistic visions in seconds. Zero prompting required.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <StartCta />
              <Button asChild variant="glass" size="xl">
                <Link to="/features">Explore Eras & Styles</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              {FREE_SIGNUP_CREDITS} free signup credits · {DAILY_FREE_CREDITS} daily free top-ups · No card needed
            </p>
          </div>

          {/* Hero Featured Card */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-brand opacity-30 blur-3xl" aria-hidden />
            <div className="relative overflow-hidden rounded-3xl border border-primary/40 bg-card p-3 shadow-2xl ring-1 ring-primary/20">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-black">
                <img
                  src={CATEGORY_IMAGES["portraits"]}
                  alt="70s Afro Funk retro portrait example"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="inline-block rounded-full bg-primary/20 px-2.5 py-1 text-[11px] font-semibold text-primary backdrop-blur-md">
                        1970s Era · 35mm Kodachrome
                      </span>
                      <h3 className="mt-1 text-lg font-bold text-white">70s Afro Funk & Soul</h3>
                    </div>
                    <span className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                      FLUX AI
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Radio className="size-3 text-primary animate-pulse" /> Live Archetype Preview
                </span>
                <span>Analog Film Aesthetics</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Eras & Cultural Archetypes Showcase */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Explore Time Periods</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">The Cultural Archetypes</h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            From imperial dynasties to vintage golden ages and Afrofuturistic visions. Choose your style in Studio.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to="/studio"
              search={{ category: cat.id }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-300 hover:border-primary/50 hover:shadow-glow"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
                <img
                  src={CATEGORY_IMAGES[cat.id]}
                  alt={cat.label}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <span className="absolute right-3 top-3 rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-md">
                  {cat.styles.length} styles
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{cat.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{cat.tagline}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary">
                  <span>Enter era</span>
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3 Simple Steps */}
      <section className="border-y border-border/60 bg-surface/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">How It Works</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Travel Through Time in 3 Taps</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              No complicated prompting or AI knowledge needed. Everything is pre-tuned for instant elegance.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, idx) => (
              <div
                key={idx}
                className="relative flex flex-col items-center rounded-3xl border border-border bg-card p-6 text-center shadow-card"
              >
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-brand-soft text-primary shadow-glow mb-4">
                  <step.icon className="size-6" />
                </div>
                <h3 className="text-base font-bold">{step.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights & Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Why Musafa AI</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Crafted for Cultural Elegance</h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((item, idx) => (
            <div key={idx} className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <item.icon className="size-6" />
              </div>
              <h3 className="text-base font-bold">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-border/60 bg-surface/30 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Got Questions?</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Frequently Asked Questions</h2>
          </div>
          <div className="mt-10">
            <Accordion type="single" collapsible className="space-y-3">
              {RETRO_FAQS.map((faq, idx) => (
                <AccordionItem
                  key={idx}
                  value={`faq-${idx}`}
                  className="rounded-2xl border border-border bg-card px-5 shadow-card"
                >
                  <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/40 bg-gradient-brand-soft p-8 text-center sm:p-14">
          <div className="mx-auto max-w-2xl space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              Ready to Travel Back in Time?
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Create your first retro cultural portrait right now for free.
            </p>
            <div className="pt-4">
              <StartCta size="xl" />
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

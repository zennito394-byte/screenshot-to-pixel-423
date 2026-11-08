import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download, ImageUp, Lock, ShieldCheck, Sparkles, Wand2, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BeforeAfter } from "@/components/pixora/BeforeAfter";
import { SiteLayout } from "@/components/pixora/SiteLayout";
import { CATEGORY_IMAGES, SHOWCASE } from "@/components/pixora/showcase";
import { FAQS } from "@/components/pixora/faq-data";
import { CATEGORIES } from "@/lib/pixora-catalog";
import { FREE_SIGNUP_CREDITS } from "@/lib/generation-rules";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PIXORA AI — Turn Your Imagination Into Reality" },
      {
        name: "description",
        content:
          "Upload a photo and transform it with real AI: studio portraits, new outfits, hairstyles, backgrounds and art styles.",
      },
      { property: "og:title", content: "PIXORA AI — Turn Your Imagination Into Reality" },
      {
        property: "og:description",
        content: "Your Photo. Your Imagination. AI. Real image-to-image editing for portraits, fashion, hair and art.",
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
        <Link to="/dashboard">
          Start Creating <ArrowRight />
        </Link>
      ) : (
        <Link to="/auth" search={{ mode: "signup" }}>
          Start Creating <ArrowRight />
        </Link>
      )}
    </Button>
  );
}

const STEPS = [
  { icon: ImageUp, title: "Upload a photo", text: "Drag and drop or pick a JPG, PNG or WEBP from your phone or computer." },
  { icon: Wand2, title: "Choose a style", text: "Pick a portrait, outfit, hairstyle, background or art style — or describe your own edit." },
  { icon: Sparkles, title: "Generate with AI", text: "A real image-editing model transforms your photo while keeping you recognisable." },
  { icon: Download, title: "Compare & download", text: "Slide between before and after, save to your gallery and download in high quality." },
];

const FEATURES = [
  { icon: Zap, title: "Genuine AI editing", text: "Every result is created live from your photo by a state-of-the-art image model." },
  { icon: ShieldCheck, title: "Identity-aware", text: "Prompts are engineered to preserve your face and features across every style." },
  { icon: Lock, title: "Private by default", text: "Photos live in private storage only you can access. Delete anything, anytime." },
  { icon: Sparkles, title: "Fair credits", text: `Start with ${FREE_SIGNUP_CREDITS} free credits. Failed generations are never charged.` },
];

function Index() {
  const hero = SHOWCASE[0]!;
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-aurora" aria-hidden />
        <div className="absolute inset-0 grid-fade" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:pb-24">
          <div className="animate-rise">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <span className="size-1.5 animate-glow-pulse rounded-full bg-gradient-brand" />
              Your Photo. Your Imagination. AI.
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
              Turn Your <span className="text-gradient">Imagination</span> Into Reality.
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              Upload any photo and let AI reimagine it — professional portraits, new outfits, fresh hairstyles,
              dream backgrounds or stunning art. Real image-to-image editing that keeps you looking like you.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <StartCta />
              <Button asChild variant="glass" size="xl">
                <Link to="/features">Explore Features</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              {FREE_SIGNUP_CREDITS} free credits on sign up · No card required
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-brand opacity-30 blur-3xl" aria-hidden />
            <BeforeAfter
              before={hero.before}
              after={hero.after}
              alt="Selfie transformed into a studio portrait"
              width={800}
              height={1000}
              eager
              className="relative aspect-[4/5] ring-gradient"
            />
            <p className="mt-3 text-center text-xs text-muted-foreground">Drag the slider — real PIXORA AI output</p>
          </div>
        </div>
      </section>

      {/* Before & after gallery */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Before & after</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">One photo. Endless looks.</h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Each example was created by the same AI model PIXORA uses, from an ordinary snapshot.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SHOWCASE.slice(1).map((item) => (
            <figure key={item.id} className="space-y-3">
              <BeforeAfter
                before={item.before}
                after={item.after}
                alt={item.label}
                width={800}
                height={1000}
                className="aspect-[4/5]"
              />
              <figcaption className="flex items-center justify-between text-sm">
                <span className="font-semibold">{item.label}</span>
                <span className="text-muted-foreground">{item.category}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Popular categories</p>
        <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Pick your transformation</h2>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to="/auth"
              search={{ mode: "signup" }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-card"
            >
              <img
                src={CATEGORY_IMAGES[cat.id]}
                alt=""
                loading="lazy"
                width={800}
                height={1000}
                className="aspect-[4/5] w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105 sm:aspect-[4/3]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <h3 className="text-base font-bold sm:text-lg">{cat.label}</h3>
                <p className="mt-1 hidden text-sm text-muted-foreground sm:block">{cat.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-16">
        <div className="absolute inset-0 bg-gradient-brand-soft opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">How it works</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">From snapshot to masterpiece in four steps</h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-3xl border border-border bg-card/80 p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-glow">
                    <step.icon className="size-5" />
                  </span>
                  <span className="font-display text-3xl font-bold text-muted-foreground/30">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Why PIXORA</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Built like a pro tool. Simple as a selfie.</h2>
            <p className="mt-4 text-muted-foreground">
              A complete AI editing studio that works beautifully on your phone, tablet or desktop.
            </p>
            <Button asChild variant="glass" size="lg" className="mt-6">
              <Link to="/features">See all features</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-3xl border border-border bg-card p-6 shadow-card">
                <f.icon className="size-6 text-primary" />
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary">FAQ</p>
        <h2 className="mt-2 text-center text-3xl font-bold sm:text-4xl">Questions, answered</h2>
        <Accordion type="single" collapsible className="mt-8 space-y-3">
          {FAQS.map((item, i) => (
            <AccordionItem key={item.q} value={`q${i}`} className="rounded-2xl border border-border bg-card px-5">
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 text-center shadow-card sm:p-14">
          <div className="absolute inset-0 bg-aurora" aria-hidden />
          <div className="relative">
            <h2 className="text-3xl font-bold sm:text-5xl">
              Ready to see yourself <span className="text-gradient">reimagined?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Create your free account and transform your first photo in under a minute.
            </p>
            <div className="mt-8 flex justify-center">
              <StartCta />
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

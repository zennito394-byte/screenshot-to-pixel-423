import { createFileRoute } from "@tanstack/react-router";
import { Mail, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, SiteLayout } from "@/components/pixora/SiteLayout";
import { CONTACT_EMAIL } from "@/components/pixora/SiteFooter";

export const Route = createFileRoute("/contact")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Contact — PIXORA AI" },
      { name: "description", content: "Get in touch with the PIXORA AI team for support, privacy requests or partnerships." },
      { property: "og:title", content: "Contact — PIXORA AI" },
      { property: "og:description", content: "Reach the PIXORA AI team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <SiteLayout>
      <PageHero eyebrow="Contact" title="We'd love to hear from you" intro="Questions, feedback or a privacy request? Email us and we'll reply as soon as we can." />
      <section className="mx-auto grid max-w-4xl gap-5 px-4 pb-20 sm:grid-cols-2 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <Mail className="size-6 text-primary" />
          <h2 className="mt-4 text-lg font-bold">General & support</h2>
          <p className="mt-2 text-sm text-muted-foreground">Help with your account, credits or results.</p>
          <Button asChild variant="hero" className="mt-5">
            <a href={`mailto:${CONTACT_EMAIL}?subject=PIXORA%20support`}>{CONTACT_EMAIL}</a>
          </Button>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <ShieldAlert className="size-6 text-electric" />
          <h2 className="mt-4 text-lg font-bold">Report misuse</h2>
          <p className="mt-2 text-sm text-muted-foreground">Seen an image of you made without consent? Tell us and we'll act quickly.</p>
          <Button asChild variant="glass" className="mt-5">
            <a href={`mailto:${CONTACT_EMAIL}?subject=Misuse%20report`}>Report an issue</a>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}

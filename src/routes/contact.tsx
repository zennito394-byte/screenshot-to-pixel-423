import { createFileRoute } from "@tanstack/react-router";
import { Mail, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, SiteLayout } from "@/components/pixora/SiteLayout";
import { CONTACT_EMAIL } from "@/components/pixora/SiteFooter";

export const Route = createFileRoute("/contact")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Contact — Musafa AI" },
      { name: "description", content: "Get in touch with the Musafa AI team for support, credit requests or inquiries." },
      { property: "og:title", content: "Contact — Musafa AI" },
      { property: "og:description", content: "Reach the Musafa AI team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you"
        intro="Questions, feedback, or credit inquiries? Email us and we'll reply as soon as we can."
      />
      <section className="mx-auto grid max-w-4xl gap-5 px-4 pb-20 sm:grid-cols-2 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <Mail className="size-6 text-primary" />
          <h2 className="mt-4 text-lg font-bold">General & support</h2>
          <p className="mt-2 text-sm text-muted-foreground">Help with your account, credit requests, or generations.</p>
          <Button asChild variant="hero" className="mt-5">
            <a href={`mailto:${CONTACT_EMAIL}?subject=Musafa%20AI%20Support`}>{CONTACT_EMAIL}</a>
          </Button>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
          <ShieldAlert className="size-6 text-electric" />
          <h2 className="mt-4 text-lg font-bold">Report an issue</h2>
          <p className="mt-2 text-sm text-muted-foreground">Notice content that violates our policies? Tell us and we will act swiftly.</p>
          <Button asChild variant="glass" className="mt-5">
            <a href={`mailto:${CONTACT_EMAIL}?subject=Safety%20report`}>Report an issue</a>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}

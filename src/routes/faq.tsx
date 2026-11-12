import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHero, SiteLayout } from "@/components/pixora/SiteLayout";
import { FAQS } from "@/components/pixora/faq-data";

export const Route = createFileRoute("/faq")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "FAQ — PIXORA AI" },
      { name: "description", content: "Answers about PIXORA AI credits, privacy, supported photos and how AI editing works." },
      { property: "og:title", content: "FAQ — PIXORA AI" },
      { property: "og:description", content: "Everything you need to know about editing photos with PIXORA AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <SiteLayout>
      <PageHero eyebrow="FAQ" title="Frequently asked questions" />
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((item, i) => (
            <AccordionItem key={item.q} value={`q${i}`} className="rounded-2xl border border-border bg-card px-5">
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </SiteLayout>
  );
}

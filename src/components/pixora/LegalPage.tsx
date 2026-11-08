import type { ReactNode } from "react";
import { PageHero, SiteLayout } from "./SiteLayout";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <SiteLayout>
      <PageHero eyebrow="Legal" title={title} intro={`Last updated ${updated}`} />
      <article className="mx-auto max-w-3xl space-y-8 px-4 pb-20 text-sm leading-relaxed text-muted-foreground sm:px-6 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
        {children}
      </article>
    </SiteLayout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/pixora/LegalPage";
import { CONTACT_EMAIL } from "@/components/pixora/SiteFooter";

export const Route = createFileRoute("/terms")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Terms of Service — PIXORA AI" },
      { name: "description", content: "The rules for using PIXORA AI, including consent, acceptable use and credits." },
      { property: "og:title", content: "Terms of Service — PIXORA AI" },
      { property: "og:description", content: "Rules for using PIXORA AI." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="November 2026">
      <section>
        <h2>Your permission to edit</h2>
        <p>
          You may only upload photos that you own or have clear permission to edit, including permission from every
          identifiable person in the photo. You confirm this each time you generate an image.
        </p>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <ul>
          <li>No intimate, sexual or nude imagery, and no edits that undress or sexualise anyone.</li>
          <li>No content involving minors in any harmful or sexualised context.</li>
          <li>No impersonation, fake identity documents or deceptive use of someone's likeness.</li>
          <li>No harassment, defamation or illegal content.</li>
        </ul>
        <p>We may block requests, remove content or suspend accounts that break these rules.</p>
      </section>
      <section>
        <h2>Credits</h2>
        <p>
          New accounts receive free credits. One credit is used for each successful generation; failed generations
          are not charged. Credits have no cash value. Paid plans may be introduced in the future.
        </p>
      </section>
      <section>
        <h2>AI results</h2>
        <p>
          AI output can be imperfect and may change details of a photo. Passport-style results are styling previews
          and are not official documents. You are responsible for how you use generated images.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Questions? Email <a className="text-primary" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>
    </LegalPage>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/pixora/LegalPage";
import { CONTACT_EMAIL } from "@/components/pixora/SiteFooter";

export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Privacy Policy — Musafa AI" },
      { name: "description", content: "How Musafa AI collects, stores, processes and protects your account data and generations." },
      { property: "og:title", content: "Privacy Policy — Musafa AI" },
      { property: "og:description", content: "How Musafa AI handles your data." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 2026">
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Account details: your email address, display name and sign-in credentials.</li>
          <li>Generated portraits and prompt inputs associated with your account.</li>
          <li>Usage records: chosen styles, aspect ratios, timestamps and credit transactions.</li>
        </ul>
      </section>
      <section>
        <h2>How portraits are generated</h2>
        <p>
          Your generation prompts and styling instructions are processed securely on dedicated servers solely to produce your requested portrait. We do not sell your personal data or use your private generations for commercial advertising.
        </p>
      </section>
      <section>
        <h2>Storage and access</h2>
        <p>
          Your creations are stored in private cloud storage linked strictly to your account. Security rules ensure only you can view or delete your images. Direct image links expire automatically.
        </p>
      </section>
      <section>
        <h2>Data deletion</h2>
        <p>
          You can delete any portrait directly from your personal gallery, or request full account deletion through Account Settings or by emailing us. Deleted assets are permanently wiped immediately.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>For privacy questions or data requests, email <a className="text-primary" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>
    </LegalPage>
  );
}

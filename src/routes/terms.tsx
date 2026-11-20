import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/pixora/LegalPage";
import { CONTACT_EMAIL } from "@/components/pixora/SiteFooter";

export const Route = createFileRoute("/terms")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Terms of Service — Musafa AI" },
      { name: "description", content: "The rules for using Musafa AI, acceptable prompt use, and credit policies." },
      { property: "og:title", content: "Terms of Service — Musafa AI" },
      { property: "og:description", content: "Rules for using Musafa AI." },
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
        <h2>Acceptable use</h2>
        <ul>
          <li>No intimate, sexually explicit, or obscene generation prompts.</li>
          <li>No content involving minors in any harmful or sexualized context.</li>
          <li>No defamation, harassment, hateful imagery, or promotion of violence.</li>
          <li>No attempts to generate deceptive identity documentation or impersonate individuals without rights.</li>
        </ul>
        <p>We reserve the right to reject prohibited prompts, delete non-compliant outputs, and suspend accounts that violate these terms.</p>
      </section>
      <section>
        <h2>Credits & billing</h2>
        <p>
          Every new account receives free starting credits, and balances below the daily limit are replenished automatically every midnight. Purchased credit packs never expire. Exactly 1 credit is deducted per successfully rendered portrait; failed generation attempts are never billed. Credits carry no cash value and are non-transferable.
        </p>
      </section>
      <section>
        <h2>AI generation disclaimer</h2>
        <p>
          AI-generated imagery is creative interpretation and may occasionally contain artistic inaccuracies or unexpected visual artifacts. You maintain ownership of your generated outputs in accordance with applicable AI licensing, and you assume responsibility for how you distribute them.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Questions about our terms? Reach us at <a className="text-primary" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>
    </LegalPage>
  );
}

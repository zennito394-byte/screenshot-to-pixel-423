import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/pixora/LegalPage";
import { CONTACT_EMAIL } from "@/components/pixora/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — PIXORA AI" },
      { name: "description", content: "How PIXORA AI collects, stores, processes and deletes your photos and account data." },
      { property: "og:title", content: "Privacy Policy — PIXORA AI" },
      { property: "og:description", content: "How PIXORA AI handles your photos and data." },
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
          <li>Account details: your email address, display name and sign-in method.</li>
          <li>Photos you upload and the images PIXORA generates from them.</li>
          <li>Generation records: chosen styles, instructions, dates and credit usage.</li>
        </ul>
      </section>
      <section>
        <h2>How we use your photos</h2>
        <p>
          Your photo and editing instructions are sent securely from our servers to an AI image-editing provider
          solely to create your result. Before upload, your browser resizes the photo and removes embedded
          metadata such as GPS location. We do not sell your photos or use them for advertising.
        </p>
      </section>
      <section>
        <h2>Storage and access</h2>
        <p>
          Photos are kept in private storage linked to your account. Access rules ensure only you can view or
          delete your images. Image links shown in the app are temporary and expire automatically.
        </p>
      </section>
      <section>
        <h2>Deletion</h2>
        <p>
          You can delete any creation from your gallery, or delete all your photos at once from Account settings.
          Deleted images are removed from storage immediately.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>For privacy questions or data requests, email <a className="text-primary" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </section>
    </LegalPage>
  );
}

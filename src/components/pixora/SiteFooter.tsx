import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export const CONTACT_EMAIL = "hello@pixora.ai";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">Your Photo. Your Imagination. AI.</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Product</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/features" className="hover:text-foreground">Features</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
            <li><Link to="/auth" search={{ mode: "signup" }} className="hover:text-foreground">Start creating</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Legal</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/privacy" className="hover:text-foreground">Privacy policy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">Terms of service</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Contact</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground">{CONTACT_EMAIL}</a></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact page</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} PIXORA AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

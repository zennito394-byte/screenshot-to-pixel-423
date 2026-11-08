import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-8 items-center justify-center rounded-xl bg-gradient-brand shadow-glow",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-4.5 text-primary-foreground" fill="none">
        <path d="M6 20V5.5A1.5 1.5 0 0 1 7.5 4H13a5 5 0 0 1 0 10H9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="18.5" cy="18.5" r="1.8" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Logo({ to = "/", className }: { to?: "/" | "/dashboard"; className?: string }) {
  return (
    <Link to={to} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="PIXORA AI home">
      <LogoMark />
      <span className="font-display text-lg font-bold tracking-tight">
        PIXORA <span className="text-gradient">AI</span>
      </span>
    </Link>
  );
}

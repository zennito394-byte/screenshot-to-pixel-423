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
        {/* Sleek 'M' mark for Musafa */}
        <path
          d="M5 19V6.5l7 6.5 7-6.5V19"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Logo({ to = "/", className }: { to?: "/" | "/dashboard"; className?: string }) {
  return (
    <Link to={to} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Musafa AI home">
      <LogoMark />
      <span className="font-display text-lg font-bold tracking-tight">
        MUSAFA <span className="text-gradient">AI</span>
      </span>
    </Link>
  );
}

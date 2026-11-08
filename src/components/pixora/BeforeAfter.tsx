import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  eager?: boolean;
};

/** Drag-to-compare before/after viewer. Uses a native range input for keyboard and touch access. */
export function BeforeAfter({
  before,
  after,
  beforeLabel = "Before",
  afterLabel = "After",
  alt,
  className,
  width,
  height,
  eager,
}: Props) {
  const [pos, setPos] = useState(50);
  return (
    <div className={cn("relative select-none overflow-hidden rounded-3xl bg-surface shadow-card", className)}>
      <img
        src={after}
        alt={`${alt} — after`}
        width={width}
        height={height}
        loading={eager ? "eager" : "lazy"}
        className="block h-full w-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img
          src={before}
          alt={`${alt} — before`}
          width={width}
          height={height}
          loading={eager ? "eager" : "lazy"}
          className="block h-full w-full object-cover"
          draggable={false}
        />
      </div>
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 -ml-px w-0.5 bg-foreground/90 shadow-glow" />
        <div className="absolute top-1/2 -ml-5 -mt-5 flex size-10 items-center justify-center rounded-full border border-foreground/30 glass">
          <svg viewBox="0 0 24 24" className="size-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 6-6 6 6 6M15 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <span className="pointer-events-none absolute left-3 top-3 rounded-full glass px-3 py-1 text-xs font-semibold">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-gradient-brand px-3 py-1 text-xs font-semibold text-primary-foreground">
        {afterLabel}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Drag to compare before and after"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

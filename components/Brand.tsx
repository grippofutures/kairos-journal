/**
 * Kairos brand primitives.
 *
 * The mark: hourglass narrowed almost to a line. Two thin gold rules. A single
 * gold bead at the waist — the moment everything pivots on.
 *
 * The wordmark: Cormorant 400, tracked 0.18em, set in caps.
 *
 * Editorial chrome: Eyebrow + Title + (optional) Lede. Used at the top of
 * every page so a returning student feels the same hand at the wheel.
 */

import Link from "next/link";

export function Mark({ size = 28 }: { size?: number }) {
  const w = size * 0.6;
  return (
    <svg
      viewBox="0 0 60 100"
      width={w}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Top thin gold rule */}
      <line x1="6" y1="5" x2="54" y2="5" stroke="#C6AB5C" strokeWidth="2" />
      {/* Bottom thin gold rule */}
      <line x1="6" y1="95" x2="54" y2="95" stroke="#C6AB5C" strokeWidth="2" />
      {/* Hourglass body — two triangles meeting at the waist */}
      <path d="M10 9 L50 9 L30 50 Z" fill="#F0EDE8" />
      <path d="M10 91 L50 91 L30 50 Z" fill="#F0EDE8" />
      {/* The moment — a single gold bead */}
      <circle cx="30" cy="50" r="2" fill="#C6AB5C" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display tracking-wordmark uppercase ${className}`}
      style={{ fontWeight: 400 }}
    >
      Kairos
    </span>
  );
}

export function Eyebrow({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className={muted ? "eyebrow-muted" : "eyebrow"}>
      <span className="rule-gold mr-3" />
      {children}
      <span className="rule-gold ml-3" />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  right,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <header className="mb-10 pb-8 border-b border-soft">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="eyebrow mb-5">
            <span className="rule-gold mr-3" />
            {eyebrow}
          </div>
          <h1 className="font-display text-4xl md:text-5xl leading-tight">
            {title}
          </h1>
          {lede && (
            <p className="mt-4 text-bone-dim max-w-2xl text-[15px] leading-relaxed">
              {lede}
            </p>
          )}
        </div>
        {right && <div className="flex-shrink-0">{right}</div>}
      </div>
    </header>
  );
}

export function TopBar({ right }: { right?: React.ReactNode }) {
  return (
    <div className="border-b border-soft">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Mark size={24} />
          <Wordmark className="text-[15px] text-bone group-hover:text-gold transition-colors" />
          <span className="hidden sm:inline-block w-px h-4 bg-soft" />
          <span className="hidden sm:inline-block eyebrow-muted">Journal</span>
        </Link>
        {right}
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-soft">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col items-center gap-3">
        <Mark size={20} />
        <div className="font-display italic text-bone-dim">
          Wait. Then act.
        </div>
        <div className="eyebrow-muted">
          <span>Kairos</span>
          <span className="mx-2 text-soft">·</span>
          <span>Journal</span>
        </div>
      </div>
    </footer>
  );
}

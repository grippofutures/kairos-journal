"use client";

import { useEffect, useState } from "react";

/**
 * Counts up from 0 to `value` over `duration` ms on mount.
 * Uses easeOutCubic — mechanical but not floppy. Respects reduced-motion.
 *
 * Format is passed as a STRING enum (not a function) because server components
 * cannot serialize function props across to client components in Next 15+.
 */

export type NumberFormat =
  | "integer"
  | "signed-integer"
  | "money-signed"
  | "percent";

function formatValue(n: number, format: NumberFormat): string {
  switch (format) {
    case "money-signed": {
      const rounded = Math.round(n);
      const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
      return `${sign}$${Math.abs(rounded).toLocaleString()}`;
    }
    case "signed-integer": {
      const rounded = Math.round(n);
      const sign = rounded > 0 ? "+" : "";
      return `${sign}${rounded}`;
    }
    case "percent": {
      // n is a fraction (0.42 → "42%")
      return `${Math.round(n * 100)}%`;
    }
    case "integer":
    default:
      return String(Math.round(n));
  }
}

export function NumberCounter({
  value,
  duration = 600,
  format = "integer",
  className,
}: {
  value: number;
  duration?: number;
  format?: NumberFormat;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    // Respect reduced-motion: jump straight to final value
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.matches) {
        setDisplay(value);
        return;
      }
    }

    // Animate from 0 → value
    setDisplay(0);
    const startTime = performance.now();
    let frameId = 0;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(eased * value);
      if (t < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <span className={className}>{formatValue(display, format)}</span>;
}

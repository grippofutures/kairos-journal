"use client";

import { useEffect, useState } from "react";

/**
 * Counts up from 0 to `value` over `duration` ms on mount.
 * Uses easeOutCubic — mechanical but not floppy. Respects reduced-motion.
 */
export function NumberCounter({
  value,
  duration = 600,
  format = (n) => Math.round(n).toString(),
  className,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
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

  return <span className={className}>{format(display)}</span>;
}

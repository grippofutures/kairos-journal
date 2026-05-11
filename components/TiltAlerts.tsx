import type { TiltFlag } from "@/lib/detect";

/**
 * Alerts in the Kairos register: gold for the moment that demands attention.
 * Severity is conveyed through border weight, italic, and the eyebrow above
 * each card — never red or amber.
 */

const TONE = {
  critical: {
    eyebrow: "Critical",
    border: "border-gold border-l-4",
    eyebrowClass: "eyebrow",
    titleClass: "font-display italic text-bone text-xl",
  },
  warning: {
    eyebrow: "Warning",
    border: "border-gold/40 border-l-2",
    eyebrowClass: "eyebrow-muted",
    titleClass: "font-display text-bone text-lg",
  },
  info: {
    eyebrow: "Note",
    border: "border-soft border-l",
    eyebrowClass: "eyebrow-muted",
    titleClass: "font-display text-bone-dim text-base",
  },
} as const;

export function TiltAlerts({
  flags,
  emptyText = "No active flags.",
}: {
  flags: TiltFlag[];
  emptyText?: string;
}) {
  if (flags.length === 0) {
    return (
      <div className="card p-5 text-bone-dim text-sm font-display italic">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {flags.map((f, i) => {
        const tone = TONE[f.severity];
        return (
          <div
            key={`${f.type}-${i}`}
            className={`bg-surface ${tone.border} px-5 py-4`}
          >
            <div className={tone.eyebrowClass}>{tone.eyebrow}</div>
            <div className={`mt-2 ${tone.titleClass}`}>{f.message}</div>
            {f.detail && (
              <div className="mt-1.5 text-sm text-bone-dim leading-relaxed">
                {f.detail}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

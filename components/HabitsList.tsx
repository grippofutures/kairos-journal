import type { Habit } from "@/lib/detect";

/**
 * Bad habits — patterns surfaced from the long view. No severity colors;
 * gold for the most pointed observations, muted for softer signals.
 */
export function HabitsList({ habits }: { habits: Habit[] }) {
  if (habits.length === 0) {
    return (
      <div className="card p-5 text-sm text-bone-dim font-display italic">
        Patterns surface after roughly ten trades. Until then, keep logging.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {habits.map((h, i) => {
        const accent =
          h.severity === "critical"
            ? "border-l-4 border-gold"
            : h.severity === "warning"
              ? "border-l-2 border-gold/60"
              : "border-l border-soft";
        return (
          <div
            key={`${h.type}-${i}`}
            className={`bg-surface ${accent} px-5 py-4`}
          >
            <div className="font-display text-base text-bone leading-snug">
              {h.title}
            </div>
            <div className="text-sm text-bone-dim mt-2 leading-relaxed">
              {h.detail}
            </div>
          </div>
        );
      })}
    </div>
  );
}

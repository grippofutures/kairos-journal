import { fmtMoney, fmtPct, type Stats } from "@/lib/stats";

/**
 * Stats bar — Kairos palette only. No status colors. Numerals in Cormorant
 * (italic when emphasized). Labels in eyebrow. Gold reserved for the moment
 * that matters: a textbook framework score, or a streak that has crossed
 * into "the window is closed" territory.
 */
export function StatsBar({ stats }: { stats: Stats }) {
  const streakIsAlert = stats.currentLossStreak >= 3;
  const frameworkIsTextbook = stats.avgFramework >= 9;

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-soft border border-soft mb-10">
      <Card label="Trades" value={String(stats.total)} />
      <Card label="Win rate" value={fmtPct(stats.winRate)} />
      <Card label="Avg R" value={stats.avgR.toFixed(2)} />
      <Card label="Net" value={fmtMoney(stats.totalPnl)} />
      <Card
        label="Loss streak"
        value={String(stats.currentLossStreak)}
        emphasis={streakIsAlert ? "gold" : "none"}
      />
      <Card
        label="Framework"
        value={stats.avgFramework > 0 ? stats.avgFramework.toFixed(1) : "—"}
        emphasis={frameworkIsTextbook ? "gold" : "none"}
      />
    </div>
  );
}

function Card({
  label,
  value,
  emphasis = "none",
}: {
  label: string;
  value: string;
  emphasis?: "none" | "gold";
}) {
  const valueClass =
    emphasis === "gold"
      ? "font-display italic text-gold"
      : "font-display text-bone";
  return (
    <div className="bg-canvas px-4 py-5">
      <div className="eyebrow-muted">{label}</div>
      <div className={`mt-2 text-3xl leading-none num ${valueClass}`}>
        {value}
      </div>
    </div>
  );
}

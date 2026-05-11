import { fmtMoneySigned } from "@/lib/stats";

type Point = { traded_at: string; pnl: number };

/**
 * Equity curve, Kairos register: a single gold line on the surface,
 * a thin gold dashed rule at zero. No green/red. The line is the line.
 */
export function EquityCurve({ trades }: { trades: Point[] }) {
  if (trades.length === 0) {
    return (
      <div className="card p-8 text-center text-bone-dim text-sm font-display italic">
        The curve will draw itself, once there are trades to draw it from.
      </div>
    );
  }

  const sorted = [...trades].sort((a, b) =>
    a.traded_at.localeCompare(b.traded_at)
  );
  let cum = 0;
  const cumPoints = sorted.map((t) => {
    cum += Number(t.pnl);
    return cum;
  });

  const min = Math.min(0, ...cumPoints);
  const max = Math.max(0, ...cumPoints);
  const W = 800;
  const H = 240;
  const PX = 60;
  const PY = 20;
  const range = max - min || 1;

  const x = (i: number) =>
    PX + (i / Math.max(cumPoints.length - 1, 1)) * (W - PX - PY);
  const y = (v: number) => H - PY - ((v - min) / range) * (H - 2 * PY);

  const path = cumPoints
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");

  const final = cumPoints[cumPoints.length - 1];

  // Gold area under the curve, but very faint
  const area = `${path} L ${x(cumPoints.length - 1).toFixed(1)} ${y(0).toFixed(1)} L ${x(0).toFixed(1)} ${y(0).toFixed(1)} Z`;

  const zeroY = y(0);

  return (
    <section className="card p-6">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <div className="eyebrow-muted">Equity curve</div>
          <div className="font-display italic text-3xl text-bone num mt-2">
            {fmtMoneySigned(final)}
          </div>
        </div>
        <div className="text-right text-xs text-muted-soft">
          <div>{sorted.length} trades</div>
          <div className="font-display italic">
            {new Date(sorted[0].traded_at).toLocaleDateString()} → {new Date(sorted[sorted.length - 1].traded_at).toLocaleDateString()}
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56" preserveAspectRatio="xMidYMid meet">
        {/* y-axis labels */}
        <text x={6} y={y(max) + 4} fontSize="10" fill="#6b6b6b" fontFamily="var(--font-inter)" letterSpacing="0.1em">
          {fmtMoneySigned(max)}
        </text>
        <text x={6} y={y(min) + 4} fontSize="10" fill="#6b6b6b" fontFamily="var(--font-inter)" letterSpacing="0.1em">
          {fmtMoneySigned(min)}
        </text>
        {/* zero rule */}
        <line
          x1={PX}
          x2={W - PY}
          y1={zeroY}
          y2={zeroY}
          stroke="#C6AB5C"
          strokeOpacity={0.3}
          strokeDasharray="3 5"
        />
        <text x={6} y={zeroY + 4} fontSize="10" fill="#9c854a" fontFamily="var(--font-inter)" letterSpacing="0.1em">
          $0
        </text>
        {/* area fill (very faint gold) */}
        <path d={area} fill="#C6AB5C" fillOpacity={0.06} />
        {/* curve */}
        <path
          d={path}
          fill="none"
          stroke="#C6AB5C"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* endpoints */}
        <circle cx={x(0)} cy={y(cumPoints[0])} r={2} fill="#C6AB5C" />
        <circle
          cx={x(cumPoints.length - 1)}
          cy={y(final)}
          r={3}
          fill="#C6AB5C"
        />
      </svg>
    </section>
  );
}

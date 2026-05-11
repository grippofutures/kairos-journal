import type { WeekStat } from "@/lib/weekly";
import { fmtMoneySigned, fmtPct } from "@/lib/stats";

export function WeeklyOverview({ weeks }: { weeks: WeekStat[] }) {
  if (weeks.length === 0) {
    return (
      <p className="text-bone-dim italic font-display py-6 text-center">
        No weekly data yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-soft">
            <Th>Week</Th>
            <Th>Trades</Th>
            <Th>Net</Th>
            <Th>Win rate</Th>
            <Th>Rules · followed</Th>
            <Th>Rules · broken</Th>
            <Th>Top setup</Th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w, idx) => {
            const isCurrent = idx === 0;
            const isEmpty = w.tradesCount === 0;
            return (
              <tr
                key={w.weekStart}
                className={`border-b border-soft last:border-0 ${
                  isEmpty ? "opacity-60" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div
                    className={`font-display ${isCurrent ? "text-gold italic" : "text-bone"}`}
                  >
                    {w.label}
                  </div>
                  {isCurrent && (
                    <div className="text-[10px] eyebrow-muted">This week</div>
                  )}
                </td>
                <Td>{w.tradesCount}</Td>
                <td
                  className={`px-4 py-3 num font-display ${
                    w.netPnl > 0
                      ? "text-bone"
                      : w.netPnl < 0
                        ? "italic text-muted-soft"
                        : "text-muted"
                  }`}
                >
                  {w.tradesCount === 0 ? "—" : fmtMoneySigned(w.netPnl)}
                </td>
                <Td>{w.tradesCount === 0 ? "—" : fmtPct(w.winRate)}</Td>
                <td className="px-4 py-3 num font-display text-bone">
                  {w.rulesFollowedDays === 0 && w.rulesBrokenDays === 0
                    ? "—"
                    : w.rulesFollowedDays}
                </td>
                <td
                  className={`px-4 py-3 num font-display ${
                    w.rulesBrokenDays > 0 ? "italic text-gold" : "text-bone"
                  }`}
                >
                  {w.rulesFollowedDays === 0 && w.rulesBrokenDays === 0
                    ? "—"
                    : w.rulesBrokenDays}
                </td>
                <td className="px-4 py-3 text-bone-dim text-xs">
                  {w.topSetup
                    ? `${w.topSetup.tag} (${w.topSetup.count})`
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left eyebrow-muted">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 num font-display text-bone">{children}</td>;
}

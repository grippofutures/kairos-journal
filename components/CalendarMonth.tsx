import Link from "next/link";
import {
  getMonthGrid,
  monthLabel,
  shortMonthLabel,
  nextMonth,
  prevMonth,
  ym,
  type DaySummary,
} from "@/lib/calendar";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonth({
  year,
  month0,
  summaries,
  basePath,
  selectedDay,
}: {
  year: number;
  month0: number;
  summaries: Map<string, DaySummary>;
  /** e.g. "/dashboard/calendar" or "/mentor/{userId}/calendar" */
  basePath: string;
  selectedDay?: string;
}) {
  const cells = getMonthGrid(year, month0);
  const prev = prevMonth(year, month0);
  const next = nextMonth(year, month0);
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`${basePath}?month=${ym(prev.year, prev.month0)}`}
          className="btn-quiet"
        >
          ← {shortMonthLabel(prev.year, prev.month0)}
        </Link>
        <h3 className="font-display text-2xl">{monthLabel(year, month0)}</h3>
        <Link
          href={`${basePath}?month=${ym(next.year, next.month0)}`}
          className="btn-quiet"
        >
          {shortMonthLabel(next.year, next.month0)} →
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-px bg-soft border border-soft">
        {DOW.map((d) => (
          <div
            key={d}
            className="bg-canvas py-2 text-center eyebrow-muted text-[10px]"
          >
            {d}
          </div>
        ))}
        {cells.map((c) => {
          const summary = summaries.get(c.date);
          const isSelected = c.date === selectedDay;
          const isToday = c.date === todayKey;
          const monthYm = ym(year, month0);
          const dayNumber = Number(c.date.slice(8));
          const pnlSign = summary && summary.pnl !== 0 ? (summary.pnl > 0 ? "+" : "") : "";

          return (
            <Link
              key={c.date}
              href={`${basePath}?month=${monthYm}&day=${c.date}`}
              className={[
                "bg-canvas p-2 min-h-[88px] block transition-colors",
                !c.inMonth ? "opacity-30" : "",
                isSelected
                  ? "ring-2 ring-gold ring-inset"
                  : "hover:bg-surface-2",
              ].join(" ")}
            >
              <div className="flex justify-between items-start">
                <span
                  className={[
                    "font-display num text-sm",
                    isToday ? "text-gold italic" : "text-bone",
                    !c.inMonth ? "text-muted" : "",
                  ].join(" ")}
                >
                  {dayNumber}
                </span>
                <div className="flex gap-1 items-center">
                  {summary?.skippedDay && (
                    <span
                      className="text-gold text-[10px]"
                      title="Skipped — sat out intentionally"
                    >
                      ◇
                    </span>
                  )}
                  {summary?.hasCheckin && !summary?.skippedDay && (
                    <span
                      className="text-[8px] text-bone-dim"
                      title="Daily check-in logged"
                    >
                      ✎
                    </span>
                  )}
                  {summary?.followedDay === true && (
                    <span className="text-gold text-[10px]" title="Followed the model">●</span>
                  )}
                  {summary?.followedDay === false && (
                    <span className="text-muted-soft text-[10px]" title="Broken — rules not followed">●</span>
                  )}
                </div>
              </div>
              {summary && summary.tradeCount > 0 && (
                <div className="mt-2 text-xs">
                  <div
                    className={`font-display num ${
                      summary.pnl >= 0 ? "text-bone" : "italic text-muted-soft"
                    }`}
                  >
                    {pnlSign}
                    {Math.round(summary.pnl)}
                  </div>
                  <div className="text-muted text-[10px] mt-0.5">
                    {summary.tradeCount} {summary.tradeCount === 1 ? "trade" : "trades"}
                  </div>
                </div>
              )}
              {summary && summary.tradeCount === 0 && summary.hasCheckin && (
                <div className="mt-2 text-[10px] text-muted-soft italic font-display">
                  check-in only
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-[11px] eyebrow-muted">
        <span><span className="text-gold mr-1.5">●</span> Followed the model</span>
        <span><span className="text-muted-soft mr-1.5">●</span> Broken</span>
        <span><span className="text-bone-dim mr-1.5">✎</span> Check-in logged</span>
        <span><span className="text-gold mr-1.5">◇</span> Skipped — sat out</span>
      </div>
    </div>
  );
}

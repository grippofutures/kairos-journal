import type { RecentDay, DayStatus } from "@/lib/recent-days";

const STATUS_LABEL: Record<DayStatus, string> = {
  followed: "Followed the model",
  broken: "Broke the model",
  skipped: "Skipped — sat out",
  weekend: "Weekend",
  empty: "No trades logged",
};

function CellClasses(status: DayStatus, isToday: boolean): string {
  // Each cell is a flexible-width vertical bar. The status drives its fill.
  const base = "flex-1 h-9 border rounded-sm transition-colors";
  const status_classes: Record<DayStatus, string> = {
    followed: "bg-gold border-gold",
    broken:   "bg-transparent border-muted-soft",
    skipped:  "bg-transparent border-gold border-dashed",
    weekend:  "bg-transparent border-soft opacity-40",
    empty:    "bg-transparent border-soft",
  };
  const today = isToday ? "ring-1 ring-gold-bright ring-offset-2 ring-offset-canvas" : "";
  return `${base} ${status_classes[status]} ${today}`;
}

export function StreakStrip({ days }: { days: RecentDay[] }) {
  if (days.length === 0) return null;
  return (
    <div className="mt-5">
      <div className="flex justify-between items-baseline mb-2">
        <div className="eyebrow-muted text-[10px]">
          Last {days.length} days
        </div>
        <div className="text-[10px] text-muted">Today →</div>
      </div>
      <div className="flex gap-1">
        {days.map((d) => (
          <div
            key={d.date}
            className={CellClasses(d.status, d.isToday)}
            title={`${d.date} · ${STATUS_LABEL[d.status]}`}
            aria-label={`${d.date}: ${STATUS_LABEL[d.status]}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] eyebrow-muted">
        <span><span className="inline-block w-2 h-2 bg-gold rounded-sm mr-1.5 align-middle" /> Followed</span>
        <span><span className="inline-block w-2 h-2 border border-muted-soft rounded-sm mr-1.5 align-middle" /> Broken</span>
        <span><span className="inline-block w-2 h-2 border border-gold border-dashed rounded-sm mr-1.5 align-middle" /> Skipped</span>
        <span><span className="inline-block w-2 h-2 border border-soft rounded-sm mr-1.5 align-middle opacity-40" /> Weekend / empty</span>
      </div>
    </div>
  );
}

import type { StreakResult } from "@/lib/streak";
import type { RecentDay } from "@/lib/recent-days";
import { StreakStrip } from "./StreakStrip";
import { NumberCounter } from "./NumberCounter";

const STATUS_COPY: Record<StreakResult["todayStatus"], string> = {
  followed: "Today extended it.",
  broken: "Broken today.",
  neutral: "No trades today.",
};

export function StreakBadge({
  streak,
  recentDays,
}: {
  streak: StreakResult;
  recentDays?: RecentDay[];
}) {
  const broken = streak.todayStatus === "broken";
  return (
    <section className="mb-10">
      <div className="eyebrow mb-3">
        <span className="rule-gold mr-3" />
        The streak
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-soft border border-soft">
        <div className="bg-canvas px-5 py-6">
          <div className="eyebrow-muted">Rules followed — current</div>
          <div
            className={`mt-2 font-display num text-3xl leading-none ${
              broken ? "italic text-muted-soft" : "text-bone"
            }`}
          >
            <NumberCounter value={streak.current} />
          </div>
          <div className="text-xs text-muted-soft mt-2 font-display italic">
            {STATUS_COPY[streak.todayStatus]}
          </div>
        </div>
        <div className="bg-canvas px-5 py-6">
          <div className="eyebrow-muted">Longest streak</div>
          <div className="mt-2 font-display num text-3xl leading-none text-bone">
            <NumberCounter value={streak.longest} />
          </div>
          <div className="text-xs text-muted-soft mt-2 font-display italic">
            {streak.longest === 0 ? "No followed days yet." : "All-time high."}
          </div>
        </div>
        <div className="bg-canvas px-5 py-6">
          <div className="eyebrow-muted">Days journaled</div>
          <div className="mt-2 font-display num text-3xl leading-none text-bone">
            <NumberCounter value={streak.daysWithTrades} />
          </div>
          <div className="text-xs text-muted-soft mt-2 font-display italic">
            Distinct trading days logged.
          </div>
        </div>
      </div>

      {recentDays && <StreakStrip days={recentDays} />}
    </section>
  );
}

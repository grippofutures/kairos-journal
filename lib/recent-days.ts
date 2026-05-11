/**
 * Build the last N days of activity status for the streak strip.
 * Each day classifies as one of: followed | broken | skipped | weekend | empty.
 */

export type DayStatus = "followed" | "broken" | "skipped" | "weekend" | "empty";

export type RecentDay = {
  date: string; // YYYY-MM-DD
  status: DayStatus;
  isToday: boolean;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function computeRecentDays(
  trades: Array<{ traded_at: string; followed_model: boolean }>,
  checkins: Array<{ check_in_date: string; skipped_day: boolean }>,
  daysBack: number = 14,
): RecentDay[] {
  // Bucket trades by local day; day = followed iff every trade that day was followed
  const tradeDays = new Map<string, boolean>();
  for (const t of trades) {
    const day = ymd(new Date(t.traded_at));
    const prev = tradeDays.get(day);
    tradeDays.set(
      day,
      prev === undefined ? t.followed_model : prev && t.followed_model,
    );
  }

  const skipped = new Set<string>(
    checkins.filter((c) => c.skipped_day).map((c) => c.check_in_date),
  );

  const todayKey = ymd(new Date());
  const out: RecentDay[] = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = ymd(d);
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;

    let status: DayStatus = "empty";
    if (skipped.has(key)) {
      status = "skipped";
    } else if (tradeDays.has(key)) {
      status = tradeDays.get(key) ? "followed" : "broken";
    } else if (isWeekend) {
      status = "weekend";
    }

    out.push({ date: key, status, isToday: key === todayKey });
  }
  return out;
}

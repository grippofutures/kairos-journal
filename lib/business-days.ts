/**
 * Weekday-only date math.
 *
 * The market is closed Sat/Sun for the instruments the cohort trades, so any
 * "days since X" or "expected journal" calculation skips weekends. Holidays
 * are NOT handled — open question whether they should be (a half-day or full
 * holiday is also a no-trade day, but the model says sit, not skip).
 */

export function isWeekend(date: Date): boolean {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
}

export function isWeekday(date: Date): boolean {
  return !isWeekend(date);
}

/** ISO date string (YYYY-MM-DD) using local time. */
export function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isWeekendKey(key: string): boolean {
  // key is YYYY-MM-DD; parse at noon local to dodge tz edge
  return isWeekend(new Date(key + "T12:00:00"));
}

/**
 * Count weekdays strictly AFTER `from` up to and including `to`.
 * If from === to, returns 0. Used for "N weekdays since last trade".
 */
export function weekdaysBetween(from: Date, to: Date): number {
  if (to <= from) return 0;
  let count = 0;
  const cur = new Date(from);
  cur.setHours(12, 0, 0, 0);
  const end = new Date(to);
  end.setHours(12, 0, 0, 0);
  while (cur < end) {
    cur.setDate(cur.getDate() + 1);
    if (isWeekday(cur)) count++;
  }
  return count;
}

/**
 * Returns weekdays-since-last-trade for an array of trades.
 * Returns null if there are no trades.
 */
export function weekdaysSinceLastTrade(tradedAtIsoList: string[]): number | null {
  if (tradedAtIsoList.length === 0) return null;
  const dates = tradedAtIsoList.map((s) => new Date(s));
  const latest = new Date(Math.max(...dates.map((d) => d.getTime())));
  return weekdaysBetween(latest, new Date());
}

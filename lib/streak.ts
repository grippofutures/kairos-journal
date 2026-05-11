/**
 * Rules-followed streak.
 *
 * Drives off the single `followed_model` boolean per trade — set by the trader
 * with the "I followed the model" checkbox in the form.
 *
 * A "followed day" = every trade that day has `followed_model = true`.
 * No-trade days are NEUTRAL — they neither extend nor break the streak.
 * (Discipline is: trade well or don't trade. Sitting on hands is fine.)
 *
 * Current streak = consecutive followed days walking back from today,
 * stopping at the first broken day. Neutral days are skipped.
 *
 * Longest streak = same logic over all history.
 */

export type StreakTradeInput = {
  traded_at: string;
  followed_model: boolean;
};

export type StreakResult = {
  /** Consecutive followed days, walking back from the most recent trade day. */
  current: number;
  /** Longest run of followed days in history. */
  longest: number;
  /** Status of today. "neutral" means no trades today yet. */
  todayStatus: "followed" | "broken" | "neutral";
  /** Distinct days the user has logged at least one trade. */
  daysWithTrades: number;
};

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function computeRulesStreak(trades: StreakTradeInput[]): StreakResult {
  if (trades.length === 0) {
    return { current: 0, longest: 0, todayStatus: "neutral", daysWithTrades: 0 };
  }

  // Group by day; a day is "followed" iff EVERY trade that day was followed.
  const byDay = new Map<string, boolean>();
  for (const t of trades) {
    const k = dayKey(t.traded_at);
    const prev = byDay.get(k);
    byDay.set(k, prev === undefined ? t.followed_model : prev && t.followed_model);
  }

  const days = [...byDay.keys()].sort();

  // Longest streak — walk forward, reset on broken day
  let longest = 0;
  let running = 0;
  for (const k of days) {
    if (byDay.get(k)) {
      running++;
      if (running > longest) longest = running;
    } else {
      running = 0;
    }
  }

  // Current streak — walk backward from most recent trade day
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (byDay.get(days[i])) {
      current++;
    } else {
      break;
    }
  }

  // Today's status
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = byDay.get(today);
  const todayStatus: StreakResult["todayStatus"] =
    todayEntry === undefined ? "neutral" : todayEntry ? "followed" : "broken";

  return {
    current,
    longest,
    todayStatus,
    daysWithTrades: byDay.size,
  };
}

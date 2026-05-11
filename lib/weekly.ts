/**
 * Weekly aggregations for a single student's trades.
 *
 * Week boundaries: Monday 00:00 local → Sunday 23:59 local.
 * Returns most-recent week first (descending).
 */

export type WeekStat = {
  weekStart: string; // YYYY-MM-DD of the Monday
  weekEnd: string;   // YYYY-MM-DD of the Sunday
  label: string;     // "May 5 — May 11"
  tradesCount: number;
  netPnl: number;
  wins: number;
  losses: number;
  winRate: number;
  rulesFollowedDays: number;
  rulesBrokenDays: number;
  topSetup: { tag: string; count: number } | null;
};

type Trade = {
  traded_at: string;
  pnl: number;
  outcome: string;
  followed_model: boolean;
  setup_tag: string | null;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfWeek(d: Date): Date {
  // Monday = 1, Sunday = 0
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - diff);
  return monday;
}

function endOfWeek(d: Date): Date {
  const monday = startOfWeek(d);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

function shortMonthDay(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Build the last `weeks` weeks of stats, most recent first.
 * Empty weeks (no trades) are still included so the table stays a fixed length.
 */
export function computeWeeklyStats(trades: Trade[], weeks: number = 8): WeekStat[] {
  // Bucket trades by Monday-of-week
  const bucketed = new Map<string, Trade[]>();
  for (const t of trades) {
    const ws = startOfWeek(new Date(t.traded_at));
    const key = ymd(ws);
    if (!bucketed.has(key)) bucketed.set(key, []);
    bucketed.get(key)!.push(t);
  }

  // Generate the last N weeks regardless of activity
  const today = new Date();
  const currentMonday = startOfWeek(today);
  const out: WeekStat[] = [];
  for (let i = 0; i < weeks; i++) {
    const monday = new Date(currentMonday);
    monday.setDate(monday.getDate() - i * 7);
    const sunday = endOfWeek(monday);
    const key = ymd(monday);
    const tradesInWeek = bucketed.get(key) ?? [];

    // Wins/losses + win rate
    const wins = tradesInWeek.filter((t) => t.outcome === "win").length;
    const losses = tradesInWeek.filter((t) => t.outcome === "loss").length;
    const decided = wins + losses;
    const winRate = decided === 0 ? 0 : wins / decided;
    const netPnl = tradesInWeek.reduce((s, t) => s + Number(t.pnl), 0);

    // Per-day rules-followed bucketing within the week
    const dayMap = new Map<string, boolean>();
    for (const t of tradesInWeek) {
      const day = ymd(new Date(t.traded_at));
      const prev = dayMap.get(day);
      dayMap.set(
        day,
        prev === undefined ? t.followed_model : prev && t.followed_model,
      );
    }
    let rulesFollowedDays = 0;
    let rulesBrokenDays = 0;
    for (const v of dayMap.values()) {
      if (v) rulesFollowedDays++;
      else rulesBrokenDays++;
    }

    // Top setup by frequency
    const setupCount = new Map<string, number>();
    for (const t of tradesInWeek) {
      if (!t.setup_tag) continue;
      setupCount.set(t.setup_tag, (setupCount.get(t.setup_tag) ?? 0) + 1);
    }
    let topSetup: WeekStat["topSetup"] = null;
    for (const [tag, count] of setupCount) {
      if (!topSetup || count > topSetup.count) topSetup = { tag, count };
    }

    out.push({
      weekStart: key,
      weekEnd: ymd(sunday),
      label: `${shortMonthDay(monday)} – ${shortMonthDay(sunday)}`,
      tradesCount: tradesInWeek.length,
      netPnl,
      wins,
      losses,
      winRate,
      rulesFollowedDays,
      rulesBrokenDays,
      topSetup,
    });
  }

  return out;
}

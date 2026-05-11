/**
 * Calendar utilities — month grid + per-day aggregation.
 *
 * Used by /dashboard/calendar (student) and /mentor/[userId]/calendar (mentor).
 * All dates use UTC ISO strings (YYYY-MM-DD).
 */

export type DaySummary = {
  date: string;
  inMonth: boolean;
  pnl: number;
  tradeCount: number;
  /** null = no trades that day; true = all followed; false = at least one broken */
  followedDay: boolean | null;
  preMood: string | null;
  postMood: string | null;
  hasCheckin: boolean;
  skippedDay: boolean;
};

export type CalendarTrade = {
  traded_at: string;
  pnl: number;
  followed_model: boolean;
};

export type CalendarCheckin = {
  check_in_date: string;
  pre_market_mood: string | null;
  post_market_mood: string | null;
  skipped_day?: boolean;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseMonthParam(monthStr: string | undefined): {
  year: number;
  month0: number;
} {
  if (monthStr) {
    const m = monthStr.match(/^(\d{4})-(\d{2})$/);
    if (m) {
      const year = Number(m[1]);
      const month0 = Number(m[2]) - 1;
      if (month0 >= 0 && month0 <= 11 && year >= 1970 && year <= 2999) {
        return { year, month0 };
      }
    }
  }
  const now = new Date();
  return { year: now.getFullYear(), month0: now.getMonth() };
}

/**
 * Returns 42 cells (6 weeks × 7 days), starting from the Sunday on or before the
 * 1st of the month. Each cell = { date: 'YYYY-MM-DD', inMonth: boolean }.
 */
export function getMonthGrid(
  year: number,
  month0: number,
): { date: string; inMonth: boolean }[] {
  const firstOfMonth = new Date(year, month0, 1);
  const firstDow = firstOfMonth.getDay(); // 0 = Sunday
  const cells: { date: string; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month0, 1 - firstDow + i);
    cells.push({ date: ymd(d), inMonth: d.getMonth() === month0 });
  }
  return cells;
}

/** First and last YYYY-MM-DD strings of the visible grid — used for DB range queries. */
export function getMonthGridRange(
  year: number,
  month0: number,
): { start: string; endExclusive: string } {
  const firstOfMonth = new Date(year, month0, 1);
  const firstDow = firstOfMonth.getDay();
  const start = new Date(year, month0, 1 - firstDow);
  const endExclusive = new Date(year, month0, 1 - firstDow + 42);
  return { start: ymd(start), endExclusive: ymd(endExclusive) };
}

/** Aggregate trades + check-ins by day. */
export function aggregateByDay(
  trades: CalendarTrade[],
  checkins: CalendarCheckin[],
): Map<string, DaySummary> {
  const map = new Map<string, DaySummary>();
  const ensure = (date: string): DaySummary => {
    let row = map.get(date);
    if (!row) {
      row = {
        date,
        inMonth: true,
        pnl: 0,
        tradeCount: 0,
        followedDay: null,
        preMood: null,
        postMood: null,
        hasCheckin: false,
        skippedDay: false,
      };
      map.set(date, row);
    }
    return row;
  };

  for (const t of trades) {
    const date = ymd(new Date(t.traded_at));
    const row = ensure(date);
    row.pnl += t.pnl;
    row.tradeCount += 1;
    if (row.followedDay === null) {
      row.followedDay = t.followed_model;
    } else {
      row.followedDay = row.followedDay && t.followed_model;
    }
  }

  for (const c of checkins) {
    const row = ensure(c.check_in_date);
    row.preMood = c.pre_market_mood;
    row.postMood = c.post_market_mood;
    row.hasCheckin = true;
    if (c.skipped_day) row.skippedDay = true;
  }

  return map;
}

export function nextMonth(year: number, month0: number) {
  if (month0 === 11) return { year: year + 1, month0: 0 };
  return { year, month0: month0 + 1 };
}

export function prevMonth(year: number, month0: number) {
  if (month0 === 0) return { year: year - 1, month0: 11 };
  return { year, month0: month0 - 1 };
}

export function monthLabel(year: number, month0: number, format: "long" | "short" = "long"): string {
  return new Date(year, month0, 1).toLocaleString(undefined, {
    month: format,
    year: "numeric",
  });
}

export function shortMonthLabel(year: number, month0: number): string {
  return new Date(year, month0, 1).toLocaleString(undefined, { month: "short" });
}

export function ym(year: number, month0: number): string {
  return `${year}-${pad(month0 + 1)}`;
}

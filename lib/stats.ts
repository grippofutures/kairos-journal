export type TradeRow = {
  id: string;
  traded_at: string;
  outcome: "win" | "loss" | "breakeven";
  pnl: number;
  r_multiple: number | null;
  framework_score?: number;
};

export type Stats = {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgR: number;
  currentLossStreak: number;
  avgFramework: number;
};

/**
 * Trades must be passed in DESC order by traded_at (most recent first).
 * Current loss streak counts consecutive losses starting from the most recent
 * non-breakeven trade. Breakevens are skipped (don't break or extend the streak).
 */
export function computeStats(trades: TradeRow[]): Stats {
  const total = trades.length;
  const wins = trades.filter((t) => t.outcome === "win").length;
  const losses = trades.filter((t) => t.outcome === "loss").length;
  const totalPnl = trades.reduce((sum, t) => sum + Number(t.pnl), 0);

  const rTrades = trades.filter((t) => t.r_multiple != null);
  const avgR =
    rTrades.length === 0
      ? 0
      : rTrades.reduce((sum, t) => sum + Number(t.r_multiple), 0) / rTrades.length;

  const fwTrades = trades.filter((t) => t.framework_score != null);
  const avgFramework =
    fwTrades.length === 0
      ? 0
      : fwTrades.reduce((sum, t) => sum + Number(t.framework_score), 0) / fwTrades.length;

  let streak = 0;
  for (const t of trades) {
    if (t.outcome === "breakeven") continue;
    if (t.outcome === "loss") streak += 1;
    else break;
  }

  return {
    total,
    wins,
    losses,
    winRate: total === 0 ? 0 : wins / total,
    totalPnl,
    avgR,
    currentLossStreak: streak,
    avgFramework,
  };
}

export function fmtMoney(n: number): string {
  // Proper minus sign (U+2212), not hyphen — typographic detail, brand-aligned.
  const sign = n < 0 ? "−" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtMoneySigned(n: number): string {
  // Always show sign, useful for P&L deltas.
  if (n === 0) return "$0.00";
  const sign = n < 0 ? "−" : "+";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

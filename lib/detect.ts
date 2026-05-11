/**
 * Tilt detection + bad-habit aggregation.
 *
 * Heuristic, deterministic, server-side. No AI dependency. Tune THRESHOLDS
 * to match your style. Copy is in the Kairos voice — diagnose, then prescribe.
 *
 * Trades are expected DESC by traded_at unless otherwise noted.
 */

export type DetectTrade = {
  id: string;
  traded_at: string;
  outcome: "win" | "loss" | "breakeven";
  pnl: number;
  contracts: number;
  direction: "long" | "short";
  setup_tag: string | null;
  emotion_tag: string | null;
  framework_score: number;
  criteria_profile: boolean;
  criteria_signature: boolean;
  criteria_trigger: boolean;
  criteria_targets: boolean;
};

export const THRESHOLDS = {
  lossStreakWarning: 3,
  lossStreakCritical: 5,
  revengeWindowMin: 15,             // minutes after a loss
  overtradingDayCount: 5,           // trades in 24h
  overtradingWeekCount: 12,         // trades in 7 days
  frameworkLapseAvg: 5,             // avg score in last 5 below this = lapse
  frameworkLapseLookback: 5,
  emotionPatternCount: 3,           // out of last 10
  emotionPatternLookback: 10,
  sizeCreepMultiplier: 2,           // contracts ≥ this × median = creep
  sizeCreepLookback: 10,
  habitsMinTrades: 10,              // need at least this many to detect habits
  badDayMaxWinRate: 0.35,
  badSetupMaxWinRate: 0.35,
  badSetupMinTrades: 3,
};

// ============================================================================
// TILT FLAGS — real-time, severity-tiered, shown to mentor in alerts banner
// ============================================================================

export type Severity = "info" | "warning" | "critical";

export type TiltFlag = {
  type: string;
  severity: Severity;
  message: string;
  detail?: string;
};

export function detectActiveTilt(trades: DetectTrade[]): TiltFlag[] {
  const flags: TiltFlag[] = [];
  if (trades.length === 0) return flags;

  // Loss streak
  let streak = 0;
  for (const t of trades) {
    if (t.outcome === "breakeven") continue;
    if (t.outcome === "loss") streak += 1;
    else break;
  }
  if (streak >= THRESHOLDS.lossStreakCritical) {
    flags.push({
      type: "loss_streak",
      severity: "critical",
      message: `${spell(streak)} losses in sequence.`,
      detail: "The window is closed for today. Run the loss-streak protocol.",
    });
  } else if (streak >= THRESHOLDS.lossStreakWarning) {
    flags.push({
      type: "loss_streak",
      severity: "warning",
      message: `${spell(streak)} losses in sequence.`,
      detail: "Cut size or stop. The framework decides the next entry — not the streak.",
    });
  }

  // Revenge trade
  if (trades.length >= 2) {
    const last = trades[0];
    const prev = trades[1];
    const minutesBetween =
      (new Date(last.traded_at).getTime() - new Date(prev.traded_at).getTime()) / 60000;
    if (
      prev.outcome === "loss" &&
      minutesBetween >= 0 &&
      minutesBetween <= THRESHOLDS.revengeWindowMin &&
      last.contracts > prev.contracts
    ) {
      flags.push({
        type: "revenge_trade",
        severity: "critical",
        message: "A revenge trade.",
        detail: `Taken ${Math.round(minutesBetween)} minutes after a loss, at greater size. The market did not require the bet.`,
      });
    }
  }

  // Overtrading
  const now = Date.now();
  const dayCount = trades.filter(
    (t) => now - new Date(t.traded_at).getTime() <= 24 * 60 * 60 * 1000
  ).length;
  const weekCount = trades.filter(
    (t) => now - new Date(t.traded_at).getTime() <= 7 * 24 * 60 * 60 * 1000
  ).length;
  if (dayCount >= THRESHOLDS.overtradingDayCount) {
    flags.push({
      type: "overtrading_day",
      severity: "warning",
      message: `${spell(dayCount)} trades in twenty-four hours.`,
      detail: "Frequency is rarely the answer. Quality is.",
    });
  } else if (weekCount >= THRESHOLDS.overtradingWeekCount) {
    flags.push({
      type: "overtrading_week",
      severity: "info",
      message: `${spell(weekCount)} trades in the last week.`,
      detail: "Keep an eye on the cadence.",
    });
  }

  // Framework lapse
  const lookback = trades.slice(0, THRESHOLDS.frameworkLapseLookback);
  if (lookback.length >= 3) {
    const avg = lookback.reduce((s, t) => s + t.framework_score, 0) / lookback.length;
    if (avg < THRESHOLDS.frameworkLapseAvg) {
      flags.push({
        type: "framework_lapse",
        severity: "warning",
        message: `Framework score averaging ${avg.toFixed(1)} of ten.`,
        detail: "Forcing trades. Re-anchor on Profile, Signature, Trigger, Targets.",
      });
    }
  }

  // Emotion cluster
  const window = trades.slice(0, THRESHOLDS.emotionPatternLookback);
  const tilted = window.filter(
    (t) => t.emotion_tag && ["revenge", "fomo", "rushed"].includes(t.emotion_tag)
  );
  if (tilted.length >= THRESHOLDS.emotionPatternCount) {
    flags.push({
      type: "emotion_pattern",
      severity: "warning",
      message: "The room is loud.",
      detail: `${tilted.length} of the last ${window.length} trades were tagged revenge, fomo, or rushed.`,
    });
  }

  // Size creep after loss
  if (trades.length >= 3 && trades[1].outcome === "loss") {
    const sizes = trades.slice(0, THRESHOLDS.sizeCreepLookback).map((t) => t.contracts);
    const median = computeMedian(sizes);
    if (median > 0 && trades[0].contracts >= median * THRESHOLDS.sizeCreepMultiplier) {
      flags.push({
        type: "size_creep",
        severity: "critical",
        message: "Size doubled after a loss.",
        detail: `${trades[0].contracts} contracts against a typical ${median}. The classic tilt signal.`,
      });
    }
  }

  return flags;
}

// ============================================================================
// BAD HABITS — long-term aggregate analysis, shown on per-student detail page
// ============================================================================

export type Habit = {
  type: string;
  title: string;
  detail: string;
  severity: Severity;
};

const PILLAR_LABELS: Record<string, string> = {
  profile: "Profile",
  signature: "Signature",
  trigger: "Trigger",
  targets: "Targets",
};

export function detectBadHabits(trades: DetectTrade[]): Habit[] {
  const habits: Habit[] = [];
  if (trades.length < THRESHOLDS.habitsMinTrades) return habits;

  // Worst day-of-week
  const byDay = groupBy(trades, (t) => new Date(t.traded_at).getDay());
  const dayNames = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
  for (const [day, ts] of Object.entries(byDay)) {
    if (ts.length < 3) continue;
    const wr = winRate(ts);
    if (wr <= THRESHOLDS.badDayMaxWinRate) {
      habits.push({
        type: "bad_day",
        title: `${dayNames[Number(day)]} are not your day.`,
        detail: `${(wr * 100).toFixed(0)}% across ${ts.length} ${dayNames[Number(day)].toLowerCase()}. Consider sitting them out.`,
        severity: "warning",
      });
    }
  }

  // Most-missed framework criterion
  const missed = {
    profile: trades.filter((t) => !t.criteria_profile).length,
    signature: trades.filter((t) => !t.criteria_signature).length,
    trigger: trades.filter((t) => !t.criteria_trigger).length,
    targets: trades.filter((t) => !t.criteria_targets).length,
  };
  const totalMissed = missed.profile + missed.signature + missed.trigger + missed.targets;
  if (totalMissed > 0) {
    const worst = Object.entries(missed).sort((a, b) => b[1] - a[1])[0];
    const [name, count] = worst;
    if (count >= Math.max(3, Math.floor(trades.length * 0.4))) {
      habits.push({
        type: "missed_criterion",
        title: `${PILLAR_LABELS[name]} is the missed pillar.`,
        detail: `Skipped on ${count} of ${trades.length} trades. The framework breaks when one pillar leaves.`,
        severity: "warning",
      });
    }
  }

  // Worst-performing setup tag
  const bySetup = groupBy(
    trades.filter((t) => t.setup_tag),
    (t) => t.setup_tag!
  );
  for (const [setup, ts] of Object.entries(bySetup)) {
    if (ts.length < THRESHOLDS.badSetupMinTrades) continue;
    const wr = winRate(ts);
    const totalPnl = ts.reduce((s, t) => s + Number(t.pnl), 0);
    if (wr <= THRESHOLDS.badSetupMaxWinRate || totalPnl < 0) {
      habits.push({
        type: "bad_setup",
        title: `${setup} is not pulling its weight.`,
        detail: `${ts.length} trades, ${(wr * 100).toFixed(0)}% win rate, net ${formatSigned(totalPnl)}. Drop it from the playbook.`,
        severity: totalPnl < 0 ? "critical" : "warning",
      });
    }
  }

  // Direction bias
  const longs = trades.filter((t) => t.direction === "long");
  const shorts = trades.filter((t) => t.direction === "short");
  if (longs.length >= 5 && shorts.length >= 5) {
    const longWr = winRate(longs);
    const shortWr = winRate(shorts);
    const gap = Math.abs(longWr - shortWr);
    if (gap >= 0.25) {
      const worse = longWr < shortWr ? "Shorts" : "Longs";
      const worseWr = Math.min(longWr, shortWr);
      const betterWr = Math.max(longWr, shortWr);
      habits.push({
        type: "direction_bias",
        title: `${worse} read worse than the other side.`,
        detail: `${(worseWr * 100).toFixed(0)}% win rate, against ${(betterWr * 100).toFixed(0)}% the other way. There is a reason — find it.`,
        severity: "info",
      });
    }
  }

  // Emotion when losing
  const losses = trades.filter((t) => t.outcome === "loss");
  if (losses.length >= 5) {
    const lossEmotions = groupBy(
      losses.filter((t) => t.emotion_tag),
      (t) => t.emotion_tag!
    );
    const sorted = Object.entries(lossEmotions).sort((a, b) => b[1].length - a[1].length);
    if (sorted.length > 0 && sorted[0][1].length >= Math.floor(losses.length * 0.4)) {
      const [emotion, ts] = sorted[0];
      habits.push({
        type: "emotion_when_losing",
        title: `Losses come tagged ${emotion}.`,
        detail: `${ts.length} of ${losses.length} losing trades. Pattern recognition is the first step.`,
        severity: "info",
      });
    }
  }

  // Framework score correlation with losses
  const lowScoreCount = trades.filter((t) => t.framework_score <= 4).length;
  const highScoreCount = trades.filter((t) => t.framework_score >= 7).length;
  const lowScoreLosses = trades.filter((t) => t.outcome === "loss" && t.framework_score <= 4).length;
  const highScoreLosses = trades.filter((t) => t.outcome === "loss" && t.framework_score >= 7).length;
  if (lowScoreCount >= 3 && highScoreCount >= 3) {
    const lowLossRate = lowScoreLosses / lowScoreCount;
    const highLossRate = highScoreLosses / highScoreCount;
    if (lowLossRate - highLossRate >= 0.25) {
      habits.push({
        type: "framework_pays",
        title: "The framework is paid.",
        detail: `Low-score trades lose ${(lowLossRate * 100).toFixed(0)}% of the time. High-score trades, ${(highLossRate * 100).toFixed(0)}%. The data is unambiguous.`,
        severity: "info",
      });
    }
  }

  return habits;
}

// ============================================================================
// helpers
// ============================================================================

function groupBy<T, K extends string | number>(arr: T[], keyFn: (t: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of arr) {
    const k = keyFn(item);
    (out[k] ??= []).push(item);
  }
  return out;
}

function winRate(trades: DetectTrade[]): number {
  if (trades.length === 0) return 0;
  return trades.filter((t) => t.outcome === "win").length / trades.length;
}

function computeMedian(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function spell(n: number): string {
  const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  return words[n] ?? String(n);
}

function formatSigned(n: number): string {
  const abs = Math.abs(n).toFixed(0);
  return n < 0 ? `−$${abs}` : `+$${abs}`;
}

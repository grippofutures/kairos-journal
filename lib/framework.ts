/**
 * The Kairos rubric — candle profiling.
 *
 * EDIT THIS FILE to refine wording, add new candle types, or change criteria.
 * Everything in the trade form and the help text is driven from here.
 *
 * The framework has 4 pillars (Profile / Signature / Trigger / Targets) which
 * become the per-trade self-grading checklist, and 3 candle types whose
 * descriptions appear inline in the form so students grade against the rubric.
 */

export type CandleType = "expansion" | "reversal_into_expansion" | "reversal" | "other";

export type Criterion =
  | "criteria_profile"
  | "criteria_signature"
  | "criteria_trigger"
  | "criteria_targets";

export const PILLARS: { key: Criterion; label: string; help: string }[] = [
  {
    key: "criteria_profile",
    label: "Profile",
    help:
      "The shape itself. Expansion: opens at one extreme, expands away with a small opposing wick. Reversal: large opposing wick, failure to manipulate the prior high or low.",
  },
  {
    key: "criteria_signature",
    label: "Signature",
    help:
      "The filter. Expansion and reversal-into-expansion: a small opposing wick. Reversal: a large opposing wick. The wick decides.",
  },
  {
    key: "criteria_trigger",
    label: "Trigger",
    help:
      "The condition that earns the entry. The previous candle's EQ respected. A key level present. Or phases of price after an expansion sequence.",
  },
  {
    key: "criteria_targets",
    label: "Targets",
    help:
      "TP1 and TP2 marked before entry — never after. TP1: the prior candle's range. TP2: the higher-timeframe draw on liquidity.",
  },
];

export const CANDLE_TYPES: { value: CandleType; label: string; help: string }[] = [
  {
    value: "expansion",
    label: "Expansion",
    help:
      "Opens at one extreme. Small opposing wick. Expands away to close near the other extreme. EQ of the prior candle holds. TP1 is the prior candle's high or low. TP2 is the higher-timeframe draw on liquidity.",
  },
  {
    value: "reversal_into_expansion",
    label: "Reversal → Expansion",
    help:
      "Two functions in one candle. Touches or wicks the prior candle's low or high at a key level — does not dig past it — then rips the other way like an expansion. Triggered by a key level, or by phases of price after three or more expansion candles in one direction.",
  },
  {
    value: "reversal",
    label: "Reversal",
    help:
      "A failure to manipulate. Wicks past the prior high or low and cannot hold. Closes back through. A large opposing wick is the signature. TP1: roughly half of the reversal candle's range. TP2: the higher-timeframe draw.",
  },
  {
    value: "other",
    label: "Other",
    help: "Use sparingly. Most trades should fit one of the three.",
  },
];

export const SCORE_GUIDE: { min: number; max: number; label: string }[] = [
  { min: 9, max: 10, label: "Textbook. The framework, executed." },
  { min: 7, max: 8, label: "Solid. One pillar compromised." },
  { min: 5, max: 6, label: "Partial. Several pillars compromised." },
  { min: 3, max: 4, label: "Forced. The framework was barely present." },
  { min: 1, max: 2, label: "Outside the framework. An impulse." },
];

/**
 * Returns a Tailwind className for a score.
 * Brand rule: Gold is reserved for the moment achieved (textbook trades).
 * Lower scores get progressively muted treatments — never red.
 */
export function scoreColorClass(score: number): string {
  if (score >= 9) return "text-gold";
  if (score >= 7) return "text-bone";
  if (score >= 5) return "text-bone-dim";
  if (score >= 3) return "text-muted-soft";
  return "text-muted";
}

export function scoreLabel(score: number): string {
  return SCORE_GUIDE.find((g) => score >= g.min && score <= g.max)?.label ?? "";
}

export function candleTypeLabel(t: CandleType | null | undefined): string {
  if (!t) return "—";
  return CANDLE_TYPES.find((c) => c.value === t)?.label ?? t;
}

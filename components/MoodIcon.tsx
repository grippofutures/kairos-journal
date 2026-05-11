/**
 * Monochrome mood glyphs. Each icon visually encodes the emotional state —
 * stable shapes for stable moods, unstable shapes for unstable moods.
 *
 * Geometric primitives only. No emoji. Brand-safe.
 */

type Mood =
  | "calm"
  | "confident"
  | "hesitant"
  | "rushed"
  | "revenge"
  | "fomo"
  | "blank";

export function MoodIcon({
  mood,
  size = 14,
  className = "",
}: {
  mood: string;
  size?: number;
  className?: string;
}) {
  const m = mood as Mood;
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.4",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: `inline-block align-middle ${className}`,
  };

  switch (m) {
    case "calm":
      // Steady — filled circle, anchored
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="4" fill="currentColor" stroke="none" />
        </svg>
      );

    case "confident":
      // Rising — upward triangle (outline)
      return (
        <svg {...common}>
          <path d="M8 3 L13 12 L3 12 Z" />
        </svg>
      );

    case "hesitant":
      // Uncertain — wavy line
      return (
        <svg {...common}>
          <path d="M2 8 Q4.5 4.5, 7 8 T 12 8 T 14 8" />
        </svg>
      );

    case "rushed":
      // Speed — double chevron forward
      return (
        <svg {...common}>
          <path d="M4 4 L9 8 L4 12" />
          <path d="M8 4 L13 8 L8 12" />
        </svg>
      );

    case "revenge":
      // Conflict — X
      return (
        <svg {...common}>
          <path d="M4 4 L12 12" />
          <path d="M12 4 L4 12" />
        </svg>
      );

    case "fomo":
      // Chase — broken circle with motion
      return (
        <svg {...common}>
          <path d="M11.5 4 A 5 5 0 1 0 13 9" />
          <path d="M11 2 L13 4 L11 6" />
        </svg>
      );

    case "blank":
    default:
      // Empty — short horizontal line
      return (
        <svg {...common}>
          <path d="M3 8 L13 8" />
        </svg>
      );
  }
}

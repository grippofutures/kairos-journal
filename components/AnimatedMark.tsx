/**
 * Kairos editorial mark — animated.
 *
 * The hourglass drains over 32 seconds, then the whole figure flips and the
 * cycle repeats. The gold bead breathes on a 4-second cycle. All motion is
 * slow and restrained — "wait, then act" embodied visually.
 *
 * Respects `prefers-reduced-motion: reduce` (stops all animation).
 * Server component — pure SVG + CSS, no JS state.
 */

export function AnimatedMark({ size = 200 }: { size?: number }) {
  const w = size * 0.6;
  return (
    <div
      className="kairos-mark-wrap"
      style={{ width: w, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 60 100"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top gold rule */}
        <line x1="6" y1="5" x2="54" y2="5" stroke="#C6AB5C" strokeWidth="2" />
        {/* Bottom gold rule */}
        <line x1="6" y1="95" x2="54" y2="95" stroke="#C6AB5C" strokeWidth="2" />

        {/* Hourglass chamber outlines — faint, so the user sees the empty
            space the sand is draining into. */}
        <polygon
          points="10,9 50,9 30,50"
          fill="none"
          stroke="#F0EDE8"
          strokeWidth="0.4"
          opacity="0.20"
        />
        <polygon
          points="10,91 50,91 30,50"
          fill="none"
          stroke="#F0EDE8"
          strokeWidth="0.4"
          opacity="0.20"
        />

        {/* The sand — two animated polygons.
            Top drains (scaleY 1 → 0 with origin at the apex = bottom of the
            top triangle). Bottom fills (scaleY 0 → 1 with origin at the apex
            = top of the bottom triangle). */}
        <polygon
          className="kairos-sand-top"
          points="10,9 50,9 30,50"
          fill="#F0EDE8"
        />
        <polygon
          className="kairos-sand-bottom"
          points="10,91 50,91 30,50"
          fill="#F0EDE8"
        />

        {/* The moment — gold bead, pulses on a 4s cycle */}
        <circle
          className="kairos-bead"
          cx="30"
          cy="50"
          r="2"
          fill="#C6AB5C"
        />
      </svg>

      <style>{`
        .kairos-mark-wrap {
          display: inline-block;
          /* Flip 180° instantly at the halfway point so the cycle continues
             with the chambers visually swapped. 64s total = 32s drain + flip
             + 32s drain (now reversed orientation). */
          animation: kairos-flip 64s steps(1, end) infinite;
        }

        .kairos-sand-top {
          transform-box: fill-box;
          transform-origin: 50% 100%; /* the apex (bottom of the top triangle) */
          animation: kairos-drain 32s ease-in-out infinite;
        }

        .kairos-sand-bottom {
          transform-box: fill-box;
          transform-origin: 50% 100%; /* the base — sand piles UP from the floor */
          animation: kairos-fill 32s ease-in-out infinite;
        }

        .kairos-bead {
          transform-box: fill-box;
          transform-origin: center;
          animation: kairos-bead 4s ease-in-out infinite;
        }

        @keyframes kairos-flip {
          0%, 49.9% { transform: rotate(0deg); }
          50%, 100% { transform: rotate(180deg); }
        }

        @keyframes kairos-drain {
          0% { transform: scaleY(1); }
          100% { transform: scaleY(0); }
        }

        @keyframes kairos-fill {
          0% { transform: scaleY(0); }
          100% { transform: scaleY(1); }
        }

        @keyframes kairos-bead {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.18); opacity: 0.78; }
        }

        @media (prefers-reduced-motion: reduce) {
          .kairos-mark-wrap,
          .kairos-sand-top,
          .kairos-sand-bottom,
          .kairos-bead {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Kairos editorial mark — animated.
 *
 * The hourglass drains the top chamber and fills the bottom over 22 seconds.
 * Then both sand polygons fade out, reset to their start positions, and fade
 * back in for the next cycle. No flip — sand always falls down, never up.
 *
 * The gold bead breathes on a 4-second cycle.
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
          opacity="0.18"
        />
        <polygon
          points="10,91 50,91 30,50"
          fill="none"
          stroke="#F0EDE8"
          strokeWidth="0.4"
          opacity="0.18"
        />

        {/* The sand — two animated polygons.
            Top drains (scaleY 1 → 0 with origin at the apex = the bottom of
            the top triangle, so the wide top edge slides DOWN toward the apex).
            Bottom fills (scaleY 0 → 1 with origin at the base = the bottom of
            the bottom triangle, so the apex rises UP from the floor). */}
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
        }

        /* Top sand: drains from full (scaleY 1) to empty (scaleY 0).
           Origin at the apex (bottom-center of bbox) so the wide top
           edge slides DOWN toward the apex as sand drains. */
        .kairos-sand-top {
          transform-box: fill-box;
          transform-origin: 50% 100%;
          animation: kairos-drain 22s ease-in-out infinite;
        }

        /* Bottom sand: fills from empty (scaleY 0) to full (scaleY 1).
           Origin at the base (bottom-center of bbox) so the apex RISES
           UP from the floor as sand piles. */
        .kairos-sand-bottom {
          transform-box: fill-box;
          transform-origin: 50% 100%;
          animation: kairos-fill 22s ease-in-out infinite;
        }

        .kairos-bead {
          transform-box: fill-box;
          transform-origin: center;
          animation: kairos-bead 4s ease-in-out infinite;
        }

        /* Drain cycle:
             0%–75%   sand falls (the visible drain)
             75%–82%  pause at empty (let it land)
             82%–92%  fade out (both sands)
             92%–93%  snap back to start position (invisible)
             93%–100% fade back in at full
        */
        @keyframes kairos-drain {
          0%   { transform: scaleY(1); opacity: 1; }
          75%  { transform: scaleY(0); opacity: 1; }
          82%  { transform: scaleY(0); opacity: 1; }
          92%  { transform: scaleY(0); opacity: 0; }
          92.5% { transform: scaleY(1); opacity: 0; }
          100% { transform: scaleY(1); opacity: 1; }
        }

        @keyframes kairos-fill {
          0%   { transform: scaleY(0); opacity: 1; }
          75%  { transform: scaleY(1); opacity: 1; }
          82%  { transform: scaleY(1); opacity: 1; }
          92%  { transform: scaleY(1); opacity: 0; }
          92.5% { transform: scaleY(0); opacity: 0; }
          100% { transform: scaleY(0); opacity: 1; }
        }

        @keyframes kairos-bead {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.18); opacity: 0.78; }
        }

        @media (prefers-reduced-motion: reduce) {
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

"use client";

/**
 * Error boundary for /mentor and nested routes. Renders the actual error
 * message + stack on screen so we can debug without going into Vercel logs.
 * Remove this once /mentor is stable in production.
 */
export default function MentorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-3xl w-full">
        <div className="eyebrow mb-3">
          <span className="rule-gold mr-3" />
          The mentor page crashed
        </div>
        <h1 className="font-display text-3xl text-bone mb-6">
          Server error captured for debugging.
        </h1>

        <div className="card p-6 space-y-4">
          <div>
            <div className="eyebrow-muted mb-2">Message</div>
            <pre className="text-sm text-bone whitespace-pre-wrap bg-canvas p-3 border border-soft overflow-auto max-h-40">
              {error.message || "(no message)"}
            </pre>
          </div>
          {error.digest && (
            <div>
              <div className="eyebrow-muted mb-2">Digest</div>
              <pre className="text-sm text-bone-dim bg-canvas p-3 border border-soft">
                {error.digest}
              </pre>
            </div>
          )}
          {error.stack && (
            <div>
              <div className="eyebrow-muted mb-2">Stack trace</div>
              <pre className="text-[11px] text-bone-dim whitespace-pre-wrap bg-canvas p-3 border border-soft overflow-auto max-h-96">
                {error.stack}
              </pre>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={reset} className="btn-primary">
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

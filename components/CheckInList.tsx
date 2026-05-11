import { MoodIcon } from "./MoodIcon";
import { EmptyState } from "./EmptyState";

type CheckIn = {
  check_in_date: string;
  pre_market_mood: string | null;
  energy_level: number | null;
  sleep_hours: number | null;
  pre_market_note: string | null;
  post_market_mood: string | null;
  reflection: string | null;
  skipped_day: boolean;
};

const MOOD_LABELS: Record<string, string> = {
  calm: "Calm",
  confident: "Confident",
  hesitant: "Hesitant",
  rushed: "Rushed",
  revenge: "Revenge",
  fomo: "FOMO",
  blank: "Blank",
};

function fmtDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function CheckInList({ checkins }: { checkins: CheckIn[] }) {
  if (checkins.length === 0) {
    return (
      <EmptyState
        title="No daily check-ins yet."
        subtitle="The first one comes tomorrow."
      />
    );
  }

  return (
    <div className="space-y-3">
      {checkins.map((c) => {
        if (c.skipped_day) {
          return (
            <article
              key={c.check_in_date}
              className="card p-5 flex items-center justify-between gap-3"
            >
              <div className="font-display text-lg text-bone">
                {fmtDate(c.check_in_date)}
              </div>
              <span className="text-[10px] tracking-eyebrow uppercase border border-gold/60 text-gold px-2 py-0.5">
                Skipped — sat out
              </span>
            </article>
          );
        }

        const hasPre = !!(
          c.pre_market_mood ||
          c.energy_level != null ||
          c.sleep_hours != null ||
          c.pre_market_note
        );
        const hasPost = !!(c.post_market_mood || c.reflection);
        return (
          <article key={c.check_in_date} className="card p-5">
            <div className="flex items-baseline justify-between mb-3 gap-3">
              <div className="font-display text-lg text-bone">
                {fmtDate(c.check_in_date)}
              </div>
              <div className="flex gap-3 eyebrow-muted text-[11px] flex-wrap justify-end items-center">
                {c.pre_market_mood && (
                  <span className="flex items-center gap-1.5 text-bone-dim">
                    <span className="text-muted">Pre</span>
                    <MoodIcon mood={c.pre_market_mood} size={12} />
                    <span>{MOOD_LABELS[c.pre_market_mood] ?? c.pre_market_mood}</span>
                  </span>
                )}
                {c.post_market_mood && (
                  <span className="flex items-center gap-1.5 text-bone-dim">
                    <span className="text-muted">Post</span>
                    <MoodIcon mood={c.post_market_mood} size={12} />
                    <span>{MOOD_LABELS[c.post_market_mood] ?? c.post_market_mood}</span>
                  </span>
                )}
              </div>
            </div>

            {(c.energy_level != null || c.sleep_hours != null) && (
              <div className="flex gap-6 text-sm text-bone-dim mb-3">
                {c.energy_level != null && (
                  <span>
                    <span className="text-muted">Energy</span> {c.energy_level}/5
                  </span>
                )}
                {c.sleep_hours != null && (
                  <span>
                    <span className="text-muted">Sleep</span> {c.sleep_hours}h
                  </span>
                )}
              </div>
            )}

            {c.pre_market_note && (
              <div className="mb-3">
                <div className="eyebrow-muted text-[10px] mb-1">Pre-market note</div>
                <p className="text-sm text-bone-dim leading-relaxed">
                  {c.pre_market_note}
                </p>
              </div>
            )}
            {c.reflection && (
              <div>
                <div className="eyebrow-muted text-[10px] mb-1">Reflection</div>
                <p className="text-sm text-bone-dim italic font-display leading-relaxed">
                  {c.reflection}
                </p>
              </div>
            )}

            {!hasPre && !hasPost && (
              <p className="text-xs text-muted italic font-display">
                Day logged but blank.
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}

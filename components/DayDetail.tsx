/**
 * Detail panel shown when a calendar day is selected.
 * Renders that day's trades and (if logged) the daily check-in.
 */

import { MoodIcon } from "./MoodIcon";
import { EmptyState } from "./EmptyState";
import { NumberCounter } from "./NumberCounter";

type Trade = {
  id: string;
  traded_at: string;
  instrument: string;
  direction: string;
  contracts: number;
  pnl: number;
  outcome: string;
  thesis: string;
  followed_model: boolean;
  setup_tag: string | null;
};

type Checkin = {
  pre_market_mood: string | null;
  energy_level: number | null;
  sleep_hours: number | null;
  pre_market_note: string | null;
  post_market_mood: string | null;
  reflection: string | null;
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
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DayDetail({
  date,
  trades,
  checkin,
}: {
  date: string;
  trades: Trade[];
  checkin: Checkin | null;
}) {
  const totalPnl = trades.reduce((s, t) => s + Number(t.pnl), 0);
  const wins = trades.filter((t) => t.outcome === "win").length;
  const followedAll = trades.length > 0 && trades.every((t) => t.followed_model);

  return (
    <section className="mt-10">
      <div className="eyebrow mb-3">
        <span className="rule-gold mr-3" />
        Day detail
      </div>
      <h2 className="font-display text-3xl mb-5">{fmtDate(date)}</h2>

      {/* Day stats */}
      {trades.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-soft border border-soft mb-8">
          <BigStatNum label="Trades" value={trades.length} format={(n) => String(Math.round(n))} />
          <BigStatNum
            label="Net"
            value={totalPnl}
            format={(n) => `${n >= 0 ? "+" : ""}${Math.round(n)}`}
          />
          <BigStat label="Wins" value={`${wins} / ${trades.length}`} />
          <BigStat
            label="Rules"
            value={followedAll ? "Followed" : "Broken"}
            emphasis={followedAll}
          />
        </div>
      )}

      {/* Check-in */}
      {checkin && (
        <article className="card p-6 mb-8">
          <div className="eyebrow-muted mb-3">Daily check-in</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-muted mb-1 uppercase tracking-wider">
                Pre-market
              </div>
              {checkin.pre_market_mood && (
                <div className="font-display text-bone mb-1 flex items-center gap-2">
                  <span className="text-muted">Mood</span>
                  <span className="text-muted">·</span>
                  <MoodIcon mood={checkin.pre_market_mood} size={14} />
                  {MOOD_LABELS[checkin.pre_market_mood] ?? checkin.pre_market_mood}
                </div>
              )}
              {(checkin.energy_level != null || checkin.sleep_hours != null) && (
                <div className="text-sm text-bone-dim mb-2">
                  {checkin.energy_level != null && <>Energy {checkin.energy_level}/5 · </>}
                  {checkin.sleep_hours != null && <>Sleep {checkin.sleep_hours}h</>}
                </div>
              )}
              {checkin.pre_market_note && (
                <p className="text-sm text-bone-dim italic font-display leading-relaxed">
                  {checkin.pre_market_note}
                </p>
              )}
              {!checkin.pre_market_mood &&
                !checkin.pre_market_note &&
                checkin.energy_level == null &&
                checkin.sleep_hours == null && (
                  <p className="text-sm text-muted italic">Not logged.</p>
                )}
            </div>
            <div>
              <div className="text-xs text-muted mb-1 uppercase tracking-wider">
                Post-market
              </div>
              {checkin.post_market_mood && (
                <div className="font-display text-bone mb-1 flex items-center gap-2">
                  <span className="text-muted">Mood</span>
                  <span className="text-muted">·</span>
                  <MoodIcon mood={checkin.post_market_mood} size={14} />
                  {MOOD_LABELS[checkin.post_market_mood] ?? checkin.post_market_mood}
                </div>
              )}
              {checkin.reflection && (
                <p className="text-sm text-bone-dim italic font-display leading-relaxed">
                  {checkin.reflection}
                </p>
              )}
              {!checkin.post_market_mood && !checkin.reflection && (
                <p className="text-sm text-muted italic">Not logged.</p>
              )}
            </div>
          </div>
        </article>
      )}

      {/* Trades list */}
      {trades.length > 0 ? (
        <div>
          <div className="eyebrow-muted mb-3">Trades that day</div>
          <div className="space-y-3">
            {trades.map((t) => (
              <article key={t.id} className="card p-5">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <div className="font-display text-lg text-bone">
                    {t.instrument} ·{" "}
                    <span className={t.direction === "long" ? "text-bone-dim" : "italic text-bone-dim"}>
                      {t.direction}
                    </span>{" "}
                    × {t.contracts}
                  </div>
                  <div className="flex gap-3 items-baseline">
                    <span className="text-xs text-muted">{fmtTime(t.traded_at)}</span>
                    <span
                      className={`font-display num ${
                        Number(t.pnl) >= 0 ? "text-bone" : "italic text-muted-soft"
                      }`}
                    >
                      {Number(t.pnl) >= 0 ? "+" : ""}
                      {Math.round(Number(t.pnl))}
                    </span>
                  </div>
                </div>
                {t.setup_tag && (
                  <div className="text-xs text-muted-soft mb-2">{t.setup_tag}</div>
                )}
                <p className="text-sm text-bone-dim leading-relaxed">{t.thesis}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`text-[10px] tracking-eyebrow uppercase border px-2 py-0.5 ${
                      t.followed_model
                        ? "border-gold/60 text-gold"
                        : "border-soft text-muted-soft italic"
                    }`}
                  >
                    {t.followed_model ? "Followed" : "Broken"}
                  </span>
                  <span
                    className={`text-[10px] tracking-eyebrow uppercase text-muted`}
                  >
                    {t.outcome}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : !checkin ? (
        <EmptyState
          title="No trades or check-in logged for this day."
          subtitle="The day was sat out, or it simply hasn't happened yet."
        />
      ) : null}
    </section>
  );
}

function BigStat({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="bg-canvas px-5 py-5">
      <div className="eyebrow-muted">{label}</div>
      <div
        className={`mt-2 font-display num text-2xl leading-none ${
          emphasis ? "italic text-gold" : "text-bone"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function BigStatNum({
  label,
  value,
  format,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
}) {
  return (
    <div className="bg-canvas px-5 py-5">
      <div className="eyebrow-muted">{label}</div>
      <div className="mt-2 font-display num text-2xl leading-none text-bone">
        <NumberCounter value={value} format={format} />
      </div>
    </div>
  );
}

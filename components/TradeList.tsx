import { fmtMoneySigned } from "@/lib/stats";
import { deleteTrade } from "@/app/dashboard/actions";
import { candleTypeLabel, scoreColorClass, type CandleType } from "@/lib/framework";
import { MoodIcon } from "./MoodIcon";
import { EmptyState } from "./EmptyState";

type Trade = {
  id: string;
  traded_at: string;
  instrument: string;
  direction: string;
  contracts: number;
  entry_price: number | null;
  exit_price: number | null;
  pnl: number;
  r_multiple: number | null;
  setup_tag: string | null;
  outcome: "win" | "loss" | "breakeven";
  notes: string | null;
  emotion_tag: string | null;
  thesis?: string | null;
  candle_type?: CandleType | null;
  framework_score?: number | null;
  followed_model?: boolean | null;
  screenshot_url: string | null;
  reviewed_at?: string | null;
};

const OUTCOME_WORD: Record<Trade["outcome"], string> = {
  win: "Won",
  loss: "Lost",
  breakeven: "Even",
};

export function TradeList({
  trades,
  showOwner = false,
  showDelete = true,
  extraPerTrade,
}: {
  trades: (Trade & { owner_email?: string })[];
  showOwner?: boolean;
  showDelete?: boolean;
  /**
   * Optional render prop that adds content (mentor controls, comments, etc.)
   * below each trade's main body but above the Remove button.
   */
  extraPerTrade?: (trade: Trade) => React.ReactNode;
}) {
  if (trades.length === 0) {
    return (
      <EmptyState
        title="The first trade has not yet been logged."
        subtitle="Wait. Then act."
      />
    );
  }

  return (
    <div className="space-y-4">
      {trades.map((t) => {
        const hasPrices = t.entry_price != null && t.exit_price != null;
        const reviewedBadge = t.reviewed_at ? (
          <span className="text-[10px] tracking-eyebrow uppercase border border-soft text-muted px-2 py-0.5">
            Reviewed
          </span>
        ) : null;
        const followedBadge =
          t.followed_model === true ? (
            <span className="text-[10px] tracking-eyebrow uppercase border border-gold/60 text-gold px-2 py-0.5">
              Followed
            </span>
          ) : t.followed_model === false ? (
            <span className="text-[10px] tracking-eyebrow uppercase border border-soft text-muted-soft italic px-2 py-0.5">
              Broken
            </span>
          ) : null;
        return (
          <article key={t.id} className="card p-6">
            <header className="flex items-start justify-between gap-6 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-display text-xl">{t.instrument}</span>
                  <span className="text-soft">·</span>
                  <span className="eyebrow-muted">
                    {t.direction} · {t.contracts}c
                  </span>
                  <span className="text-soft">·</span>
                  <span className="font-display italic text-bone">
                    {OUTCOME_WORD[t.outcome]}.
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {followedBadge}
                  {reviewedBadge}
                  {t.candle_type && (
                    <span className="text-[11px] tracking-eyebrow uppercase text-gold border border-gold/40 px-2 py-0.5">
                      {candleTypeLabel(t.candle_type)}
                    </span>
                  )}
                  {t.setup_tag && (
                    <span className="text-[11px] tracking-eyebrow uppercase text-bone-dim border border-soft px-2 py-0.5">
                      {t.setup_tag}
                    </span>
                  )}
                  {t.emotion_tag && (
                    <span className="text-[11px] tracking-eyebrow uppercase text-muted-soft border border-soft px-2 py-0.5 inline-flex items-center gap-1.5">
                      <MoodIcon mood={t.emotion_tag} size={11} />
                      {t.emotion_tag}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-soft mt-3">
                  {showOwner && t.owner_email && (
                    <span className="text-bone-dim mr-2">{t.owner_email}</span>
                  )}
                  {new Date(t.traded_at).toLocaleString()}
                  {hasPrices && <> · {t.entry_price} → {t.exit_price}</>}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display italic text-3xl text-bone num leading-none">
                  {fmtMoneySigned(Number(t.pnl))}
                </div>
                <div className="eyebrow-muted mt-2">
                  {t.r_multiple != null && <>{Number(t.r_multiple).toFixed(2)}R</>}
                  {t.r_multiple != null && t.framework_score != null && " · "}
                  {t.framework_score != null && (
                    <span className={scoreColorClass(t.framework_score)}>
                      {t.framework_score}/10
                    </span>
                  )}
                </div>
              </div>
            </header>

            {t.thesis && (
              <div className="mt-5 pl-4 border-l border-gold/40">
                <div className="eyebrow-muted mb-2">The thesis</div>
                <p className="text-[14px] text-bone leading-relaxed font-display">
                  {t.thesis}
                </p>
              </div>
            )}

            {t.notes && (
              <p className="text-sm text-bone-dim mt-3 leading-relaxed">{t.notes}</p>
            )}

            {t.screenshot_url && (
              <a
                href={t.screenshot_url}
                target="_blank"
                rel="noreferrer"
                className="block mt-5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.screenshot_url}
                  alt="trade chart"
                  className="border border-soft max-h-72 object-contain"
                />
              </a>
            )}

            {extraPerTrade?.(t)}

            {showDelete && (
              <form action={deleteTrade} className="mt-4">
                <input type="hidden" name="id" value={t.id} />
                <button
                  type="submit"
                  className="text-[11px] tracking-eyebrow uppercase text-muted hover:text-gold transition-colors"
                >
                  Remove
                </button>
              </form>
            )}
          </article>
        );
      })}
    </div>
  );
}

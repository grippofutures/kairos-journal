import { markReviewed, unmarkReviewed } from "@/app/mentor/actions";

export function ReviewControls({
  tradeId,
  reviewedAt,
  reviewerName,
  returnTo,
}: {
  tradeId: string;
  reviewedAt: string | null;
  reviewerName: string | null;
  returnTo: string;
}) {
  if (reviewedAt) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[11px] eyebrow-muted">
          Reviewed{reviewerName ? ` · ${reviewerName}` : ""} ·{" "}
          {new Date(reviewedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
        <form action={unmarkReviewed} className="inline">
          <input type="hidden" name="trade_id" value={tradeId} />
          <input type="hidden" name="return_to" value={returnTo} />
          <button type="submit" className="btn-quiet text-[11px]">
            Reopen
          </button>
        </form>
      </div>
    );
  }
  return (
    <form action={markReviewed} className="inline">
      <input type="hidden" name="trade_id" value={tradeId} />
      <input type="hidden" name="return_to" value={returnTo} />
      <button
        type="submit"
        className="btn-primary text-[11px] px-3 py-1.5"
      >
        Mark reviewed
      </button>
    </form>
  );
}

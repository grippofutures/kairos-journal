import { postComment, deleteComment } from "@/app/mentor/actions";

export type TradeComment = {
  id: string;
  body: string;
  created_at: string;
  author: {
    display_name: string | null;
    email: string;
  } | null;
};

export function CommentThread({
  tradeId,
  comments,
  canPost,
  canDelete = false,
  returnTo,
}: {
  tradeId: string;
  comments: TradeComment[];
  /** Show the comment form. False for student view (read-only). */
  canPost: boolean;
  /** Show delete button next to each comment. True for mentor only. */
  canDelete?: boolean;
  /** Path to revalidate after submission. */
  returnTo: string;
}) {
  return (
    <div className="mt-5 pt-5 border-t border-soft">
      <div className="eyebrow-muted mb-3">
        Mentor notes
        {comments.length > 0 && <> · {comments.length}</>}
      </div>

      {comments.length > 0 && (
        <div className="space-y-3 mb-4">
          {comments.map((c) => (
            <div
              key={c.id}
              className="bg-canvas border-l-2 border-gold pl-4 pr-3 py-2.5"
            >
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <div className="text-[11px] eyebrow-muted">
                  {c.author?.display_name || c.author?.email || "Mentor"} ·{" "}
                  {new Date(c.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {canDelete && (
                  <form action={deleteComment}>
                    <input type="hidden" name="comment_id" value={c.id} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <button
                      type="submit"
                      className="text-[10px] uppercase tracking-eyebrow text-muted hover:text-gold transition-colors"
                    >
                      Remove
                    </button>
                  </form>
                )}
              </div>
              <p className="text-sm text-bone-dim font-display italic leading-relaxed whitespace-pre-wrap">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {canPost ? (
        <form action={postComment} className="space-y-2">
          <input type="hidden" name="trade_id" value={tradeId} />
          <input type="hidden" name="return_to" value={returnTo} />
          <textarea
            name="body"
            rows={2}
            maxLength={2000}
            required
            placeholder="Leave a note for the student about this trade."
            className="w-full text-sm"
          />
          <div className="flex justify-end">
            <button type="submit" className="btn-quiet text-[11px]">
              Post note
            </button>
          </div>
        </form>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted italic">No notes from your mentor yet.</p>
      ) : null}
    </div>
  );
}

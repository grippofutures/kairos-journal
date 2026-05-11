import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar, PageHeader, Footer } from "@/components/Brand";
import { signOut } from "@/app/login/actions";
import { CommentThread, type TradeComment } from "@/components/CommentThread";
import { ReviewControls } from "@/components/ReviewControls";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  email: string;
  display_name: string | null;
};

export default async function ReviewQueuePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "mentor") redirect("/dashboard");

  // Unreviewed trades, oldest first
  const { data: trades = [] } = await supabase
    .from("trades")
    .select(
      "id, user_id, traded_at, instrument, direction, contracts, pnl, outcome, thesis, setup_tag, notes, emotion_tag, screenshot_path, followed_model, created_at, reviewed_at",
    )
    .is("reviewed_at", null)
    .order("created_at", { ascending: true })
    .limit(50);

  const tradesArr = trades ?? [];
  const userIds = [...new Set(tradesArr.map((t) => t.user_id))];

  const { data: students = [] } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  const studentMap = new Map<string, Profile>(
    (students ?? []).map((s) => [s.id, s as Profile]),
  );

  const tradeIds = tradesArr.map((t) => t.id);
  const { data: rawComments = [] } = await supabase
    .from("trade_comments")
    .select("id, trade_id, body, created_at, author_id")
    .in("trade_id", tradeIds.length > 0 ? tradeIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: true });

  const authorIds = [...new Set((rawComments ?? []).map((c) => c.author_id))];
  const { data: authors = [] } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .in("id", authorIds.length > 0 ? authorIds : ["00000000-0000-0000-0000-000000000000"]);
  const authorMap = new Map<string, Profile>(
    (authors ?? []).map((a) => [a.id, a as Profile]),
  );

  const commentsByTrade = new Map<string, TradeComment[]>();
  for (const c of rawComments ?? []) {
    const author = authorMap.get(c.author_id) ?? null;
    const list = commentsByTrade.get(c.trade_id) ?? [];
    list.push({
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      author: author
        ? { display_name: author.display_name, email: author.email }
        : null,
    });
    commentsByTrade.set(c.trade_id, list);
  }

  // Signed URLs for screenshots
  const tradesWithUrls = await Promise.all(
    tradesArr.map(async (t) => {
      let url: string | null = null;
      if (t.screenshot_path) {
        const { data } = await supabase.storage
          .from("screenshots")
          .createSignedUrl(t.screenshot_path, 60 * 60);
        url = data?.signedUrl ?? null;
      }
      return { ...t, screenshot_url: url };
    }),
  );

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        right={
          <div className="flex items-center gap-4">
            <Link href="/mentor" className="btn-quiet">
              ← Cohort
            </Link>
            <form action={signOut}>
              <button className="btn-quiet">Sign out</button>
            </form>
          </div>
        }
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        <PageHeader
          eyebrow="The review queue"
          title={
            <>
              The inbox — <em className="text-gold">unreviewed.</em>
            </>
          }
          lede={
            tradesWithUrls.length === 0
              ? "The queue is empty."
              : `${tradesWithUrls.length} trade${
                  tradesWithUrls.length === 1 ? "" : "s"
                } waiting. Oldest first. Mark reviewed to clear from this list.`
          }
        />

        {tradesWithUrls.length === 0 ? (
          <EmptyState
            title="Caught up. Every trade has been reviewed."
            subtitle="Wait. Then act."
            size={300}
          />
        ) : (
          <div className="space-y-6">
            {tradesWithUrls.map((t) => {
              const student = studentMap.get(t.user_id);
              const studentName =
                student?.display_name || student?.email || "Unknown";
              const tradeComments = commentsByTrade.get(t.id) ?? [];
              return (
                <article key={t.id} className="card p-6">
                  <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
                    <div>
                      <Link
                        href={`/mentor/${t.user_id}`}
                        className="font-display text-lg text-bone hover:text-gold transition-colors"
                      >
                        {studentName}
                      </Link>
                      <div className="text-xs text-muted mt-0.5">
                        {new Date(t.traded_at).toLocaleString()}
                      </div>
                    </div>
                    <ReviewControls
                      tradeId={t.id}
                      reviewedAt={t.reviewed_at}
                      reviewerName={null}
                      returnTo="/mentor/queue"
                    />
                  </div>

                  <div className="flex items-baseline gap-3 mb-3 text-sm flex-wrap">
                    <span className="font-display text-bone">
                      {t.instrument} {t.direction} × {t.contracts}
                    </span>
                    <span
                      className={`font-display num text-xl leading-none ${
                        Number(t.pnl) >= 0 ? "text-bone" : "italic text-muted-soft"
                      }`}
                    >
                      {Number(t.pnl) >= 0 ? "+" : ""}
                      {Math.round(Number(t.pnl))}
                    </span>
                    <span className="text-[11px] text-muted uppercase tracking-eyebrow">
                      {t.outcome}
                    </span>
                    {t.followed_model ? (
                      <span className="text-[10px] tracking-eyebrow uppercase border border-gold/60 text-gold px-2 py-0.5">
                        Followed
                      </span>
                    ) : (
                      <span className="text-[10px] tracking-eyebrow uppercase border border-soft text-muted-soft italic px-2 py-0.5">
                        Broken
                      </span>
                    )}
                    {t.setup_tag && (
                      <span className="text-[11px] tracking-eyebrow uppercase text-bone-dim border border-soft px-2 py-0.5">
                        {t.setup_tag}
                      </span>
                    )}
                  </div>

                  {t.thesis && (
                    <div className="mt-2 pl-4 border-l border-gold/40">
                      <div className="eyebrow-muted mb-2 text-[10px]">
                        The thesis
                      </div>
                      <p className="text-[14px] text-bone leading-relaxed font-display">
                        {t.thesis}
                      </p>
                    </div>
                  )}

                  {t.notes && (
                    <p className="text-sm text-bone-dim mt-3 leading-relaxed">
                      {t.notes}
                    </p>
                  )}

                  {t.screenshot_url && (
                    <a
                      href={t.screenshot_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block mt-4"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={t.screenshot_url}
                        alt="trade chart"
                        className="border border-soft max-h-[400px] w-full object-contain"
                      />
                    </a>
                  )}

                  <CommentThread
                    tradeId={t.id}
                    comments={tradeComments}
                    canPost={true}
                    canDelete={true}
                    returnTo="/mentor/queue"
                  />
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

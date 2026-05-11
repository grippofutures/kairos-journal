import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStats } from "@/lib/stats";
import { computeRulesStreak } from "@/lib/streak";
import { computeRecentDays } from "@/lib/recent-days";
import { StatsBar } from "@/components/StatsBar";
import { TradeForm } from "@/components/TradeForm";
import { TradeList } from "@/components/TradeList";
import { StreakBadge } from "@/components/StreakBadge";
import { DailyCheckIn } from "@/components/DailyCheckIn";
import { CommentThread, type TradeComment } from "@/components/CommentThread";
import { TopBar, PageHeader, Footer } from "@/components/Brand";
import { signOut } from "@/app/login/actions";

export const dynamic = "force-dynamic";

const TRADE_COLUMNS =
  "id, traded_at, instrument, direction, contracts, entry_price, exit_price, pnl, r_multiple, setup_tag, outcome, notes, emotion_tag, screenshot_path, thesis, candle_type, framework_score, criteria_profile, criteria_signature, criteria_trigger, criteria_targets, followed_model, reviewed_at";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, email")
    .eq("id", user.id)
    .single();

  if (profile?.role === "mentor") redirect("/mentor");

  const { data: trades = [] } = await supabase
    .from("trades")
    .select(TRADE_COLUMNS)
    .eq("user_id", user.id)
    .order("traded_at", { ascending: false })
    .limit(50);

  const stats = computeStats((trades ?? []).map((t) => ({
    id: t.id,
    traded_at: t.traded_at,
    outcome: t.outcome,
    pnl: Number(t.pnl),
    r_multiple: t.r_multiple == null ? null : Number(t.r_multiple),
    framework_score: Number(t.framework_score),
  })));

  const streak = computeRulesStreak(
    (trades ?? []).map((t) => ({
      traded_at: t.traded_at,
      followed_model: !!t.followed_model,
    })),
  );

  // Today's daily check-in (one row max per user per date)
  const today = new Date().toISOString().slice(0, 10);
  const { data: todayCheckin } = await supabase
    .from("daily_checkins")
    .select(
      "pre_market_mood, energy_level, sleep_hours, pre_market_note, post_market_mood, reflection, skipped_day",
    )
    .eq("user_id", user.id)
    .eq("check_in_date", today)
    .maybeSingle();

  // Last 14 daily check-ins (for the streak strip — skipped/followed/broken status per day)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const fourteenStart = fourteenDaysAgo.toISOString().slice(0, 10);
  const { data: recentCheckins = [] } = await supabase
    .from("daily_checkins")
    .select("check_in_date, skipped_day")
    .eq("user_id", user.id)
    .gte("check_in_date", fourteenStart);

  const recentDays = computeRecentDays(
    (trades ?? []).map((t) => ({
      traded_at: t.traded_at,
      followed_model: !!t.followed_model,
    })),
    (recentCheckins ?? []).map((c) => ({
      check_in_date: c.check_in_date,
      skipped_day: !!c.skipped_day,
    })),
    14,
  );

  const tradesWithUrls = await Promise.all(
    (trades ?? []).map(async (t) => {
      let screenshot_url: string | null = null;
      if (t.screenshot_path) {
        const { data: signed } = await supabase.storage
          .from("screenshots")
          .createSignedUrl(t.screenshot_path, 60 * 60);
        screenshot_url = signed?.signedUrl ?? null;
      }
      return { ...t, screenshot_url };
    })
  );

  // Mentor comments on this student's trades — read-only display
  const tradeIds = (trades ?? []).map((t) => t.id);
  const { data: rawComments = [] } = await supabase
    .from("trade_comments")
    .select("id, trade_id, body, created_at, author_id")
    .in(
      "trade_id",
      tradeIds.length > 0 ? tradeIds : ["00000000-0000-0000-0000-000000000000"],
    )
    .order("created_at", { ascending: true });

  const authorIds = [...new Set((rawComments ?? []).map((c) => c.author_id))];
  const { data: commentAuthors = [] } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .in(
      "id",
      authorIds.length > 0 ? authorIds : ["00000000-0000-0000-0000-000000000000"],
    );
  const authorMap = new Map(
    (commentAuthors ?? []).map((a) => [
      a.id,
      { display_name: a.display_name as string | null, email: a.email as string },
    ]),
  );

  const commentsByTrade = new Map<string, TradeComment[]>();
  for (const c of rawComments ?? []) {
    const list = commentsByTrade.get(c.trade_id) ?? [];
    list.push({
      id: c.id,
      body: c.body,
      created_at: c.created_at,
      author: authorMap.get(c.author_id) ?? null,
    });
    commentsByTrade.set(c.trade_id, list);
  }

  const displayName = profile?.display_name || profile?.email?.split("@")[0] || "Trader";

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        right={
          <div className="flex items-center gap-4">
            <Link href="/dashboard/calendar" className="btn-quiet">
              Calendar →
            </Link>
            <span className="eyebrow-muted hidden sm:inline">{profile?.email}</span>
            <form action={signOut}>
              <button className="btn-quiet">Sign out</button>
            </form>
          </div>
        }
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        <PageHeader
          eyebrow="The journal"
          title={
            <>
              Wait. Then write the <em className="text-gold">read.</em>
            </>
          }
          lede="Each entry is a thesis. Each thesis is graded against the framework. Patterns surface in the review."
        />

        <StreakBadge streak={streak} recentDays={recentDays} />
        <DailyCheckIn today={todayCheckin ?? null} />
        <StatsBar stats={stats} />
        <TradeForm userId={user.id} />

        <div className="mb-6">
          <div className="eyebrow mb-3">
            <span className="rule-gold mr-3" />
            The record
          </div>
          <h2 className="font-display text-2xl">Recent trades.</h2>
        </div>
        <TradeList
          trades={tradesWithUrls}
          extraPerTrade={(trade) => {
            const tradeComments = commentsByTrade.get(trade.id) ?? [];
            if (tradeComments.length === 0) return null;
            return (
              <CommentThread
                tradeId={trade.id}
                comments={tradeComments}
                canPost={false}
                returnTo="/dashboard"
              />
            );
          }}
        />
      </main>

      <Footer />
    </div>
  );
}

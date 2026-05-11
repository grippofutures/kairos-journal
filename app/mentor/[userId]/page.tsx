import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStats, type TradeRow } from "@/lib/stats";
import { computeRulesStreak } from "@/lib/streak";
import { computeRecentDays } from "@/lib/recent-days";
import { detectActiveTilt, detectBadHabits, type DetectTrade } from "@/lib/detect";
import { StatsBar } from "@/components/StatsBar";
import { TradeList } from "@/components/TradeList";
import { TiltAlerts } from "@/components/TiltAlerts";
import { HabitsList } from "@/components/HabitsList";
import { EquityCurve } from "@/components/EquityCurve";
import { StreakBadge } from "@/components/StreakBadge";
import { CheckInList } from "@/components/CheckInList";
import { CommentThread, type TradeComment } from "@/components/CommentThread";
import { ReviewControls } from "@/components/ReviewControls";
import { WeeklyOverview } from "@/components/WeeklyOverview";
import { RemoveStudentForm } from "@/components/RemoveStudentForm";
import { computeWeeklyStats } from "@/lib/weekly";
import { TopBar, PageHeader, Footer } from "@/components/Brand";
import { signOut } from "@/app/login/actions";

export const dynamic = "force-dynamic";

const TRADE_COLUMNS =
  "id, traded_at, instrument, direction, contracts, entry_price, exit_price, pnl, r_multiple, setup_tag, outcome, notes, emotion_tag, screenshot_path, thesis, candle_type, framework_score, criteria_profile, criteria_signature, criteria_trigger, criteria_targets, followed_model, reviewed_at, reviewed_by";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: viewer } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (viewer?.role !== "mentor") redirect("/dashboard");

  const { data: student } = await supabase
    .from("profiles")
    .select("id, email, display_name, role")
    .eq("id", userId)
    .single();

  if (!student) notFound();

  const { data: trades = [] } = await supabase
    .from("trades")
    .select(TRADE_COLUMNS)
    .eq("user_id", userId)
    .order("traded_at", { ascending: false });

  const tradeArr = trades ?? [];

  const stats = computeStats(
    tradeArr.map<TradeRow>((t) => ({
      id: t.id,
      traded_at: t.traded_at,
      outcome: t.outcome,
      pnl: Number(t.pnl),
      r_multiple: t.r_multiple == null ? null : Number(t.r_multiple),
      framework_score: Number(t.framework_score),
    }))
  );

  const detectArr: DetectTrade[] = tradeArr.map((t) => ({
    id: t.id,
    traded_at: t.traded_at,
    outcome: t.outcome,
    pnl: Number(t.pnl),
    contracts: t.contracts,
    direction: t.direction,
    setup_tag: t.setup_tag,
    emotion_tag: t.emotion_tag,
    framework_score: Number(t.framework_score),
    criteria_profile: t.criteria_profile,
    criteria_signature: t.criteria_signature,
    criteria_trigger: t.criteria_trigger,
    criteria_targets: t.criteria_targets,
  }));

  const flags = detectActiveTilt(detectArr);
  const habits = detectBadHabits(detectArr);
  const streak = computeRulesStreak(
    tradeArr.map((t) => ({
      traded_at: t.traded_at,
      followed_model: !!t.followed_model,
    })),
  );

  // Last 30 daily check-ins
  const { data: checkins = [] } = await supabase
    .from("daily_checkins")
    .select(
      "check_in_date, pre_market_mood, energy_level, sleep_hours, pre_market_note, post_market_mood, reflection, skipped_day",
    )
    .eq("user_id", userId)
    .order("check_in_date", { ascending: false })
    .limit(30);

  const recent = tradeArr.slice(0, 20);
  const recentWithUrls = await Promise.all(
    recent.map(async (t) => {
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

  // Fetch comments for these visible trades
  const recentIds = recent.map((t) => t.id);
  const { data: rawComments = [] } = await supabase
    .from("trade_comments")
    .select("id, trade_id, body, created_at, author_id")
    .in(
      "trade_id",
      recentIds.length > 0 ? recentIds : ["00000000-0000-0000-0000-000000000000"],
    )
    .order("created_at", { ascending: true });

  const authorIds = [...new Set((rawComments ?? []).map((c) => c.author_id))];
  const { data: authors = [] } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .in(
      "id",
      authorIds.length > 0 ? authorIds : ["00000000-0000-0000-0000-000000000000"],
    );
  const authorMap = new Map(
    (authors ?? []).map((a) => [
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

  const studentReturnTo = `/mentor/${userId}`;

  // Last 8 weeks of stats
  const weeklyStats = computeWeeklyStats(
    tradeArr.map((t) => ({
      traded_at: t.traded_at,
      pnl: Number(t.pnl),
      outcome: t.outcome,
      followed_model: !!t.followed_model,
      setup_tag: t.setup_tag,
    })),
    8,
  );

  const name = student.display_name || student.email.split("@")[0];

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        right={
          <div className="flex items-center gap-4">
            <Link href={`/mentor/${userId}/calendar`} className="btn-quiet">
              Calendar →
            </Link>
            <Link href="/mentor" className="btn-quiet">
              ← All students
            </Link>
            <form action={signOut}>
              <button className="btn-quiet">Sign out</button>
            </form>
          </div>
        }
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        <PageHeader
          eyebrow="The student"
          title={<em>{name}.</em>}
          lede={
            student.display_name ? (
              <span className="text-muted-soft">{student.email}</span>
            ) : null
          }
        />

        <StatsBar stats={stats} />
        <StreakBadge
          streak={streak}
          recentDays={computeRecentDays(
            tradeArr.map((t) => ({
              traded_at: t.traded_at,
              followed_model: !!t.followed_model,
            })),
            (checkins ?? []).map((c) => ({
              check_in_date: c.check_in_date,
              skipped_day: !!c.skipped_day,
            })),
            14,
          )}
        />

        <section className="mb-12">
          <EquityCurve
            trades={tradeArr.map((t) => ({ traded_at: t.traded_at, pnl: Number(t.pnl) }))}
          />
        </section>

        <section className="mb-12">
          <div className="eyebrow mb-3">
            <span className="rule-gold mr-3" />
            Weekly overview
          </div>
          <h2 className="font-display text-2xl mb-5">
            The last eight weeks.
          </h2>
          <WeeklyOverview weeks={weeklyStats} />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <section>
            <div className="eyebrow mb-3">
              <span className="rule-gold mr-3" />
              Active flags
            </div>
            <h2 className="font-display text-2xl mb-5">The window now.</h2>
            <TiltAlerts flags={flags} emptyText="The window is steady. No active flags." />
          </section>
          <section>
            <div className="eyebrow mb-3">
              <span className="rule-gold mr-3" />
              The patterns
            </div>
            <h2 className="font-display text-2xl mb-5">Recurring habits.</h2>
            <HabitsList habits={habits} />
          </section>
        </div>

        <section className="mb-12">
          <div className="eyebrow mb-3">
            <span className="rule-gold mr-3" />
            Daily check-ins
          </div>
          <h2 className="font-display text-2xl mb-5">
            The mind, day by day.
            <span className="text-muted-soft text-base ml-3 font-ui not-italic">
              last {(checkins ?? []).length}
            </span>
          </h2>
          <CheckInList checkins={checkins ?? []} />
        </section>

        <section>
          <div className="eyebrow mb-3">
            <span className="rule-gold mr-3" />
            The record
          </div>
          <h2 className="font-display text-2xl mb-5">
            Recent trades.
            <span className="text-muted-soft text-base ml-3 font-ui not-italic">
              {recent.length} of {tradeArr.length}
            </span>
          </h2>
          <TradeList
            trades={recentWithUrls}
            showDelete={false}
            extraPerTrade={(trade) => (
              <div className="mt-5 pt-4 border-t border-soft flex flex-col gap-3">
                <div className="flex justify-end">
                  <ReviewControls
                    tradeId={trade.id}
                    reviewedAt={trade.reviewed_at ?? null}
                    reviewerName={null}
                    returnTo={studentReturnTo}
                  />
                </div>
                <CommentThread
                  tradeId={trade.id}
                  comments={commentsByTrade.get(trade.id) ?? []}
                  canPost={true}
                  canDelete={true}
                  returnTo={studentReturnTo}
                />
              </div>
            )}
          />
        </section>

        {student.role === "student" && (
          <RemoveStudentForm
            studentId={student.id}
            studentEmail={student.email}
            studentName={name}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

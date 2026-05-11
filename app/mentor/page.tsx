import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStats, fmtMoney, fmtMoneySigned, fmtPct, type TradeRow } from "@/lib/stats";
import { computeRulesStreak, type StreakResult } from "@/lib/streak";
import { signOut } from "@/app/login/actions";
import { detectActiveTilt, type DetectTrade, type TiltFlag } from "@/lib/detect";
import { scoreColorClass } from "@/lib/framework";
import { TopBar, PageHeader, Footer } from "@/components/Brand";
import { Sparkline } from "@/components/Sparkline";
import { NumberCounter } from "@/components/NumberCounter";

export const dynamic = "force-dynamic";

const TRADE_COLUMNS =
  "id, user_id, traded_at, instrument, direction, contracts, entry_price, exit_price, pnl, r_multiple, setup_tag, outcome, notes, emotion_tag, screenshot_path, thesis, candle_type, framework_score, criteria_profile, criteria_signature, criteria_trigger, criteria_targets, followed_model";

export default async function MentorPage() {
  try {
    return await renderMentorPage();
  } catch (err) {
    // Surface the actual error to the rendered page so we can debug in prod
    // (Next.js obfuscates server errors normally — this bypasses that).
    const e = err as Error;
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-3xl w-full">
          <h1 className="font-display text-3xl text-bone mb-6">
            /mentor failed to render.
          </h1>
          <div className="card p-6 space-y-4">
            <div>
              <div className="eyebrow-muted mb-2">Error message</div>
              <pre className="text-sm text-bone whitespace-pre-wrap bg-canvas p-3 border border-soft overflow-auto max-h-60">
                {e.message || "(no message)"}
              </pre>
            </div>
            {e.stack && (
              <div>
                <div className="eyebrow-muted mb-2">Stack</div>
                <pre className="text-[11px] text-bone-dim whitespace-pre-wrap bg-canvas p-3 border border-soft overflow-auto max-h-96">
                  {e.stack}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

async function renderMentorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "mentor") redirect("/dashboard");

  const { data: students = [], error: studentsErr } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .eq("role", "student")
    .order("email");
  if (studentsErr) throw new Error(`students query: ${studentsErr.message}`);

  const { data: allTrades = [], error: tradesErr } = await supabase
    .from("trades")
    .select(TRADE_COLUMNS)
    .order("traded_at", { ascending: false });
  if (tradesErr) throw new Error(`trades query: ${tradesErr.message}`);

  // Count of unreviewed trades for the review-queue badge
  const { count: unreviewedCount, error: unreviewedErr } = await supabase
    .from("trades")
    .select("id", { count: "exact", head: true })
    .is("reviewed_at", null);
  if (unreviewedErr) throw new Error(`unreviewedCount query: ${unreviewedErr.message}`);

  const tradesByUser = new Map<string, typeof allTrades>();
  for (const t of allTrades ?? []) {
    if (!tradesByUser.has(t.user_id)) tradesByUser.set(t.user_id, []);
    tradesByUser.get(t.user_id)!.push(t);
  }

  type Row = {
    student: { id: string; email: string; display_name: string | null };
    stats: ReturnType<typeof computeStats>;
    flags: TiltFlag[];
    lastTrade: NonNullable<typeof allTrades>[number] | undefined;
    streak: StreakResult;
    sparkValues: number[];
  };

  const rows: Row[] = (students ?? []).map((s) => {
    const userTrades = tradesByUser.get(s.id) ?? [];
    const stats = computeStats(
      userTrades.map<TradeRow>((t) => ({
        id: t.id,
        traded_at: t.traded_at,
        outcome: t.outcome,
        pnl: Number(t.pnl),
        r_multiple: t.r_multiple == null ? null : Number(t.r_multiple),
        framework_score: Number(t.framework_score),
      }))
    );
    const flags = detectActiveTilt(
      userTrades.map<DetectTrade>((t) => ({
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
      }))
    );
    const streak = computeRulesStreak(
      userTrades.map((t) => ({
        traded_at: t.traded_at,
        followed_model: !!t.followed_model,
      })),
    );
    // Sparkline: cumulative P&L over last 20 trades (chronological)
    const sparkSource = userTrades.slice(0, 20).slice().reverse();
    const sparkValues = sparkSource.reduce<number[]>((acc, t) => {
      const last = acc.length === 0 ? 0 : acc[acc.length - 1];
      acc.push(last + Number(t.pnl));
      return acc;
    }, []);
    return {
      student: s,
      stats,
      flags,
      lastTrade: userTrades[0],
      streak,
      sparkValues,
    };
  });

  const severityWeight = (f: TiltFlag[]) => {
    if (f.some((x) => x.severity === "critical")) return 3;
    if (f.some((x) => x.severity === "warning")) return 2;
    if (f.some((x) => x.severity === "info")) return 1;
    return 0;
  };
  rows.sort((a, b) => {
    const sw = severityWeight(b.flags) - severityWeight(a.flags);
    if (sw !== 0) return sw;
    return b.stats.currentLossStreak - a.stats.currentLossStreak;
  });

  const cohortPnl = rows.reduce((s, r) => s + r.stats.totalPnl, 0);
  const cohortWins = rows.reduce((s, r) => s + r.stats.wins, 0);
  const cohortTotal = rows.reduce((s, r) => s + r.stats.total, 0);
  const cohortWinRate = cohortTotal === 0 ? 0 : cohortWins / cohortTotal;

  type Alert = { student: Row["student"]; flag: TiltFlag };
  const alertDigest: Alert[] = [];
  for (const r of rows) {
    for (const f of r.flags) {
      if (f.severity === "info") continue;
      alertDigest.push({ student: r.student, flag: f });
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        right={
          <div className="flex items-center gap-4">
            <Link href="/mentor/attention" className="btn-quiet">
              Attention
            </Link>
            <Link href="/mentor/queue" className="btn-quiet">
              Review queue{(unreviewedCount ?? 0) > 0 ? ` · ${unreviewedCount}` : ""}
            </Link>
            <span className="eyebrow-muted hidden sm:inline">Mentor</span>
            <form action={signOut}>
              <button className="btn-quiet">Sign out</button>
            </form>
          </div>
        }
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
        <PageHeader
          eyebrow="The cohort"
          title={
            <>
              The room, <em className="text-gold">at a glance.</em>
            </>
          }
          lede="Diagnose first. Prescribe second. Critical flags surface above warnings; warnings above quiet."
        />

        {/* Cohort numbers */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-px bg-soft border border-soft mb-12">
          <BigStat
            label="Cohort net"
            value={fmtMoneySigned(cohortPnl)}
            numericValue={cohortPnl}
            format="money-signed"
          />
          <BigStat
            label="Trades logged"
            value={String(cohortTotal)}
            numericValue={cohortTotal}
            format="integer"
          />
          <BigStat
            label="Cohort win rate"
            value={fmtPct(cohortWinRate)}
            numericValue={cohortWinRate}
            format="percent"
          />
          <BigStat
            label="Active alerts"
            value={String(alertDigest.length)}
            numericValue={alertDigest.length}
            format="integer"
            emphasis={alertDigest.length > 0}
          />
          <BigStat
            label="Unreviewed"
            value={String(unreviewedCount ?? 0)}
            numericValue={unreviewedCount ?? 0}
            format="integer"
            emphasis={(unreviewedCount ?? 0) > 0}
          />
        </section>

        {/* Alerts */}
        {alertDigest.length > 0 && (
          <section className="mb-12">
            <div className="eyebrow mb-3">
              <span className="rule-gold mr-3" />
              Alerts
            </div>
            <h2 className="font-display text-2xl mb-5">
              Requiring attention.
            </h2>
            <div className="space-y-2">
              {alertDigest.map((a, i) => {
                const accent =
                  a.flag.severity === "critical"
                    ? "border-l-4 border-gold"
                    : "border-l-2 border-gold/60";
                return (
                  <Link
                    key={i}
                    href={`/mentor/${a.student.id}`}
                    className={`block bg-surface ${accent} hover:bg-surface-2 transition-colors px-5 py-4`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-lg text-bone">
                          {a.student.display_name || a.student.email}
                        </div>
                        <div className="font-display italic text-bone-dim mt-1">
                          {a.flag.message}
                        </div>
                        {a.flag.detail && (
                          <div className="text-sm text-muted-soft mt-1.5 leading-relaxed">
                            {a.flag.detail}
                          </div>
                        )}
                      </div>
                      <span className="eyebrow-muted whitespace-nowrap mt-1">View →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Students table */}
        <section>
          <div className="eyebrow mb-3">
            <span className="rule-gold mr-3" />
            Students
          </div>
          <h2 className="font-display text-2xl mb-5">All twenty.</h2>
          <div className="overflow-x-auto card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-soft">
                  <Th>Student</Th>
                  <Th>Trend</Th>
                  <Th>Trades</Th>
                  <Th>Win rate</Th>
                  <Th>Avg R</Th>
                  <Th>Framework</Th>
                  <Th>Net</Th>
                  <Th>Rules</Th>
                  <Th>Loss</Th>
                  <Th>Flags</Th>
                  <Th>Last</Th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-bone-dim font-display italic">
                      No students yet.
                    </td>
                  </tr>
                )}
                {rows.map(({ student, stats, flags, lastTrade, streak, sparkValues }) => {
                  const streakIsAlert = stats.currentLossStreak >= 3;
                  const rulesBrokenToday = streak.todayStatus === "broken";
                  const rulesHot = streak.current >= 5;
                  const fwIsTextbook = stats.avgFramework >= 9;
                  const fwClass =
                    stats.avgFramework > 0 ? scoreColorClass(stats.avgFramework) : "text-bone-dim";
                  const flagCount = flags.length;
                  const flagAccent = flags.some((f) => f.severity === "critical")
                    ? "border-gold text-gold"
                    : flags.some((f) => f.severity === "warning")
                      ? "border-gold/60 text-bone"
                      : "border-soft text-muted";
                  return (
                    <tr
                      key={student.id}
                      className="border-b border-soft last:border-0 hover:bg-surface-2 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <Link
                          href={`/mentor/${student.id}`}
                          className="font-display text-base text-bone hover:text-gold transition-colors"
                        >
                          {student.display_name || student.email}
                        </Link>
                        {student.display_name && (
                          <div className="text-xs text-muted-soft mt-0.5">{student.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Sparkline values={sparkValues} width={84} height={24} />
                      </td>
                      <Td>{stats.total}</Td>
                      <Td>{fmtPct(stats.winRate)}</Td>
                      <Td>{stats.avgR.toFixed(2)}</Td>
                      <td className={`px-4 py-4 num font-display ${fwClass} ${fwIsTextbook ? "italic" : ""}`}>
                        {stats.avgFramework > 0 ? stats.avgFramework.toFixed(1) : "—"}
                      </td>
                      <td className="px-4 py-4 num font-display text-bone">
                        {fmtMoneySigned(stats.totalPnl)}
                      </td>
                      <td
                        className={`px-4 py-4 num font-display ${
                          rulesBrokenToday
                            ? "italic text-muted-soft"
                            : rulesHot
                              ? "italic text-gold"
                              : "text-bone"
                        }`}
                        title={`Today: ${streak.todayStatus} · Longest: ${streak.longest}`}
                      >
                        {streak.current}
                      </td>
                      <td className={`px-4 py-4 num font-display ${streakIsAlert ? "italic text-gold" : "text-bone"}`}>
                        {stats.currentLossStreak}
                      </td>
                      <td className="px-4 py-4">
                        {flagCount > 0 ? (
                          <span className={`text-[11px] tracking-eyebrow uppercase border px-2 py-0.5 ${flagAccent}`}>
                            {flagCount}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-bone-dim text-xs">
                        {lastTrade ? new Date(lastTrade.traded_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-soft mt-3 font-display italic">
            Click a student. The equity curve, the active flags, and the patterns are all on the next page.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left eyebrow-muted">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4 num font-display text-bone">{children}</td>;
}

function BigStat({
  label,
  value,
  numericValue,
  format,
  emphasis = false,
}: {
  label: string;
  value: string;
  numericValue?: number;
  format?: "integer" | "signed-integer" | "money-signed" | "percent";
  emphasis?: boolean;
}) {
  return (
    <div className="bg-canvas px-5 py-6">
      <div className="eyebrow-muted">{label}</div>
      <div className={`mt-2 font-display num text-3xl leading-none ${emphasis ? "italic text-gold" : "text-bone"}`}>
        {numericValue !== undefined && format ? (
          <NumberCounter value={numericValue} format={format} />
        ) : (
          value
        )}
      </div>
    </div>
  );
}

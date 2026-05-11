import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  computeStats,
  fmtMoneySigned,
  fmtPct,
  type TradeRow,
} from "@/lib/stats";
import { computeRulesStreak } from "@/lib/streak";
import { weekdaysSinceLastTrade, isWeekend } from "@/lib/business-days";
import { TopBar, PageHeader, Footer } from "@/components/Brand";
import { NumberCounter } from "@/components/NumberCounter";
import { EmptyState } from "@/components/EmptyState";
import { signOut } from "@/app/login/actions";

export const dynamic = "force-dynamic";

const TRADE_COLUMNS =
  "id, user_id, traded_at, pnl, outcome, followed_model, criteria_profile, criteria_signature, criteria_trigger, criteria_targets";

type Severity = "critical" | "warning" | "positive";

type Flag = {
  severity: Severity;
  label: string;
  detail?: string;
};

type Row = {
  student: { id: string; email: string; display_name: string | null };
  flags: Flag[];
  topSeverity: Severity | null;
};

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 3,
  warning: 2,
  positive: 1,
};

export default async function AttentionPage() {
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

  const today = new Date().toISOString().slice(0, 10);
  const isWeekendToday = isWeekend(new Date());

  // All students
  const { data: students = [] } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .eq("role", "student")
    .order("email");

  // All trades (recent first; we filter per-student in memory)
  const { data: allTrades = [] } = await supabase
    .from("trades")
    .select(TRADE_COLUMNS)
    .order("traded_at", { ascending: false });

  // Today's check-ins
  const { data: todayCheckins = [] } = await supabase
    .from("daily_checkins")
    .select("user_id, pre_market_mood, post_market_mood, skipped_day")
    .eq("check_in_date", today);

  const tradesByUser = new Map<string, typeof allTrades>();
  for (const t of allTrades ?? []) {
    if (!tradesByUser.has(t.user_id)) tradesByUser.set(t.user_id, []);
    tradesByUser.get(t.user_id)!.push(t);
  }
  const checkinByUser = new Map(
    (todayCheckins ?? []).map((c) => [c.user_id, c]),
  );

  const rows: Row[] = (students ?? []).map((s) => {
    const userTrades = tradesByUser.get(s.id) ?? [];
    const stats = computeStats(
      userTrades.map<TradeRow>((t) => ({
        id: t.id,
        traded_at: t.traded_at,
        outcome: t.outcome,
        pnl: Number(t.pnl),
        r_multiple: null,
        framework_score: 0,
      })),
    );
    const streak = computeRulesStreak(
      userTrades.map((t) => ({
        traded_at: t.traded_at,
        followed_model: !!t.followed_model,
      })),
    );
    const weekdaysSince = weekdaysSinceLastTrade(
      userTrades.map((t) => t.traded_at),
    );
    const checkin = checkinByUser.get(s.id);

    const flags: Flag[] = [];

    // Rules broken today (only if traded today and any was broken)
    const todaysTrades = userTrades.filter(
      (t) => t.traded_at.slice(0, 10) === today,
    );
    if (todaysTrades.length > 0 && streak.todayStatus === "broken") {
      const brokenCount = todaysTrades.filter((t) => !t.followed_model).length;
      flags.push({
        severity: "critical",
        label: "Broke rules today",
        detail: `${brokenCount} of ${todaysTrades.length} trade${todaysTrades.length === 1 ? "" : "s"} did not follow the model`,
      });
    }

    // Long losing streak
    if (stats.currentLossStreak >= 4) {
      flags.push({
        severity: "critical",
        label: `${stats.currentLossStreak}-trade losing streak`,
      });
    } else if (stats.currentLossStreak === 3) {
      flags.push({
        severity: "warning",
        label: "3-trade losing streak",
      });
    }

    // Absent from journaling
    if (weekdaysSince !== null && weekdaysSince >= 7) {
      flags.push({
        severity: "critical",
        label: `No trade in ${weekdaysSince} weekdays`,
      });
    } else if (weekdaysSince !== null && weekdaysSince >= 4) {
      flags.push({
        severity: "warning",
        label: `No trade in ${weekdaysSince} weekdays`,
      });
    }

    // Missing check-in today (only on weekdays, and only if not skipped)
    if (!isWeekendToday && (!checkin || (!checkin.pre_market_mood && !checkin.post_market_mood && !checkin.skipped_day))) {
      flags.push({
        severity: "warning",
        label: "No check-in today",
      });
    }

    // Positive — flag rules-streaks worth praising
    if (streak.current >= 10) {
      flags.push({
        severity: "positive",
        label: `${streak.current}-day rules streak`,
      });
    } else if (streak.current >= 5) {
      flags.push({
        severity: "positive",
        label: `${streak.current}-day rules streak`,
      });
    }

    const topSeverity = flags.length
      ? flags.reduce<Severity>((acc, f) => {
          return SEVERITY_RANK[f.severity] > SEVERITY_RANK[acc] ? f.severity : acc;
        }, "positive")
      : null;

    return { student: s, flags, topSeverity };
  });

  const criticalRows = rows
    .filter((r) => r.flags.some((f) => f.severity === "critical"))
    .sort((a, b) => b.flags.length - a.flags.length);
  const warningRows = rows.filter(
    (r) =>
      !r.flags.some((f) => f.severity === "critical") &&
      r.flags.some((f) => f.severity === "warning"),
  );
  const positiveRows = rows
    .filter(
      (r) =>
        !r.flags.some((f) => f.severity === "critical" || f.severity === "warning") &&
        r.flags.some((f) => f.severity === "positive"),
    )
    .sort((a, b) => {
      // sort by the streak number embedded in the label (parse the leading number)
      const an = parseInt(a.flags[0]?.label.match(/^(\d+)/)?.[1] ?? "0", 10);
      const bn = parseInt(b.flags[0]?.label.match(/^(\d+)/)?.[1] ?? "0", 10);
      return bn - an;
    });
  const okCount = rows.length - criticalRows.length - warningRows.length - positiveRows.length;

  // Cohort this-week stats
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentTrades = (allTrades ?? []).filter(
    (t) => new Date(t.traded_at) >= oneWeekAgo,
  );
  const weekPnl = recentTrades.reduce((s, t) => s + Number(t.pnl), 0);
  const weekWins = recentTrades.filter((t) => t.outcome === "win").length;
  const weekDecided = recentTrades.filter(
    (t) => t.outcome === "win" || t.outcome === "loss",
  ).length;
  const weekWinRate = weekDecided === 0 ? 0 : weekWins / weekDecided;
  const weekBroken = recentTrades.filter((t) => !t.followed_model).length;

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        right={
          <div className="flex items-center gap-4">
            <Link href="/mentor/queue" className="btn-quiet">
              Review queue
            </Link>
            <Link href="/mentor" className="btn-quiet">
              ← Cohort
            </Link>
            <form action={signOut}>
              <button className="btn-quiet">Sign out</button>
            </form>
          </div>
        }
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        <PageHeader
          eyebrow="The attention board"
          title={
            <>
              Who <em className="text-gold">needs you</em> today.
            </>
          }
          lede="Critical first. Warnings next. The rest is steady — leave them be."
        />

        {/* This-week cohort snapshot */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-soft border border-soft mb-10">
          <BigStat
            label="Cohort net · 7d"
            value={fmtMoneySigned(weekPnl)}
            numericValue={weekPnl}
            format="money-signed"
          />
          <BigStat
            label="Trades · 7d"
            value={String(recentTrades.length)}
            numericValue={recentTrades.length}
            format="integer"
          />
          <BigStat
            label="Win rate · 7d"
            value={fmtPct(weekWinRate)}
            numericValue={weekWinRate}
            format="percent"
          />
          <BigStat
            label="Rules broken · 7d"
            value={String(weekBroken)}
            numericValue={weekBroken}
            format="integer"
            emphasis={weekBroken > 0}
          />
        </section>

        {/* Critical */}
        <Bucket
          title="Critical"
          subtitle="Broken rules, deep losing streaks, or absent students."
          rows={criticalRows}
          emptyText="No one is in critical territory. Calm waters."
          accent="border-l-4 border-gold"
        />

        {/* Warning */}
        <Bucket
          title="Warning"
          subtitle="Slipping. Worth a quick note before it escalates."
          rows={warningRows}
          emptyText="No warnings active."
          accent="border-l-2 border-gold/60"
        />

        {/* Positive */}
        <Bucket
          title="On a roll"
          subtitle="Long rules streaks. A quick note of recognition compounds."
          rows={positiveRows}
          emptyText="No one is on a 5+ streak yet."
          accent="border-l border-gold/40"
          isPositive
        />

        <p className="text-xs text-muted-soft mt-8 font-display italic text-center">
          {okCount} other student{okCount === 1 ? "" : "s"} steady — no flags today.
        </p>
      </main>

      <Footer />
    </div>
  );
}

function Bucket({
  title,
  subtitle,
  rows,
  emptyText,
  accent,
  isPositive = false,
}: {
  title: string;
  subtitle: string;
  rows: Row[];
  emptyText: string;
  accent: string;
  isPositive?: boolean;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="eyebrow">
            <span className="rule-gold mr-3" />
            {title}
          </div>
          <h2 className="font-display text-2xl mt-2">
            {rows.length === 0
              ? title === "Critical"
                ? "Clear."
                : title === "Warning"
                  ? "Quiet."
                  : "Steady."
              : `${rows.length} student${rows.length === 1 ? "" : "s"}.`}
          </h2>
          <p className="text-sm text-muted-soft mt-1">{subtitle}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-bone-dim font-display italic py-4 text-center">
          {emptyText}
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Link
              key={r.student.id}
              href={`/mentor/${r.student.id}`}
              className={`block bg-surface ${accent} hover:bg-surface-2 transition-colors px-5 py-4`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-display text-lg text-bone">
                    {r.student.display_name || r.student.email}
                  </div>
                  <ul className="mt-2 space-y-1">
                    {r.flags.map((f, i) => (
                      <li
                        key={i}
                        className={`text-sm font-display italic leading-relaxed ${
                          f.severity === "critical"
                            ? "text-gold"
                            : f.severity === "warning"
                              ? "text-bone-dim"
                              : "text-bone"
                        }`}
                      >
                        — {f.label}
                        {f.detail && (
                          <span className="text-muted-soft text-xs not-italic font-ui">
                            {" · "}
                            {f.detail}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="eyebrow-muted whitespace-nowrap mt-1">
                  {isPositive ? "Praise →" : "Review →"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
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
      <div
        className={`mt-2 font-display num text-3xl leading-none ${
          emphasis ? "italic text-gold" : "text-bone"
        }`}
      >
        {numericValue !== undefined && format ? (
          <NumberCounter value={numericValue} format={format} />
        ) : (
          value
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  parseMonthParam,
  getMonthGridRange,
  aggregateByDay,
} from "@/lib/calendar";
import { CalendarMonth } from "@/components/CalendarMonth";
import { DayDetail } from "@/components/DayDetail";
import { TopBar, PageHeader, Footer } from "@/components/Brand";
import { signOut } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function MentorCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const { userId } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: viewer } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (viewer?.role !== "mentor") redirect("/dashboard");

  const { data: student } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .eq("id", userId)
    .single();
  if (!student) notFound();

  const { year, month0 } = parseMonthParam(sp.month);
  const { start, endExclusive } = getMonthGridRange(year, month0);

  const { data: trades = [] } = await supabase
    .from("trades")
    .select(
      "id, traded_at, instrument, direction, contracts, pnl, outcome, thesis, setup_tag, followed_model",
    )
    .eq("user_id", userId)
    .gte("traded_at", `${start}T00:00:00Z`)
    .lt("traded_at", `${endExclusive}T00:00:00Z`)
    .order("traded_at", { ascending: true });

  const { data: checkins = [] } = await supabase
    .from("daily_checkins")
    .select(
      "check_in_date, pre_market_mood, energy_level, sleep_hours, pre_market_note, post_market_mood, reflection, skipped_day",
    )
    .eq("user_id", userId)
    .gte("check_in_date", start)
    .lt("check_in_date", endExclusive);

  const summaries = aggregateByDay(
    (trades ?? []).map((t) => ({
      traded_at: t.traded_at,
      pnl: Number(t.pnl),
      followed_model: !!t.followed_model,
    })),
    (checkins ?? []).map((c) => ({
      check_in_date: c.check_in_date,
      pre_market_mood: c.pre_market_mood,
      post_market_mood: c.post_market_mood,
      skipped_day: !!c.skipped_day,
    })),
  );

  const selectedDay = sp.day;
  const selectedTrades = selectedDay
    ? (trades ?? [])
        .filter((t) => t.traded_at.slice(0, 10) === selectedDay)
        .map((t) => ({
          id: t.id,
          traded_at: t.traded_at,
          instrument: t.instrument,
          direction: t.direction,
          contracts: t.contracts,
          pnl: Number(t.pnl),
          outcome: t.outcome,
          thesis: t.thesis,
          followed_model: !!t.followed_model,
          setup_tag: t.setup_tag,
        }))
    : [];
  const selectedCheckin = selectedDay
    ? (checkins ?? []).find((c) => c.check_in_date === selectedDay) ?? null
    : null;

  const name = student.display_name || student.email.split("@")[0];
  const basePath = `/mentor/${userId}/calendar`;

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        right={
          <div className="flex items-center gap-4">
            <Link href={`/mentor/${userId}`} className="btn-quiet">
              ← {name}
            </Link>
            <Link href="/mentor" className="btn-quiet">
              All students
            </Link>
            <form action={signOut}>
              <button className="btn-quiet">Sign out</button>
            </form>
          </div>
        }
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        <PageHeader
          eyebrow={`Calendar — ${name}`}
          title={
            <>
              One month, <em className="text-gold">at a glance.</em>
            </>
          }
          lede="Click any day to see the trades and the check-in."
        />

        <CalendarMonth
          year={year}
          month0={month0}
          summaries={summaries}
          basePath={basePath}
          selectedDay={selectedDay}
        />

        {selectedDay && (
          <DayDetail
            date={selectedDay}
            trades={selectedTrades}
            checkin={selectedCheckin}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

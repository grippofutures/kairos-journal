# Phase 3 Setup — Form Simplification + Calendar

One step. Takes 60 seconds.

## Step 1 — Run the migration

The form changes need a small schema update.

1. Supabase dashboard → **SQL Editor** → **+ New query**
2. Open `trade-journal/supabase/migration_004_simplify_trade_form.sql` in Notepad
3. Copy contents → paste into Supabase SQL Editor
4. Click **Run**
5. Wait for green **Success. No rows returned**

What this migration does:
- Adds `followed_model` boolean to `trades` (the new single source of truth for the streak)
- Backfills `followed_model = true` for any existing trades where all 4 old criteria booleans were true
- Makes `entry_price` and `exit_price` **nullable** so the new form can omit them

That's it. No other setup. Refresh your dashboard.

---

## What changed

### Trade form — simplified
- ❌ Removed: candle type, the 4 pillar checkboxes, framework score 1–10
- ❌ Removed: Entry price, Exit price
- ✅ Added: single **"I followed the model on this trade"** checkbox (drives the streak)
- ✅ Added: **paste-screenshot** support — press `Ctrl/⌘ + V` anywhere on the dashboard to paste a TradingView screenshot (or use the file input as before)
- ✅ Added: chart preview thumbnail with **Clear chart** button

The form is now **3 sections** instead of 5: The trade · The thesis · The context · The chart.

### Streak — same behavior, simpler input
- "Rules followed today" still means: every trade today had `followed_model = true`
- Streak counter on dashboard + mentor cohort table both still work
- The 4 old criteria booleans are still written (mirrored from `followed_model`) so legacy analytics don't break

### Calendar — new
Two new pages:
- **`/dashboard/calendar`** — student's own calendar. Click a day to see trades + check-in.
- **`/mentor/[userId]/calendar`** — mentor's view of any student's calendar. Same layout.

How to navigate to it:
- Dashboard → top-right has a **Calendar →** link
- Mentor's per-student page → top-right has a **Calendar →** link

What the calendar shows:
- Month grid (Sun–Sat). Prev/next month buttons.
- Each day cell: P&L for the day, trade count, gold dot if rules followed, muted dot if broken, ✎ if check-in logged
- Today is highlighted in italic gold
- Click a day → detail panel below shows: day stats (trades, net, wins, rules), the daily check-in (pre + post), and every trade that day (instrument, P&L, thesis, followed/broken badge)

URL pattern:
- `?month=2026-05` — pick a month
- `?day=2026-05-08` — select a specific day for the detail panel
- Both work standalone or together

---

## Files changed in this batch

**New:**
- `supabase/migration_004_simplify_trade_form.sql`
- `lib/calendar.ts`
- `components/CalendarMonth.tsx`
- `components/DayDetail.tsx`
- `app/dashboard/calendar/page.tsx`
- `app/mentor/[userId]/calendar/page.tsx`

**Modified:**
- `lib/streak.ts` — uses `followed_model` instead of 4 criteria
- `app/dashboard/actions.ts` — drops entry/exit, uses `followed_model`
- `components/TradeForm.tsx` — major refactor (paste support, simplified sections)
- `app/dashboard/page.tsx` — calendar nav link, updated streak input
- `app/mentor/page.tsx` — updated streak input
- `app/mentor/[userId]/page.tsx` — calendar nav link, updated streak input

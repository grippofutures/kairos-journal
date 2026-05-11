# Phase 5 Setup — Skip Day, Weekends, Attention, Weekly Overview

One migration, then refresh.

## Step 1 — Run the migration

1. Supabase dashboard → **SQL Editor** → **+ New query**
2. Open `trade-journal/supabase/migration_006_skip_day.sql` in Notepad
3. Copy → paste → **Run** → wait for green ✓

That adds a single `skipped_day` boolean to `daily_checkins`. Defaults to `false` so existing rows are unaffected.

## Step 2 — Refresh

Dev server already restarted (I edited next.config.js to add the display-capture header). Just refresh your browser.

---

## What's new

### `/dashboard` — student view
- **Weekend awareness.** On Saturday/Sunday, the check-in section shows: *"Markets closed. Rest the read."* — no forms, streak holds.
- **Skip Today button** — top-right of the Daily check-in section. Click it → today is logged as a skip day. Streak doesn't break. Replaces the forms with: *"Sitting today out. The discipline."* + an **Undo skip** button.
- Skip days don't break your streak; they're tracked as an explicit discipline action.

### `/dashboard/calendar` + `/mentor/[userId]/calendar`
- New legend item: **◇ Skipped — sat out** (gold diamond on day cells)
- Skip days are visually distinct from check-in-only days

### `/mentor` — cohort page
- New **Attention** link in top-right (next to Review queue)

### `/mentor/attention` — NEW page
A triage dashboard for you and Sam. Three buckets:

| Bucket | Surfaces | When |
|---|---|---|
| **Critical** | Broke rules today · 4+ trade losing streak · No trade in 7+ weekdays | Demand action |
| **Warning** | 3-trade losing streak · No check-in today · No trade in 4–6 weekdays | Slipping |
| **On a roll** | 5+ day rules streak | Praise opportunity |

Cohort 7-day stats at the top: Net · Trades · Win rate · Rules broken.

Clicking any student row → goes to their detail page. Critical/Warning say "Review →", positive says "Praise →".

Skipped days don't count as "absent" — explicit skips are recognized as discipline. "No check-in today" only fires on weekdays (Saturday/Sunday don't trigger).

### `/mentor/[userId]` — student detail page
New **Weekly overview** section between Equity Curve and Active flags. Last 8 weeks in a table:

| Column | What it shows |
|---|---|
| Week | "May 5 – May 11" (Monday–Sunday) |
| Trades | Count of trades that week |
| Net | P&L for the week |
| Win rate | Wins / decided |
| Rules · followed | Distinct days where every trade followed the model |
| Rules · broken | Days where at least one trade broke the model |
| Top setup | Most-used `setup_tag` and its frequency |

Empty weeks (no trades) show "—" — the row stays visible so absence is obvious.

### Screen-recording protection (the honest deterrents)
- `Permissions-Policy: display-capture=()` header added in `next.config.js` — blocks the page from initiating screen capture via `getDisplayMedia()`. Does **not** block OS recorders.
- 🚨 **This is not real protection.** When you upload course videos, use Cloudflare Stream / Mux / Vimeo Pro with watermarking. Ping me when you're ready to build the Videos section and I'll wire one of those up.

---

## Files in this batch

**New:**
- `supabase/migration_006_skip_day.sql`
- `lib/business-days.ts` — weekday/weekend utilities
- `lib/weekly.ts` — weekly stats aggregation
- `app/dashboard/skip-actions.ts` — toggle skip day server action
- `app/mentor/attention/page.tsx` — the attention dashboard
- `components/WeeklyOverview.tsx` — 8-week stats table

**Modified:**
- `components/DailyCheckIn.tsx` — skip button, weekend awareness, skipped-state display
- `components/CheckInList.tsx` — show skipped days as "Skipped — sat out"
- `components/CalendarMonth.tsx` — ◇ icon + legend for skipped days
- `lib/calendar.ts` — surface `skippedDay` in DaySummary
- `app/dashboard/page.tsx` — fetch `skipped_day`
- `app/dashboard/calendar/page.tsx` — fetch + pass `skipped_day`
- `app/mentor/page.tsx` — Attention link in top bar
- `app/mentor/[userId]/page.tsx` — WeeklyOverview section, fetch `skipped_day`
- `app/mentor/[userId]/calendar/page.tsx` — fetch + pass `skipped_day`
- `next.config.js` — display-capture Permissions-Policy header

---

## Test pass (5 min)

### Skip day
1. As a student (or flip your role temporarily), visit `/dashboard`
2. Top-right of "Daily check-in" → click **Skip today**
3. Section flips to *"Sitting today out."* with Undo button
4. Streak strip — current count unchanged
5. Visit `/dashboard/calendar` — today's cell should show ◇ icon

### Weekend
1. Set your machine clock to a Saturday (or just trust me on this one)
2. Visit `/dashboard` — check-in section says *"Markets closed. Rest the read."*

### Attention dashboard
1. As mentor, visit `/mentor` → click **Attention** top-right
2. You should see: cohort 7-day stats, then Critical/Warning/On-a-roll buckets
3. If you have a test student with a broken-rules trade today → they appear in Critical
4. Click their row → lands on `/mentor/{student-id}`

### Weekly overview
1. On any `/mentor/{student-id}` page
2. Scroll past the equity curve → "Weekly overview" section appears
3. Table shows last 8 weeks. The current week is labeled italic gold "This week"
4. If a student has setup tags on their trades → "Top setup" column shows the most-frequent one

---

## When done

Reply **"Phase 5 works"** and I'll line up Phase 6 — your call: deploy to Vercel, pre-trade checklist, CSV export, or Discord webhook for milestones.

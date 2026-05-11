# Phase 2 Test Plan — Streak + Daily Check-in

Run these in order. Should take 5 minutes total.

## Preconditions

- [ ] Phase 1 testing passed (you can sign in)
- [ ] `migration_003_daily_checkin_streak.sql` ran without errors
- [ ] `npm run dev` is up
- [ ] You're signed in as `OWNER` (mentor)

---

## Tests

### 1. Mentor dashboard layout

- [ ] Visit `/mentor`
- [ ] Cohort table shows **10 columns**: Student, Trades, Win rate, Avg R, Framework, Net, **Rules**, Loss, Flags, Last
- [ ] No layout breaks, table scrolls horizontally on narrow screens

### 2. Student dashboard renders new sections

- [ ] Sign in as a student account (or temporarily change your `profiles.role` to `'student'` in Supabase Table Editor)
- [ ] Visit `/dashboard`
- [ ] Top of page now shows in this order:
  1. Streak strip (3 columns: Rules followed — current / Longest / Days journaled)
  2. Daily check-in section (2 cards: Pre-market / Post-market)
  3. Existing StatsBar
  4. Existing trade form
  5. Recent trades list
- [ ] If you have no trades yet: streak shows 0 / 0 / 0 with "No trades today." caption

### 3. Pre-market check-in saves

- [ ] On `/dashboard`, in the Pre-market form:
  - Mood: select **Calm**
  - Energy 1–5: enter **4**
  - Sleep hrs: enter **7.5**
  - Pre-market note: type "Watching NQ. Want a 6 AM reversal."
- [ ] Click **Save pre-market**
- [ ] Page refreshes, button now reads **Update pre-market**, "Saved" badge appears in the card header
- [ ] Refresh the page — values are still there (persisted)

### 4. Post-market check-in saves

- [ ] In the Post-market form:
  - Mood at close: select **Confident**
  - Reflection: type "Took the 6 AM. Let runners go to target. Followed the model."
- [ ] Click **Save post-market**
- [ ] "Saved" badge appears, button changes to **Update post-market**

### 5. Streak counter — followed day

- [ ] Submit a trade where ALL four criteria checkboxes are checked (`profile`, `signature`, `trigger`, `targets`)
- [ ] Page refreshes, streak strip updates:
  - Rules followed — current: **1**
  - Caption: "Today extended it."
- [ ] Longest streak: **1**
- [ ] Days journaled: **1**

### 6. Streak counter — broken day

- [ ] Submit a second trade today where at least one criteria checkbox is **unchecked**
- [ ] Page refreshes, streak strip updates:
  - Rules followed — current: **0** (italic, muted-soft color)
  - Caption: "Broken today."
- [ ] Days journaled: **1** (still one trade-day)

🚨 If you only want to test broken-day behavior cleanly, delete the followed trade first so the day's status is purely from the broken one.

### 7. Mentor view shows the streak

- [ ] Sign back in as `OWNER`
- [ ] Visit `/mentor`
- [ ] In the cohort table, your test student's row shows:
  - **Rules** column = current streak number
  - Tooltip on hover: "Today: followed/broken/neutral · Longest: N"

### 8. Mentor — per-student detail

- [ ] Click your test student's name in the cohort table
- [ ] On `/mentor/[userId]` page:
  - Streak strip appears below StatsBar
  - "Daily check-ins" section appears between equity curve and trade list
  - Today's check-in shows pre-market mood / energy / sleep / note + post-market mood / reflection

### 9. Stale check-in handling

- [ ] In Supabase Table Editor → `daily_checkins`, find one of your rows
- [ ] Manually change `check_in_date` to **yesterday's date** (e.g. `2026-05-09`)
- [ ] Refresh `/dashboard` — Pre-market and Post-market forms should now be **empty** (because today's row no longer exists)
- [ ] Save a new pre-market entry → confirms today's row is created fresh

### 10. RLS — student can't read others

- [ ] Stay signed in as student
- [ ] Open browser dev tools → Console tab
- [ ] Run:
  ```js
  fetch('/some-other-students-checkin-page')  // replace with a real path
  ```
  Or simpler: try visiting `/mentor` as a student — you should be redirected to `/dashboard` (already enforced in Phase 1).
- [ ] In Supabase logs → if the student tried to query `daily_checkins` with another `user_id`, RLS would return zero rows. (The app doesn't expose this UI, so this is a defense-in-depth check.)

---

## When all tests pass

Reply **"Phase 2 works"** and I'll start Phase 3 (calendar view).

If anything fails, paste the symptom and I'll fix.

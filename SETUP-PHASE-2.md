# Phase 2 Setup — Streak + Daily Check-in

One step. Takes 60 seconds.

## Step 1 — Run the migration

The new `daily_checkins` table needs to be created in your Supabase database.

1. Open Supabase dashboard → your project → **SQL Editor**
2. Click **+ New query**
3. Open `trade-journal/supabase/migration_003_daily_checkin_streak.sql` in Notepad
4. Copy entire contents → paste into Supabase SQL editor
5. Click **Run**
6. Wait for green **Success. No rows returned**

If it fails with a red error, paste the error to me. Don't refresh the app yet.

## Step 2 — Refresh the journal

The dev server is already running. Just hit refresh in your browser:

- **`/dashboard`** (student view) → you'll see the new streak strip + daily check-in card at the top
- **`/mentor`** (your mentor view) → cohort table now has a "Rules" column between Net and Loss
- **`/mentor/[any-student-id]`** → after the equity curve, you'll see daily check-ins for that student

That's it. No code changes needed on your end. No restart.

---

## What changed at a glance

### Student dashboard (`/dashboard`)
- **Streak strip** at the top: current rules-followed streak, longest, days journaled
- **Daily check-in card** below it: pre-market form (mood, energy, sleep, note) + post-market form (mood, reflection)
- Old layout (StatsBar, TradeForm, Recent trades) sits below — unchanged

### Mentor cohort (`/mentor`)
- New **Rules** column showing each student's current streak
- Existing **Streak** column was a loss-streak — renamed to **Loss** for clarity
- Color cues:
  - **Italic gold** = student on a 5+ day rules streak (hot)
  - **Italic muted** = student broke rules today
  - **Bone (default)** = neutral

### Per-student detail (`/mentor/[userId]`)
- **Streak strip** sits between StatsBar and the equity curve (same component as student dashboard)
- New **Daily check-ins** section between the equity curve and recent trades — last 30 days, each with mood, energy, sleep, notes, reflection

---

## How "rules followed" is computed

A trade is **rules-followed** when all four criteria booleans are true on that trade:
- `criteria_profile`
- `criteria_signature`
- `criteria_trigger`
- `criteria_targets`

A **day** is rules-followed when **every** trade that day is rules-followed.

The streak counts consecutive rules-followed days. **No-trade days are neutral** — they don't extend the streak, but they don't break it either. Discipline includes sitting on hands.

The streak breaks the moment you log a trade with any criteria=false on a day. That day becomes a "broken day" and the streak resets.

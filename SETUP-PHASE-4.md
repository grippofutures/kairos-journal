# Phase 4 Setup — Mentor Review Tooling

One step. Takes 60 seconds.

## Step 1 — Run the migration

1. Supabase dashboard → **SQL Editor** → **+ New query**
2. Open `trade-journal/supabase/migration_005_mentor_review.sql` in Notepad
3. Copy contents → paste into Supabase SQL Editor
4. Click **Run**
5. Wait for green **Success. No rows returned**

What this migration does:
- Adds `reviewed_at` + `reviewed_by` columns to `trades`
- Creates a new `trade_comments` table (RLS: mentors read/write, students read-only on their own)
- All existing trades start as unreviewed (will all show in your queue)

That's it. Refresh and the review tooling is live.

---

## What changed

### `/mentor` cohort page
- **"Review queue · N"** link in the top-right (with unreviewed count when > 0)
- New **Unreviewed** stat at the top of the page

### `/mentor/queue` — new page
- Every unreviewed trade across all students, **oldest first** (so you clear the backlog FIFO)
- Each card shows: student name (link to their detail page), instrument/direction/contracts/P&L, followed/broken badge, thesis, chart, **comment thread**, and a **Mark reviewed** button
- Mark reviewed → card disappears, next trade rises
- All cleared → "Caught up." message

### `/mentor/[userId]` per-student page
- Recent trades list now has per-trade controls:
  - **Mark reviewed** button (or "Reviewed · date" + Reopen button if already done)
  - **Mentor notes** thread — post inline, see all prior notes from you or Sam, delete your own

### `/dashboard` student view
- Each trade with mentor comments shows them as read-only quotes below the trade card
- Students can't post comments (mentor-only by RLS); they just see what you/Sam wrote
- Trades with no comments show no change

### TradeList component (used everywhere)
Three small visual improvements that came along:
- New **Followed** (gold) or **Broken** (muted) badge on every trade
- New **Reviewed** badge appears once a mentor marks it
- Entry → Exit price line only renders if both are set (was showing `null → null` on new trades after Phase 3)

---

## Suggested mentor workflow

1. Sign in as mentor → land on `/mentor` (cohort)
2. Top-right shows "Review queue · 12" (or however many)
3. Click it → queue page, oldest unreviewed first
4. For each trade:
   - Read the thesis, look at the chart
   - Type a note: "Wrong candle. Look at the M30 from 9:32 — that wasn't a Two-Stage." (or whatever)
   - Click **Mark reviewed**
5. Card disappears, next one rises
6. When you hit "Caught up" → done

For a deeper review session on one student, go to `/mentor/[userId]` instead. You get equity curve, tilt alerts, streak, daily check-ins, AND the per-trade review controls — all in one page.

---

## Files in this batch

**New:**
- `supabase/migration_005_mentor_review.sql`
- `app/mentor/actions.ts` — server actions: postComment, deleteComment, markReviewed, unmarkReviewed
- `app/mentor/queue/page.tsx`
- `components/CommentThread.tsx`
- `components/ReviewControls.tsx`

**Modified:**
- `components/TradeList.tsx` — added `extraPerTrade` render prop, followed/reviewed badges, null-safe price display
- `app/mentor/page.tsx` — added Review queue link + Unreviewed stat
- `app/mentor/[userId]/page.tsx` — wired in mentor controls + comments per trade
- `app/dashboard/page.tsx` — wired in read-only comment display for students

---

## Test pass

1. As mentor: visit `/mentor` — see "Review queue · N" link top-right
2. Click queue → see your unreviewed trades, oldest first
3. On any trade: type a note in the textarea, click **Post note** → note appears above
4. Click **Mark reviewed** → trade disappears from queue, count drops by one
5. Visit `/mentor/[any-student-id]` → see the same Mark-reviewed / Notes controls on each recent trade
6. Flip yourself to student (Supabase profiles → role → 'student'), visit `/dashboard` → your reviewed trades should show the mentor note below them, with no input box (read-only)
7. Flip back to mentor when done

If a step fails, paste the error.

---

## When done

Reply **"Phase 4 works"** and I'll move to Phase 5 (test pass + deploy prep).

Or **"deploy"** if you want to push to Vercel now and start onboarding real students.

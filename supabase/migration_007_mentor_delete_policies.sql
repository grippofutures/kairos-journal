-- Migration 007 — Mentor delete policies
--
-- Lets a mentor delete a student's data (profile, trades, daily check-ins,
-- comments, screenshots) via the "Remove student" action on /mentor/[userId].
-- Server action validates target is a student before deletion — RLS is the
-- last-line defense, not the sole gate.
--
-- The auth.users row is intentionally NOT deleted (that requires service role
-- key). If a removed student is still in your Kairos Discord with an approved
-- role, they could sign in again and get a fresh empty profile. To prevent
-- re-entry, remove them from your Discord server first.
--
-- Apply once via Supabase SQL Editor.

drop policy if exists "profiles_mentor_delete"      on public.profiles;
drop policy if exists "trades_mentor_delete"        on public.trades;
drop policy if exists "checkins_mentor_delete"      on public.daily_checkins;
drop policy if exists "comments_mentor_delete"      on public.trade_comments;
drop policy if exists "screenshots_mentor_delete"   on storage.objects;

create policy "profiles_mentor_delete"
  on public.profiles for delete
  using (public.is_mentor());

create policy "trades_mentor_delete"
  on public.trades for delete
  using (public.is_mentor());

create policy "checkins_mentor_delete"
  on public.daily_checkins for delete
  using (public.is_mentor());

create policy "comments_mentor_delete"
  on public.trade_comments for delete
  using (public.is_mentor());

create policy "screenshots_mentor_delete"
  on storage.objects for delete
  using (bucket_id = 'screenshots' and public.is_mentor());

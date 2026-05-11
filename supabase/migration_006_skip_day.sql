-- Migration 006 — Skip day support
--
-- Adds `skipped_day` boolean to daily_checkins. Explicit "I'm sitting out today"
-- — neutral for the streak (same as no-trade), but tracked so the mentor sees it
-- as an intentional discipline action rather than absence.
--
-- Apply once via Supabase SQL Editor.

alter table public.daily_checkins
  add column if not exists skipped_day boolean not null default false;

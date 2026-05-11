-- Migration 004 — Simplify trade form
--
-- 1. Adds `followed_model` boolean to trades. Single source of truth for
--    "did the trader follow the model on this trade?" — drives the rules streak.
-- 2. Backfills `followed_model = true` for any existing trade where all four
--    criteria booleans were true (preserves the old definition for old data).
-- 3. Makes entry_price / exit_price nullable. They're no longer required by the
--    new form, but kept for backward compat and optional capture later.
--
-- Apply once via Supabase SQL Editor.

alter table public.trades
  add column if not exists followed_model boolean not null default false;

-- Backfill for any trades created before this migration
update public.trades
  set followed_model = true
where criteria_profile
  and criteria_signature
  and criteria_trigger
  and criteria_targets
  and followed_model = false;

-- Drop the NOT NULL on entry/exit so the simplified form can omit them
alter table public.trades alter column entry_price drop not null;
alter table public.trades alter column exit_price drop not null;

create index if not exists trades_user_followed_idx
  on public.trades (user_id, followed_model);

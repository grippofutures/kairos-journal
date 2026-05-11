-- Migration 003 — Daily check-in
--
-- Adds the daily_checkins table for the morning + post-market reflection.
-- Streak is computed from trades.criteria_* booleans, no schema needed for it.
--
-- Apply once via Supabase SQL Editor.

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_in_date date not null,
  -- pre-market
  pre_market_mood text check (
    pre_market_mood in (
      'calm','confident','hesitant','rushed','revenge','fomo','blank'
    )
  ),
  energy_level smallint check (energy_level between 1 and 5),
  sleep_hours numeric(3,1) check (sleep_hours >= 0 and sleep_hours <= 24),
  pre_market_note text,
  -- post-market
  post_market_mood text check (
    post_market_mood in (
      'calm','confident','hesitant','rushed','revenge','fomo','blank'
    )
  ),
  reflection text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, check_in_date)
);

create index if not exists daily_checkins_user_date_idx
  on public.daily_checkins (user_id, check_in_date desc);

-- Updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists daily_checkins_touch_updated on public.daily_checkins;
create trigger daily_checkins_touch_updated
  before update on public.daily_checkins
  for each row execute function public.touch_updated_at();

-- RLS — same pattern as trades
alter table public.daily_checkins enable row level security;

drop policy if exists "checkins_self_read"   on public.daily_checkins;
drop policy if exists "checkins_mentor_read" on public.daily_checkins;
drop policy if exists "checkins_self_insert" on public.daily_checkins;
drop policy if exists "checkins_self_update" on public.daily_checkins;
drop policy if exists "checkins_self_delete" on public.daily_checkins;

create policy "checkins_self_read"
  on public.daily_checkins for select
  using (auth.uid() = user_id);

create policy "checkins_mentor_read"
  on public.daily_checkins for select
  using (public.is_mentor());

create policy "checkins_self_insert"
  on public.daily_checkins for insert
  with check (auth.uid() = user_id);

create policy "checkins_self_update"
  on public.daily_checkins for update
  using (auth.uid() = user_id);

create policy "checkins_self_delete"
  on public.daily_checkins for delete
  using (auth.uid() = user_id);

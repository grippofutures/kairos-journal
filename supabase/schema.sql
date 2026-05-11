-- Trade Journal schema (v2 — with framework fields)
-- Paste this entire file into the Supabase SQL Editor and run once.
-- If you already ran v1, run supabase/migration_001_framework_fields.sql instead.

-- ============================================================================
-- profiles: extends auth.users with role + display name
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'student' check (role in ('student', 'mentor')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- trades: one row per trade
-- ============================================================================
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  traded_at timestamptz not null,
  instrument text not null,
  direction text not null check (direction in ('long', 'short')),
  contracts integer not null check (contracts > 0),
  entry_price numeric not null,
  exit_price numeric not null,
  pnl numeric not null,
  r_multiple numeric,
  setup_tag text,
  outcome text not null check (outcome in ('win', 'loss', 'breakeven')),
  screenshot_path text,
  notes text,
  emotion_tag text,
  -- framework fields
  thesis text not null default '',
  candle_type text check (candle_type in ('expansion', 'reversal_into_expansion', 'reversal', 'other')),
  framework_score smallint not null default 5 check (framework_score between 1 and 10),
  criteria_profile boolean not null default false,
  criteria_signature boolean not null default false,
  criteria_trigger boolean not null default false,
  criteria_targets boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists trades_user_traded_at_idx
  on public.trades (user_id, traded_at desc);

-- ============================================================================
-- security definer helper to avoid recursive RLS on profiles
-- ============================================================================
create or replace function public.is_mentor()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select role = 'mentor' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ============================================================================
-- auto-create profile row on signup
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.trades enable row level security;

drop policy if exists "profiles_self_read"   on public.profiles;
drop policy if exists "profiles_mentor_read" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "trades_self_read"     on public.trades;
drop policy if exists "trades_mentor_read"   on public.trades;
drop policy if exists "trades_self_insert"   on public.trades;
drop policy if exists "trades_self_update"   on public.trades;
drop policy if exists "trades_self_delete"   on public.trades;

create policy "profiles_self_read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_mentor_read"
  on public.profiles for select
  using (public.is_mentor());

create policy "profiles_self_update"
  on public.profiles for update
  using (auth.uid() = id);

create policy "trades_self_read"
  on public.trades for select
  using (auth.uid() = user_id);

create policy "trades_mentor_read"
  on public.trades for select
  using (public.is_mentor());

create policy "trades_self_insert"
  on public.trades for insert
  with check (auth.uid() = user_id);

create policy "trades_self_update"
  on public.trades for update
  using (auth.uid() = user_id);

create policy "trades_self_delete"
  on public.trades for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- storage bucket for screenshots (private; access via signed URLs)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', false)
on conflict (id) do nothing;

drop policy if exists "screenshots_owner_insert" on storage.objects;
drop policy if exists "screenshots_owner_select" on storage.objects;
drop policy if exists "screenshots_mentor_select" on storage.objects;
drop policy if exists "screenshots_owner_delete" on storage.objects;

create policy "screenshots_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "screenshots_owner_select"
  on storage.objects for select
  using (
    bucket_id = 'screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "screenshots_mentor_select"
  on storage.objects for select
  using (bucket_id = 'screenshots' and public.is_mentor());

create policy "screenshots_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Migration 005 — Mentor review tooling
--
-- 1. Adds reviewed_at + reviewed_by to trades for the "mark reviewed" workflow.
-- 2. Adds trade_comments table for mentor→student notes on individual trades.
-- 3. RLS: mentors can insert + read all comments; students can read comments on
--    their own trades only.
--
-- Apply once via Supabase SQL Editor.

-- 1. Review fields on trades
alter table public.trades
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

create index if not exists trades_unreviewed_idx
  on public.trades (created_at) where reviewed_at is null;

-- 2. Comments table
create table if not exists public.trade_comments (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists trade_comments_trade_idx
  on public.trade_comments (trade_id, created_at);

-- 3. RLS
alter table public.trade_comments enable row level security;

drop policy if exists "comments_mentor_all"        on public.trade_comments;
drop policy if exists "comments_student_self_read" on public.trade_comments;

-- Mentors: full access (insert, select, update, delete)
create policy "comments_mentor_all"
  on public.trade_comments for all
  using (public.is_mentor())
  with check (public.is_mentor());

-- Students: read comments only on their own trades
create policy "comments_student_self_read"
  on public.trade_comments for select
  using (
    exists (
      select 1 from public.trades t
      where t.id = trade_comments.trade_id
        and t.user_id = auth.uid()
    )
  );

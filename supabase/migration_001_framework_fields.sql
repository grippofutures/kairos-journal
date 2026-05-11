-- Migration: add framework fields to trades
-- Run this if you already ran the v1 schema and have existing data.
-- Safe to run multiple times.

alter table public.trades
  add column if not exists thesis text not null default '',
  add column if not exists candle_type text,
  add column if not exists framework_score smallint not null default 5,
  add column if not exists criteria_profile boolean not null default false,
  add column if not exists criteria_signature boolean not null default false,
  add column if not exists criteria_trigger boolean not null default false,
  add column if not exists criteria_targets boolean not null default false;

-- Add check constraints (drop first in case of re-run)
alter table public.trades drop constraint if exists trades_candle_type_check;
alter table public.trades
  add constraint trades_candle_type_check
  check (candle_type is null or candle_type in ('expansion', 'reversal_into_expansion', 'reversal', 'other'));

alter table public.trades drop constraint if exists trades_framework_score_check;
alter table public.trades
  add constraint trades_framework_score_check
  check (framework_score between 1 and 10);

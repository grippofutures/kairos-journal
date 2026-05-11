-- Migration 002 — Discord OAuth integration
--
-- Adds discord_id + discord_username to profiles so the mentor view can show
-- who's who at a glance. The /auth/callback route populates these fields after
-- it has verified Kairos guild membership.
--
-- Apply this once via Supabase SQL Editor.

alter table public.profiles
  add column if not exists discord_id text,
  add column if not exists discord_username text;

create index if not exists profiles_discord_id_idx
  on public.profiles (discord_id);

-- Note: handle_new_user() is unchanged. Supabase's trigger creates the profile
-- row at signup with role='student' (the default). The OAuth callback then
-- updates the role to whatever the user's Discord roles map to.

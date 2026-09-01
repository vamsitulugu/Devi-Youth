-- Adds broadcast orientation to the LiveKit-based live stream (landscape
-- 16:9 or portrait 9:16). Additive, safe to run after 15_livekit.sql.
alter table public.festivals
  add column if not exists live_orientation text not null default 'landscape';

-- LiveKit-based live stream: room name + WSS URL the admin sets once.
-- Additive only. (live_active and live_room_url were added in
-- 14_live_stream.sql for the earlier YouTube-link version; live_room_url
-- is unused now but harmless to leave.)
alter table public.festivals
  add column if not exists live_room_name text,
  add column if not exists live_ws_url text;

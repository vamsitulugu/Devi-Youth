-- Real live-stream support: a persistent Daily.co (or any WebRTC room
-- provider that gives you an embeddable URL) room, plus an on/off flag
-- the admin controls from the dashboard. Additive only.
alter table public.festivals
  add column if not exists live_active boolean not null default false,
  add column if not exists live_room_url text;

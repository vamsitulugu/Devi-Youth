-- Optional event photo, mirroring announcements.image_url. Additive.
alter table public.events
  add column if not exists image_url text;

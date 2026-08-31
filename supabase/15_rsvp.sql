-- RSVP / headcount. Additive only — safe to run alongside the existing
-- 01-12 migrations. Public can submit and read (needed to show the
-- live headcount on the villager RSVP page); only committee/admin can
-- delete a record.
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  festival_id uuid references public.festivals(id) on delete cascade,
  name text not null,
  phone text,
  guests int not null default 1,
  created_at timestamptz not null default now()
);

alter table public.rsvps enable row level security;

drop policy if exists "rsvps: anyone can submit" on public.rsvps;
create policy "rsvps: anyone can submit" on public.rsvps
  for insert to anon, authenticated with check (true);

drop policy if exists "rsvps: anyone can read" on public.rsvps;
create policy "rsvps: anyone can read" on public.rsvps
  for select to anon, authenticated using (true);

drop policy if exists "rsvps: committee/admin can delete" on public.rsvps;
create policy "rsvps: committee/admin can delete" on public.rsvps
  for delete to authenticated using (is_committee_or_admin());

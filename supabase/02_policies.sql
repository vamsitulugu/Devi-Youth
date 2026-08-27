-- ============================================================
-- Grama Ganapati — Phase 2 Row Level Security
-- Run AFTER 01_schema.sql.
--
-- Rule of thumb applied throughout:
--   - Public festival content: anyone can SELECT, only committee/admin can
--     write, only admin can delete.
--   - Donations & expenses: admin/committee only, in both directions.
--     Villagers get zero access — not even a restricted view — matching
--     "Villagers must NOT see individual donor amounts or records".
--   - profiles: a user can read/update their own row; only admins can
--     read everyone's (needed for the admin user-management screen).
-- ============================================================

alter table profiles enable row level security;
alter table festivals enable row level security;
alter table announcements enable row level security;
alter table events enable row level security;
alter table committee_members enable row level security;
alter table laddu_auctions enable row level security;
alter table lottery enable row level security;
alter table lottery_prizes enable row level security;
alter table lottery_winners enable row level security;
alter table photo_albums enable row level security;
alter table photos enable row level security;
alter table contacts enable row level security;
alter table donations enable row level security;
alter table expenses enable row level security;

-- ---------- profiles ----------
create policy "profiles: read own" on profiles for select
  using (id = auth.uid());
create policy "profiles: admin reads all" on profiles for select
  using (is_admin());
create policy "profiles: read own update" on profiles for update
  using (id = auth.uid());
create policy "profiles: admin manages all" on profiles for all
  using (is_admin()) with check (is_admin());

-- ---------- festivals (public read; committee/admin write; admin delete) ----------
create policy "festivals: public read" on festivals for select using (true);
create policy "festivals: committee write" on festivals for insert with check (is_committee_or_admin());
create policy "festivals: committee update" on festivals for update using (is_committee_or_admin());
create policy "festivals: admin delete" on festivals for delete using (is_admin());

-- ---------- announcements ----------
create policy "announcements: public read" on announcements for select using (true);
create policy "announcements: committee write" on announcements for insert with check (is_committee_or_admin());
create policy "announcements: committee update" on announcements for update using (is_committee_or_admin());
create policy "announcements: admin delete" on announcements for delete using (is_admin());

-- ---------- events ----------
create policy "events: public read" on events for select using (true);
create policy "events: committee write" on events for insert with check (is_committee_or_admin());
create policy "events: committee update" on events for update using (is_committee_or_admin());
create policy "events: admin delete" on events for delete using (is_admin());

-- ---------- committee_members ----------
create policy "committee: public read" on committee_members for select using (true);
create policy "committee: admin write" on committee_members for insert with check (is_admin());
create policy "committee: admin update" on committee_members for update using (is_admin());
create policy "committee: admin delete" on committee_members for delete using (is_admin());

-- ---------- laddu_auctions ----------
create policy "laddu: public read" on laddu_auctions for select using (true);
create policy "laddu: committee write" on laddu_auctions for insert with check (is_committee_or_admin());
create policy "laddu: committee update" on laddu_auctions for update using (is_committee_or_admin());
create policy "laddu: admin delete" on laddu_auctions for delete using (is_admin());

-- ---------- lottery / prizes / winners ----------
create policy "lottery: public read" on lottery for select using (true);
create policy "lottery: committee write" on lottery for insert with check (is_committee_or_admin());
create policy "lottery: committee update" on lottery for update using (is_committee_or_admin());
create policy "lottery: admin delete" on lottery for delete using (is_admin());

create policy "lottery_prizes: public read" on lottery_prizes for select using (true);
create policy "lottery_prizes: committee write" on lottery_prizes for insert with check (is_committee_or_admin());
create policy "lottery_prizes: committee update" on lottery_prizes for update using (is_committee_or_admin());
create policy "lottery_prizes: admin delete" on lottery_prizes for delete using (is_admin());

create policy "lottery_winners: public read" on lottery_winners for select using (true);
create policy "lottery_winners: committee write" on lottery_winners for insert with check (is_committee_or_admin());
create policy "lottery_winners: committee update" on lottery_winners for update using (is_committee_or_admin());
create policy "lottery_winners: admin delete" on lottery_winners for delete using (is_admin());

-- ---------- photo_albums / photos ----------
create policy "albums: public read" on photo_albums for select using (true);
create policy "albums: committee write" on photo_albums for insert with check (is_committee_or_admin());
create policy "albums: committee update" on photo_albums for update using (is_committee_or_admin());
create policy "albums: admin delete" on photo_albums for delete using (is_admin());

create policy "photos: public read" on photos for select using (true);
create policy "photos: committee write" on photos for insert with check (is_committee_or_admin());
create policy "photos: committee delete own or admin" on photos for delete
  using (is_admin() or uploaded_by = auth.uid());

-- ---------- contacts ----------
create policy "contacts: public read" on contacts for select using (true);
create policy "contacts: admin write" on contacts for insert with check (is_admin());
create policy "contacts: admin update" on contacts for update using (is_admin());
create policy "contacts: admin delete" on contacts for delete using (is_admin());

-- ---------- donations (PRIVATE) ----------
create policy "donations: committee/admin read" on donations for select using (is_committee_or_admin());
create policy "donations: committee/admin write" on donations for insert with check (is_committee_or_admin());
create policy "donations: committee/admin update" on donations for update using (is_committee_or_admin());
create policy "donations: admin delete" on donations for delete using (is_admin());

-- ---------- expenses (PRIVATE) ----------
create policy "expenses: committee/admin read" on expenses for select using (is_committee_or_admin());
create policy "expenses: committee/admin write" on expenses for insert with check (is_committee_or_admin());
create policy "expenses: committee/admin update" on expenses for update using (is_committee_or_admin());
create policy "expenses: admin delete" on expenses for delete using (is_admin());

-- ============================================================
-- Devi Youth — Sree Bala Ganesh — Phase 2 Storage
-- Run AFTER 01_schema.sql and 02_policies.sql.
--
-- One public bucket, `gallery`, holds everything: committee photos,
-- gallery photos, lottery prize images, laddu images. Files are public
-- to READ (festival photos are meant to be seen by everyone), but only
-- committee/admin can upload, and only admin can delete.
--
-- Suggested path convention (enforced by app code, not the DB):
--   gallery/{year}/{album}/{filename}
--   gallery/committee/{member_id}.jpg
--   gallery/lottery/{prize_id}.jpg
--   gallery/laddu/{year}.jpg
-- ============================================================

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

create policy "gallery: public read"
  on storage.objects for select
  using (bucket_id = 'gallery');

create policy "gallery: committee/admin upload"
  on storage.objects for insert
  with check (bucket_id = 'gallery' and is_committee_or_admin());

create policy "gallery: committee/admin update"
  on storage.objects for update
  using (bucket_id = 'gallery' and is_committee_or_admin());

create policy "gallery: admin delete"
  on storage.objects for delete
  using (bucket_id = 'gallery' and is_admin());

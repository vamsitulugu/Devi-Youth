-- ============================================================
-- Devi Youth — Per-person donation QR codes
--
-- Every committee member (this includes the "Admin" position too —
-- admin is just another row in committee_members, not a separate
-- table) can now have their own UPI/payment QR photo, shown on the
-- public Donations page next to their name. Reuses the existing
-- public `gallery` storage bucket and its policies (03_storage.sql) —
-- no new bucket or policy needed. Suggested path convention:
--   gallery/committee-qr/{member_id}.jpg
-- ============================================================

alter table committee_members
  add column if not exists qr_url text;

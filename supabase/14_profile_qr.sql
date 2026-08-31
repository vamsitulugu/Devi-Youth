-- ============================================================
-- Devi Youth — Per-login donation QR (collector's own QR code)
--
-- Different from committee_members.qr_url (13_donation_qr.sql),
-- which is a public-facing directory entry anyone can browse.
-- This one lives on the actual login account (`profiles`), so
-- whoever is signed in — admin or committee — can upload their
-- own UPI/QR photo once in Settings, and it follows them into
-- the donation-collection screens regardless of whether they
-- also have a public committee_members entry.
--
-- Reuses the existing public `gallery` storage bucket and its
-- policies (03_storage.sql) — no new bucket or policy needed.
-- Suggested path convention:
--   gallery/profile-qr/{profile_id}-{timestamp}.jpg
-- ============================================================

alter table profiles
  add column if not exists qr_url text;

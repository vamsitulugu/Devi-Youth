-- Gallery update: album names are now English-only (see src/pages/admin/ManageGallery.jsx).
-- Run this once against an existing database that was created before this change.
-- Safe to re-run: both statements are no-ops if already applied.

alter table photo_albums drop column if exists name_te;

-- Speeds up "how many photos does this album have" queries used by the
-- album cards in both the public Gallery and the admin Gallery manager.
create index if not exists idx_photos_album_created on photos(album_id, created_at desc);

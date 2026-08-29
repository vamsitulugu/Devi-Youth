-- ============================================================
-- Devi Youth — Bala Ganesh Puja — bilingual (EN/TE) content system
-- Run AFTER 01_schema.sql / 02_policies.sql / 03_storage.sql / 04_seed.sql
-- / 05_gallery_update.sql.
--
-- This migration is purely ADDITIVE:
--   - No existing column is dropped or renamed.
--   - Every existing `*_en` / `*_te` value keeps working exactly as
--     before (see src/services/api.js — it still reads both columns).
--   - What changes is the ADMIN WORKFLOW: instead of requiring the
--     admin to type both an English and a Telugu version of a field,
--     they now type it once. We detect which language they typed and
--     store it in the matching `*_en`/`*_te` column, leaving the other
--     one blank. The blank side is filled in on read by
--     src/services/localize.js, which translates on demand and caches
--     the result in `translation_cache` below (never in the row itself
--     — that keeps RLS simple, since anonymous visitors never need
--     write access to festivals/announcements/etc. to "warm" the cache).
-- ============================================================

-- ---------- shared translation cache ----------
-- Keyed on the exact source text + target language. Public read/insert:
-- this table never stores anything that isn't already public festival
-- content, so there's no reason to gate it behind auth. It exists purely
-- so the same sentence is never sent to the translation API twice.
create table if not exists translation_cache (
  id uuid primary key default gen_random_uuid(),
  source_text text not null,
  source_lang text not null check (source_lang in ('en', 'te')),
  target_lang text not null check (target_lang in ('en', 'te')),
  translated_text text not null,
  created_at timestamptz not null default now(),
  unique (source_text, target_lang)
);

alter table translation_cache enable row level security;

create policy "translation_cache: public read" on translation_cache for select using (true);
create policy "translation_cache: public insert" on translation_cache for insert with check (true);

-- ---------- source-language metadata ----------
-- Records which language the admin actually typed for each bilingual
-- field, so we know which side is "ground truth" vs. a generated
-- translation. Nullable + no default change to existing rows: existing
-- records (which already have both _en and _te filled by hand) simply
-- don't need this and are left untouched.
alter table festivals add column if not exists name_source_lang text check (name_source_lang in ('en', 'te'));
alter table festivals add column if not exists village_source_lang text check (village_source_lang in ('en', 'te'));

alter table announcements add column if not exists title_source_lang text check (title_source_lang in ('en', 'te'));
alter table announcements add column if not exists body_source_lang text check (body_source_lang in ('en', 'te'));

alter table events add column if not exists title_source_lang text check (title_source_lang in ('en', 'te'));
alter table events add column if not exists description_source_lang text check (description_source_lang in ('en', 'te'));
alter table events add column if not exists location_source_lang text check (location_source_lang in ('en', 'te'));

alter table committee_members add column if not exists position_source_lang text check (position_source_lang in ('en', 'te'));

alter table contacts add column if not exists role_source_lang text check (role_source_lang in ('en', 'te'));

alter table laddu_auctions add column if not exists title_source_lang text check (title_source_lang in ('en', 'te'));
alter table laddu_auctions add column if not exists location_source_lang text check (location_source_lang in ('en', 'te'));

alter table lottery add column if not exists location_source_lang text check (location_source_lang in ('en', 'te'));
alter table lottery_prizes add column if not exists name_source_lang text check (name_source_lang in ('en', 'te'));

-- Album names were English-only (see old comment in src/services/api.js).
-- Add the missing Telugu column plus source-language metadata so albums
-- follow the same single-field pattern as everything else.
alter table photo_albums add column if not exists name_te text;
alter table photo_albums add column if not exists name_source_lang text check (name_source_lang in ('en', 'te'));

-- Backfill: existing albums were entered in English, so name_source_lang
-- is 'en' and name_te is left blank for the app to translate on demand.
update photo_albums set name_source_lang = 'en' where name_source_lang is null and name_en is not null;

create index if not exists idx_translation_cache_lookup on translation_cache(source_text, target_lang);

-- ============================================================
-- Devi Youth Sree Bala Ganesh Puja — live-sync Settings
-- Run this AFTER 07 and 08.
--
-- The Money Dashboard already updates live because `donations` and
-- `expenses` are in Supabase's realtime publication. `profiles` and
-- `invite_codes` weren't, so Settings only ever showed whatever it
-- loaded when the page first opened — an invite code stayed "Pending"
-- even after someone joined, until the admin manually reloaded the
-- page. This adds both tables to the same publication so Settings
-- updates itself the instant someone redeems a code, with no refresh.
--
-- Wrapped in existence checks so this is safe to run even if your
-- project's publication already covers every table.
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table profiles;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'invite_codes'
  ) then
    alter publication supabase_realtime add table invite_codes;
  end if;
end $$;

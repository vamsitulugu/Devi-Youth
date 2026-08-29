-- ============================================================
-- Devi Youth — Bala Ganesh Puja — auto-apply invite code at signup
-- Run this AFTER 07_invites_and_role_protection.sql.
--
-- Why: previously the invite code was redeemed by a second call made
-- from the browser right after sign-up — but that only works if the
-- person already has an active session, which requires "Confirm
-- email" to be OFF in Supabase. This replaces that with logic inside
-- the existing on_auth_user_created trigger, which always fires the
-- instant the account row is created — no session, no email
-- confirmation, and no trip to Supabase's dashboard required, ever.
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  inv invite_codes%rowtype;
begin
  v_code := nullif(upper(trim(new.raw_user_meta_data->>'invite_code')), '');

  if v_code is not null then
    select * into inv from invite_codes where code = v_code for update;
  end if;

  if inv.id is not null and not inv.used and inv.expires_at > now() then
    insert into profiles (id, full_name, role, phone)
    values (new.id, new.raw_user_meta_data->>'full_name', inv.role, inv.phone);

    update invite_codes set used = true, used_by = new.id, used_at = now() where id = inv.id;
  else
    -- No code, or it was bad/used/expired (already checked client-side
    -- before signup, so this is just a safety net) — fall back to the
    -- original default so signup never breaks.
    insert into profiles (id, full_name, role)
    values (new.id, new.raw_user_meta_data->>'full_name', 'villager');
  end if;

  return new;
end;
$$;

-- Trigger itself is unchanged (still on_auth_user_created / after
-- insert on auth.users) — only the function body changed, so no need
-- to re-create the trigger.

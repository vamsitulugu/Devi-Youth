-- ============================================================
-- Devi Youth Sree Bala Ganesh Puja — Invite codes + role lock-down
-- Run this in the Supabase SQL editor AFTER 01–06.
--
-- What this adds:
--   1. Nobody except an admin can ever change a profile's `role` —
--      enforced by a database trigger, not just the app's UI. This
--      closes the "any logged-in user can self-promote via the API"
--      hole (profiles already allows "update own row").
--   2. An `invite_codes` table + two SECURITY DEFINER functions so
--      villagers can self-register from a link with NO email service,
--      NO Vercel/service-role secrets, and NO admin typing anyone's
--      email:
--        - Admin picks a phone number + role (defaults to Committee),
--          the app generates a short code and a WhatsApp share link.
--        - The invitee opens the link, types their OWN name/email/
--          password + the code, and lands with the role the admin
--          picked. Nobody but the invitee ever sees their password.
--
-- IMPORTANT: In Supabase → Authentication → Providers → Email, turn
-- OFF "Confirm email" (or the invitee's session won't be active right
-- after sign-up and the code can't be redeemed automatically).
-- ============================================================

-- ---------- 1. Lock role changes to admins only ----------
-- The existing "profiles: read own update" policy lets a user update
-- their own row — needed so people can edit their own name — but it
-- doesn't restrict which columns. This trigger adds a real column-level
-- guard: the `role` column can only change if the person making the
-- change is already an admin, OR the change is coming from the
-- redeem_invite_code() function below (which sets a transaction-local
-- flag right before it assigns a role from a validated invite code).
create or replace function prevent_role_self_promotion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if coalesce(current_setting('app.bypass_role_check', true), '') = 'on' then
      return new; -- being set by redeem_invite_code(), already validated
    end if;
    if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
      raise exception 'Only an admin can change a user''s role.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_self_promotion on profiles;
create trigger trg_prevent_role_self_promotion
  before update on profiles
  for each row execute function prevent_role_self_promotion();

-- ---------- 2. invite_codes ----------
create table if not exists invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  phone text not null,
  role text not null default 'committee' check (role in ('admin', 'committee', 'villager')),
  created_by uuid references profiles(id),
  used boolean not null default false,
  used_by uuid references profiles(id),
  used_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index if not exists idx_invite_codes_code on invite_codes(code);

alter table invite_codes enable row level security;

-- Only admins can see/create/revoke invite codes directly (Settings →
-- Users & Roles). Nobody else gets table access at all — the invitee
-- never queries this table; they only go through the two functions
-- below, which check a code without exposing the rest of the table.
create policy "invite_codes: admin manages all" on invite_codes for all
  using (is_admin()) with check (is_admin());

-- Checks a code before the invite page lets someone fill in the form,
-- and again right before sign-up. Callable by anyone (even signed-out
-- visitors) since it's the front gate — but it only ever reveals
-- whether a code is valid and what role/phone it's tied to, never the
-- whole invite_codes table.
create or replace function validate_invite_code(p_code text)
returns table(is_valid boolean, role text, phone text, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  inv invite_codes%rowtype;
begin
  select * into inv from invite_codes where code = upper(trim(p_code));
  if not found then
    return query select false, null::text, null::text, 'That code doesn''t match any invite.';
  elsif inv.used then
    return query select false, null::text, null::text, 'That code has already been used.';
  elsif inv.expires_at < now() then
    return query select false, null::text, null::text, 'That code has expired. Ask an admin to send a new one.';
  else
    return query select true, inv.role, inv.phone, null::text;
  end if;
end;
$$;

-- Called right after the invitee's account is created (they're signed
-- in at this point — see Join.jsx). Re-validates the code server-side
-- (never trust the client), then sets their role/phone from the
-- invite and marks the code used, all in one transaction.
create or replace function redeem_invite_code(p_code text)
returns table(role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  inv invite_codes%rowtype;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to redeem an invite code.';
  end if;

  select * into inv from invite_codes where code = upper(trim(p_code)) for update;
  if not found then
    raise exception 'That code doesn''t match any invite.';
  elsif inv.used then
    raise exception 'That code has already been used.';
  elsif inv.expires_at < now() then
    raise exception 'That code has expired. Ask an admin to send a new one.';
  end if;

  perform set_config('app.bypass_role_check', 'on', true); -- local to this transaction only
  update profiles set role = inv.role, phone = coalesce(profiles.phone, inv.phone) where id = auth.uid();

  update invite_codes set used = true, used_by = auth.uid(), used_at = now() where id = inv.id;

  return query select inv.role;
end;
$$;

grant execute on function validate_invite_code(text) to anon, authenticated;
grant execute on function redeem_invite_code(text) to authenticated;

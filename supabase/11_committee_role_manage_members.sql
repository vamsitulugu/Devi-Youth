-- ---------- open committee-member management to the "committee" role ----------
-- Previously only admins could add/edit committee members (insert/update),
-- even though the storage bucket already allowed committee uploads. The app
-- now lets committee-role users manage the committee list too (adding
-- photos + names), so widen these two policies to match. Deleting a member
-- stays admin-only, same as other destructive actions in this app.

drop policy if exists "committee: admin write" on committee_members;
drop policy if exists "committee: admin update" on committee_members;

create policy "committee: committee/admin write" on committee_members
  for insert with check (is_committee_or_admin());

create policy "committee: committee/admin update" on committee_members
  for update using (is_committee_or_admin());

-- "committee: admin delete" is left untouched — deletion remains admin-only.

import { useEffect, useState } from 'react';
import { Plus, Star, Trash2, X, LogOut, Pencil, Send, Copy } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { Field, Input, Select, FormGrid } from '../../components/admin/FormField';
import BilingualField from '../../components/admin/BilingualField';
import { useToast } from '../../components/admin/Toast';
import { useAuth } from '../../auth/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import { useCloseOnBack } from '../../hooks/useCloseOnBack';
import { upsertFestival, setActiveFestival, deleteFestival, listProfiles, updateProfileRole, updateProfileDetails, uploadImage, publicUrl } from '../../services/adminApi';
import { listInviteCodes, createInviteCode, revokeInviteCode, buildWhatsAppInviteLink } from '../../services/inviteApi';
import { PageSkeleton } from '../../components/LoadingStates';

const blankFestival = {
  year: new Date().getFullYear(),
  name_en: 'Sree Bala Ganesh', name_te: '', name_source_lang: 'en',
  village_en: '', village_te: '', village_source_lang: null,
  start_date: '', end_date: '', public_donation_total: '', photo_url: '',
};

export default function Settings() {
  const toast = useToast();
  const { user, profile, isAdmin, signOut, refreshProfile } = useAuth();
  const { festivals, reload: reloadFestivals, loading: festivalsLoading } = useActiveFestival();
  const [adding, setAdding] = useState(false);
  useCloseOnBack(adding, () => closeForm());
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankFestival);
  const [festivalPhotoFile, setFestivalPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(true);

  function reloadProfiles() {
    return listProfiles().then(setProfiles).catch((err) => toast(err.message, 'error'));
  }

  useEffect(() => {
    if (!isAdmin) return;
    setProfilesLoading(true);
    reloadProfiles().finally(() => setProfilesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  function startAdd() {
    setEditingId(null);
    setForm(blankFestival);
    setFestivalPhotoFile(null);
    setAdding(true);
  }

  function startEdit(f) {
    setEditingId(f.id);
    setForm({
      year: f.year,
      name_en: f.name_en || '', name_te: f.name_te || '', name_source_lang: f.name_source_lang || 'en',
      village_en: f.village_en || '', village_te: f.village_te || '', village_source_lang: f.village_source_lang || null,
      start_date: f.start_date || '', end_date: f.end_date || '',
      public_donation_total: f.public_donation_total ?? '', photo_url: f.photo_url || '',
    });
    setFestivalPhotoFile(null);
    setAdding(true);
  }

  function closeForm() {
    setAdding(false);
    setEditingId(null);
    setForm(blankFestival);
    setFestivalPhotoFile(null);
  }

  async function handleSaveFestival(e) {
    e.preventDefault();
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      toast('Start date must be before end date', 'error');
      return;
    }
    // Creating a new year that already exists would hit the database's
    // unique constraint on `year` — catch it here with a clear message
    // instead of surfacing the raw Postgres error.
    const yearNum = Number(form.year);
    const clashing = festivals.find((f) => f.year === yearNum && f.id !== editingId);
    if (clashing) {
      toast(`Festival year ${yearNum} already exists. Edit that one instead of creating a new one.`, 'error');
      return;
    }
    setSaving(true);
    try {
      let photo_url = form.photo_url;
      if (festivalPhotoFile) {
        const path = `festivals/${yearNum}-${Date.now()}-${festivalPhotoFile.name}`;
        photo_url = await uploadImage(festivalPhotoFile, path);
      }
      await upsertFestival({ ...form, year: yearNum, photo_url, ...(editingId ? { id: editingId } : {}) });
      toast(editingId ? 'Festival year updated' : 'Festival year saved');
      closeForm();
      await reloadFestivals();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetActive(id) {
    try {
      await setActiveFestival(id);
      toast('Active festival year updated');
      await reloadFestivals();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function handleDeleteFestival() {
    try {
      await deleteFestival(toDelete.id);
      toast('Festival year deleted');
      setToDelete(null);
      await reloadFestivals();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const [pendingRoleChange, setPendingRoleChange] = useState(null); // { profile, role }

  function requestRoleChange(targetProfile, role) {
    if (targetProfile.role === role) return;
    // Guard against the one mistake that's genuinely hard to undo:
    // demoting the only admin locks everyone (including you) out of
    // Settings, since only an admin can promote anyone back.
    const otherAdmins = profiles.filter((p) => p.role === 'admin' && p.id !== targetProfile.id);
    if (targetProfile.role === 'admin' && role !== 'admin' && otherAdmins.length === 0) {
      toast('This is the only admin account — promote someone else to admin first.', 'error');
      return;
    }
    setPendingRoleChange({ profile: targetProfile, role });
  }

  async function handleRoleChange(profile, role) {
    try {
      await updateProfileRole(profile.id, role);
      setProfiles((ps) => ps.map((p) => (p.id === profile.id ? { ...p, role } : p)));
      toast(`${profile.full_name || 'User'} is now ${role}`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setPendingRoleChange(null);
    }
  }

  // Editing your own display name is always allowed (each person owns
  // their own row). Editing anyone ELSE's name from this screen was
  // removed — only the account holder should be able to change it.
  const [myName, setMyName] = useState(profile?.full_name || '');
  useEffect(() => setMyName(profile?.full_name || ''), [profile?.full_name]);
  const [savingName, setSavingName] = useState(false);
  async function handleSaveMyName() {
    const full_name = myName.trim();
    if (full_name === (profile?.full_name || '')) return;
    setSavingName(true);
    try {
      await updateProfileDetails(user.id, { full_name, phone: profile?.phone || null });
      await refreshProfile();
      toast('Name updated');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSavingName(false);
    }
  }

  // ---------- invite codes (admin only) ----------
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState('committee');
  const [creatingInvite, setCreatingInvite] = useState(false);

  function reloadInvites() {
    return listInviteCodes().then(setInvites).catch((err) => toast(err.message, 'error'));
  }

  useEffect(() => {
    if (!isAdmin) return;
    setInvitesLoading(true);
    reloadInvites().finally(() => setInvitesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Live sync: the moment someone redeems an invite code (joins from
  // their own phone), both lists below update on their own here — no
  // reload, no "Refresh" button, no waiting for the admin to reopen
  // the page. Mirrors the same pattern already used on Money Dashboard.
  useEffect(() => {
    if (!isSupabaseConfigured || !isAdmin) return;
    const channel = supabase
      .channel('settings-users-invites')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invite_codes' }, reloadInvites)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, reloadProfiles)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function handleCreateInvite(e) {
    e.preventDefault();
    const digits = invitePhone.replace(/[^\d]/g, '');
    if (digits.length < 10) {
      toast('Enter a full phone number with country code (at least 10 digits).', 'error');
      return;
    }
    setCreatingInvite(true);
    try {
      const invite = await createInviteCode(invitePhone.trim(), inviteRole);
      setInvites((list) => [invite, ...list]);
      setInvitePhone('');
      window.open(buildWhatsAppInviteLink(invite.phone, invite.code), '_blank', 'noopener');
      toast(`Invite code ${invite.code} created`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setCreatingInvite(false);
    }
  }

  const [toRevoke, setToRevoke] = useState(null);
  async function handleRevokeInvite() {
    const id = toRevoke.id;
    try {
      await revokeInviteCode(id);
      setInvites((list) => list.filter((i) => i.id !== id));
      toast('Invite code revoked');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setToRevoke(null);
    }
  }

  function handleCopyInviteLink(invite) {
    navigator.clipboard?.writeText(buildWhatsAppInviteLink(invite.phone, invite.code));
    toast('WhatsApp link copied');
  }

  return (
    <>
      <AdminHeader title="Settings" />
      <div className="page">
        <div>
          <div className="section-title"><h2>Festival Years</h2></div>
          {!isAdmin && !festivalsLoading && festivals.length === 0 && (
            <div className="card card-pad empty-state" style={{ marginBottom: 10 }}>
              No festival year has been created yet, and only an admin
              account can create one. If you're setting this up for the
              first time, promote your account to admin directly in the
              Supabase table editor (<code>profiles.role = 'admin'</code>),
              then refresh this page.
            </div>
          )}
          {festivalsLoading && <PageSkeleton rows={2} />}
          {!festivalsLoading && festivals.map((f) => (
            <div key={f.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              {f.photo_url && (
                <img
                  src={publicUrl(f.photo_url)}
                  alt=""
                  style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div className="title">{f.year} — {f.name_en || f.name_te}</div>
                <div className="meta">{f.start_date} to {f.end_date}</div>
              </div>
              {f.is_active ? (
                <span className="chip chip-leaf"><Star size={12} /> Active</span>
              ) : (
                isAdmin && (
                  <button className="btn btn-outline btn-sm" onClick={() => handleSetActive(f.id)}>Make Active</button>
                )
              )}
              {isAdmin && (
                <button className="icon-btn" onClick={() => startEdit(f)} aria-label="Edit year"><Pencil size={16} /></button>
              )}
              {isAdmin && (
                <button className="icon-btn" onClick={() => setToDelete(f)} aria-label="Delete year"><Trash2 size={16} color="var(--color-danger)" /></button>
              )}
            </div>
          ))}

          {isAdmin && !adding && (
            <button className="btn btn-primary btn-block" onClick={startAdd}>
              <Plus size={16} /> New Festival Year
            </button>
          )}

          {isAdmin && adding && (
            <form className="card card-pad" onSubmit={handleSaveFestival}>
              <FormGrid>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{editingId ? 'Edit Festival Year' : 'New Festival Year'}</strong>
                  <button type="button" onClick={closeForm} aria-label="Close"><X size={18} /></button>
                </div>
                <Field label="Year">
                  <Input required type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} disabled={!!editingId} />
                </Field>
                <BilingualField label="Festival Name" baseName="name" form={form} setForm={setForm} required />
                <BilingualField label="Village" baseName="village" form={form} setForm={setForm} required />
                <div style={{ display: 'flex', gap: 10 }}>
                  <Field label="Start Date">
                    <Input required type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                  </Field>
                  <Field label="End Date">
                    <Input required type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                  </Field>
                </div>
                <Field label="Public Donation Total" hint="Shown to villagers on the Home page, if set">
                  <Input placeholder="₹8,50,000" value={form.public_donation_total} onChange={(e) => setForm({ ...form, public_donation_total: e.target.value })} />
                </Field>
                <Field label="Cover Photo" hint="Shown behind the festival card on the villager Home page">
                  <Input type="file" accept="image/*" onChange={(e) => setFestivalPhotoFile(e.target.files?.[0] || null)} />
                  {!festivalPhotoFile && form.photo_url && (
                    <img
                      src={publicUrl(form.photo_url)}
                      alt=""
                      style={{ width: 64, height: 64, borderRadius: 'var(--radius-sm)', objectFit: 'cover', marginTop: 6 }}
                    />
                  )}
                </Field>
                <button className="btn btn-primary btn-block" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Festival Year'}
                </button>
              </FormGrid>
            </form>
          )}
        </div>

        <div>
          <div className="section-title"><h2>My Profile</h2></div>
          <div
            className="card card-pad"
            style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: profile?.full_name ? 10 : 4, flexWrap: 'wrap',
              ...(!profile?.full_name && { borderColor: 'var(--color-vermillion)' }),
            }}
          >
            <div style={{ flex: 1, minWidth: 160 }}>
              <Input
                value={myName}
                placeholder="Add your name…"
                onChange={(e) => setMyName(e.target.value)}
                onBlur={handleSaveMyName}
                disabled={savingName}
                style={{ minHeight: 36, padding: '6px 10px', fontWeight: 600 }}
              />
            </div>
            <span className="chip">{profile?.role || 'villager'}</span>
          </div>
          {!profile?.full_name && (
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-vermillion)', marginBottom: 10 }}>
              Add your name so the rest of the committee can tell it's you — it shows as "Unnamed User" to admins until you do.
            </p>
          )}
        </div>

        {isAdmin && (
          <div>
            <div className="section-title"><h2>Invite Committee Members</h2></div>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)', marginTop: -4, marginBottom: 10 }}>
              Pick a role, send the code over WhatsApp — no email, no server secrets. They set their own name, email &amp; password when they join.
            </p>
            <form className="card card-pad" onSubmit={handleCreateInvite} style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <Field
                label="Phone Number"
                hint={
                  invitePhone && invitePhone.replace(/[^\d]/g, '').length < 10
                    ? 'Looks too short — include the country code.'
                    : 'With country code, e.g. +91…'
                }
              >
                <Input required value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)} placeholder="+91 98765 43210" style={{ minWidth: 180 }} />
              </Field>
              <Field label="Role">
                <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={{ width: 150 }}>
                  <option value="committee">Committee</option>
                  <option value="admin">Admin</option>
                  <option value="villager">Villager</option>
                </Select>
              </Field>
              <button className="btn btn-primary" disabled={creatingInvite}>
                <Send size={16} /> {creatingInvite ? 'Creating…' : 'Send Invite'}
              </button>
            </form>

            {invitesLoading && <PageSkeleton rows={2} />}
            {!invitesLoading && invites.length === 0 && <div className="card empty-state">No invite codes yet.</div>}
            {!invitesLoading && invites.map((inv) => (
              <div key={inv.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div className="title" style={{ letterSpacing: 1 }}>{inv.code}</div>
                  <div className="meta">{inv.phone} · {inv.role}</div>
                </div>
                {inv.used ? (
                  <span className="chip chip-leaf">Joined</span>
                ) : new Date(inv.expires_at) < new Date() ? (
                  <span className="chip">Expired</span>
                ) : (
                  <span className="chip">Pending</span>
                )}
                {!inv.used && (
                  <>
                    <button type="button" className="icon-btn" onClick={() => handleCopyInviteLink(inv)} aria-label="Copy WhatsApp link"><Copy size={16} /></button>
                    <button type="button" className="icon-btn" onClick={() => setToRevoke(inv)} aria-label="Revoke invite"><Trash2 size={16} color="var(--color-danger)" /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {isAdmin && (
          <div>
            <div className="section-title"><h2>Users &amp; Roles</h2></div>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)', marginTop: -4, marginBottom: 10 }}>
              Only admins can see this section or change anyone's role — enforced by the database, not just this screen. Names can only be changed by each person, on their own device, above.
            </p>
            {profilesLoading && <PageSkeleton rows={2} />}
            {!profilesLoading && profiles.length === 0 && <div className="card empty-state">No signed-up users yet.</div>}
            {!profilesLoading && profiles.map((p) => (
              <div key={p.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div className="title">{p.full_name || 'Unnamed User'}</div>
                  <div className="meta">{p.phone || '—'}</div>
                </div>
                <Select value={p.role} onChange={(e) => requestRoleChange(p, e.target.value)} style={{ width: 130 }}>
                  <option value="villager">Villager</option>
                  <option value="committee">Committee</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>
            ))}
          </div>
        )}

        <button className="btn btn-outline btn-block" onClick={signOut}>
          <LogOut size={16} /> Log Out
        </button>
      </div>
      <ConfirmDialog
        open={!!toDelete}
        title="Delete this festival year?"
        message="All its announcements, events, donations, expenses, and photos will be permanently deleted."
        onConfirm={handleDeleteFestival}
        onCancel={() => setToDelete(null)}
      />
      <ConfirmDialog
        open={!!pendingRoleChange}
        danger={false}
        title="Change this person's role?"
        message={pendingRoleChange ? `${pendingRoleChange.profile.full_name || 'This user'} will become ${pendingRoleChange.role} and their access will change immediately.` : ''}
        confirmLabel="Change Role"
        onConfirm={() => handleRoleChange(pendingRoleChange.profile, pendingRoleChange.role)}
        onCancel={() => setPendingRoleChange(null)}
      />
      <ConfirmDialog
        open={!!toRevoke}
        title="Revoke this invite code?"
        message={toRevoke ? `${toRevoke.code} for ${toRevoke.phone} will stop working. You can send a new one anytime.` : ''}
        confirmLabel="Revoke"
        onConfirm={handleRevokeInvite}
        onCancel={() => setToRevoke(null)}
      />
    </>
  );
}
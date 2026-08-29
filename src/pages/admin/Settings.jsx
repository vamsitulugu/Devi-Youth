import { useEffect, useState } from 'react';
import { Plus, Star, Trash2, X, LogOut, Pencil } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { Field, Input, Select, FormGrid } from '../../components/admin/FormField';
import BilingualField from '../../components/admin/BilingualField';
import { useToast } from '../../components/admin/Toast';
import { useAuth } from '../../auth/AuthContext';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import { upsertFestival, setActiveFestival, deleteFestival, listProfiles, updateProfileRole, updateProfileDetails } from '../../services/adminApi';
import { PageSkeleton } from '../../components/LoadingStates';

const blankFestival = {
  year: new Date().getFullYear(),
  name_en: 'Devi Youth Sree Bala Ganesh Puja', name_te: '', name_source_lang: 'en',
  village_en: '', village_te: '', village_source_lang: null,
  start_date: '', end_date: '', public_donation_total: '',
};

export default function Settings() {
  const toast = useToast();
  const { isAdmin, signOut } = useAuth();
  const { festivals, reload: reloadFestivals, loading: festivalsLoading } = useActiveFestival();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankFestival);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    setProfilesLoading(true);
    listProfiles()
      .then(setProfiles)
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setProfilesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  function startAdd() {
    setEditingId(null);
    setForm(blankFestival);
    setAdding(true);
  }

  function startEdit(f) {
    setEditingId(f.id);
    setForm({
      year: f.year,
      name_en: f.name_en || '', name_te: f.name_te || '', name_source_lang: f.name_source_lang || 'en',
      village_en: f.village_en || '', village_te: f.village_te || '', village_source_lang: f.village_source_lang || null,
      start_date: f.start_date || '', end_date: f.end_date || '',
      public_donation_total: f.public_donation_total ?? '',
    });
    setAdding(true);
  }

  function closeForm() {
    setAdding(false);
    setEditingId(null);
    setForm(blankFestival);
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
      await upsertFestival({ ...form, year: yearNum, ...(editingId ? { id: editingId } : {}) });
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

  async function handleRoleChange(profile, role) {
    try {
      await updateProfileRole(profile.id, role);
      setProfiles((ps) => ps.map((p) => (p.id === profile.id ? { ...p, role } : p)));
      toast(`${profile.full_name || 'User'} is now ${role}`);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const [nameDrafts, setNameDrafts] = useState({});
  function nameDraftFor(profile) {
    return nameDrafts[profile.id] ?? profile.full_name ?? '';
  }
  async function handleSaveName(profile) {
    const full_name = (nameDrafts[profile.id] ?? profile.full_name ?? '').trim();
    if (full_name === (profile.full_name || '')) return;
    try {
      await updateProfileDetails(profile.id, { full_name, phone: profile.phone || null });
      setProfiles((ps) => ps.map((p) => (p.id === profile.id ? { ...p, full_name } : p)));
      toast('Name updated');
    } catch (err) {
      toast(err.message, 'error');
    }
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
                <button className="btn btn-primary btn-block" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Festival Year'}
                </button>
              </FormGrid>
            </form>
          )}
        </div>

        {isAdmin && (
          <div>
            <div className="section-title"><h2>Users &amp; Roles</h2></div>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)', marginTop: -4, marginBottom: 10 }}>
              Only admins can see this section or change anyone's role — enforced by the database, not just this screen.
            </p>
            {profilesLoading && <PageSkeleton rows={2} />}
            {!profilesLoading && profiles.length === 0 && <div className="card empty-state">No signed-up users yet.</div>}
            {!profilesLoading && profiles.map((p) => (
              <div key={p.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <Input
                    value={nameDraftFor(p)}
                    placeholder="Add a name…"
                    onChange={(e) => setNameDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                    onBlur={() => handleSaveName(p)}
                    style={{ minHeight: 36, padding: '6px 10px', fontWeight: 600, marginBottom: 4 }}
                  />
                  <div className="meta">{p.phone || '—'}</div>
                </div>
                <Select value={p.role} onChange={(e) => handleRoleChange(p, e.target.value)} style={{ width: 130 }}>
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
    </>
  );
}
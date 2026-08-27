import { useEffect, useState } from 'react';
import { Plus, Star, Trash2, X, LogOut } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { Field, Input, Select, FormGrid } from '../../components/admin/FormField';
import { useToast } from '../../components/admin/Toast';
import { useAuth } from '../../auth/AuthContext';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import { upsertFestival, setActiveFestival, deleteFestival, listProfiles, updateProfileRole } from '../../services/adminApi';
import { PageSkeleton } from '../../components/LoadingStates';

const blankFestival = { year: new Date().getFullYear(), name_en: 'Grama Ganapati', name_te: '', village_en: '', village_te: '', start_date: '', end_date: '', public_donation_total: '' };

export default function Settings() {
  const toast = useToast();
  const { isAdmin, signOut } = useAuth();
  const { festivals, reload: reloadFestivals, loading: festivalsLoading } = useActiveFestival();
  const [adding, setAdding] = useState(false);
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

  async function handleSaveFestival(e) {
    e.preventDefault();
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      toast('Start date must be before end date', 'error');
      return;
    }
    setSaving(true);
    try {
      await upsertFestival({ ...form, year: Number(form.year) });
      toast('Festival year saved');
      setForm(blankFestival);
      setAdding(false);
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

  return (
    <>
      <AdminHeader title="Settings" />
      <div className="page">
        <div>
          <div className="section-title"><h2>Festival Years</h2></div>
          {festivalsLoading && <PageSkeleton rows={2} />}
          {!festivalsLoading && festivals.map((f) => (
            <div key={f.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div className="title">{f.year} — {f.name_en}</div>
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
                <button className="icon-btn" onClick={() => setToDelete(f)} aria-label="Delete year"><Trash2 size={16} color="var(--color-danger)" /></button>
              )}
            </div>
          ))}

          {isAdmin && !adding && (
            <button className="btn btn-primary btn-block" onClick={() => setAdding(true)}>
              <Plus size={16} /> New Festival Year
            </button>
          )}

          {isAdmin && adding && (
            <form className="card card-pad" onSubmit={handleSaveFestival}>
              <FormGrid>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>New Festival Year</strong>
                  <button type="button" onClick={() => setAdding(false)} aria-label="Close"><X size={18} /></button>
                </div>
                <Field label="Year">
                  <Input required type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                </Field>
                <Field label="Festival Name (English)">
                  <Input required value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
                </Field>
                <Field label="Festival Name (Telugu)">
                  <Input required value={form.name_te} onChange={(e) => setForm({ ...form, name_te: e.target.value })} />
                </Field>
                <Field label="Village (English)">
                  <Input required value={form.village_en} onChange={(e) => setForm({ ...form, village_en: e.target.value })} />
                </Field>
                <Field label="Village (Telugu)">
                  <Input required value={form.village_te} onChange={(e) => setForm({ ...form, village_te: e.target.value })} />
                </Field>
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
                  {saving ? 'Saving…' : 'Create Festival Year'}
                </button>
              </FormGrid>
            </form>
          )}
        </div>

        {isAdmin && (
          <div>
            <div className="section-title"><h2>Users &amp; Roles</h2></div>
            {profilesLoading && <PageSkeleton rows={2} />}
            {!profilesLoading && profiles.length === 0 && <div className="card empty-state">No signed-up users yet.</div>}
            {!profilesLoading && profiles.map((p) => (
              <div key={p.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="title">{p.full_name || 'Unnamed User'}</div>
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

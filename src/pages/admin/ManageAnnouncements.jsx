import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import FestivalBanner from '../../components/admin/FestivalBanner';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { Field, Input, Textarea, FormGrid } from '../../components/admin/FormField';
import { useToast } from '../../components/admin/Toast';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import { announcementsApi, uploadImage, publicUrl } from '../../services/adminApi';
import { PageSkeleton, PageError } from '../../components/LoadingStates';

const blank = { title_en: '', title_te: '', body_en: '', body_te: '', important: false, image_url: '' };

export default function ManageAnnouncements() {
  const toast = useToast();
  const { festival, festivalId, loading: festivalLoading } = useActiveFestival();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // null=closed, {} = new, obj = edit
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  async function reload() {
    if (festivalLoading) return;
    if (!festivalId) { setItems([]); setError(null); setLoading(false); return; }
    setLoading(true);
    try {
      setItems(await announcementsApi.list(festivalId));
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [festivalId, festivalLoading]);

  function openNew() {
    setForm(blank);
    setFile(null);
    setEditing({});
  }
  function openEdit(item) {
    setForm({
      title_en: item.title_en, title_te: item.title_te,
      body_en: item.body_en, body_te: item.body_te,
      important: item.important, image_url: item.image_url || '',
    });
    setFile(null);
    setEditing(item);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      let image_url = form.image_url;
      if (file) {
        const path = `${festival.year}/announcements/${Date.now()}-${file.name}`;
        image_url = await uploadImage(file, path);
      }
      const payload = { ...form, image_url, festival_id: festivalId };
      if (editing?.id) {
        await announcementsApi.update(editing.id, payload);
        toast('Announcement updated');
      } else {
        await announcementsApi.add(payload);
        toast('Announcement added');
      }
      setEditing(null);
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await announcementsApi.remove(toDelete.id);
      toast('Announcement deleted');
      setToDelete(null);
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <>
      <AdminHeader title="Announcements" showBack />
      <div className="page">
        <FestivalBanner festival={festival} />

        {!editing && (
          <button className="btn btn-primary btn-block" onClick={openNew} disabled={!festivalId}>
            <Plus size={16} /> Add Announcement
          </button>
        )}

        {editing && (
          <form className="card card-pad" onSubmit={handleSave}>
            <FormGrid>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{editing.id ? 'Edit' : 'New'} Announcement</strong>
                <button type="button" onClick={() => setEditing(null)} aria-label="Close"><X size={18} /></button>
              </div>
              <Field label="Title (English)">
                <Input required value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
              </Field>
              <Field label="Title (Telugu)">
                <Input required value={form.title_te} onChange={(e) => setForm({ ...form, title_te: e.target.value })} />
              </Field>
              <Field label="Message (English)">
                <Textarea required value={form.body_en} onChange={(e) => setForm({ ...form, body_en: e.target.value })} />
              </Field>
              <Field label="Message (Telugu)">
                <Textarea required value={form.body_te} onChange={(e) => setForm({ ...form, body_te: e.target.value })} />
              </Field>
              <Field label="Photo (optional)">
                <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-sm)' }}>
                <input
                  type="checkbox"
                  checked={form.important}
                  onChange={(e) => setForm({ ...form, important: e.target.checked })}
                />
                Mark as important
              </label>
              <button className="btn btn-primary btn-block" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </FormGrid>
          </form>
        )}

        {loading && <PageSkeleton />}
        {!loading && error && <PageError />}
        {!loading && !error && items.length === 0 && (
          <div className="card empty-state">No announcements yet.</div>
        )}
        {!loading && !error && items.map((a) => (
          <div key={a.id} className="card card-pad" style={{ display: 'flex', gap: 12 }}>
            {a.image_url && (
              <img src={publicUrl(a.image_url)} alt="" className="thumb" loading="lazy" decoding="async" style={{ width: 56, height: 56 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              {a.important && <span className="chip chip-danger" style={{ marginBottom: 4 }}>Important</span>}
              <div className="title">{a.title_en}</div>
              <div className="desc" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.body_en}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="icon-btn" onClick={() => openEdit(a)} aria-label="Edit"><Pencil size={16} /></button>
              <button className="icon-btn" onClick={() => setToDelete(a)} aria-label="Delete"><Trash2 size={16} color="var(--color-danger)" /></button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={!!toDelete}
        message={`Delete "${toDelete?.title_en}"? This can't be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import FestivalBanner from '../../components/admin/FestivalBanner';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { Field, Input, FormGrid } from '../../components/admin/FormField';
import BilingualField from '../../components/admin/BilingualField';
import { useToast } from '../../components/admin/Toast';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import { committeeApi, uploadImage, publicUrl } from '../../services/adminApi';
import { PageSkeleton, PageError } from '../../components/LoadingStates';

const blank = { name: '', position_en: '', position_te: '', position_source_lang: null, phone: '', sort_order: 0, photo_url: '' };

export default function ManageCommittee() {
  const toast = useToast();
  const { festival, festivalId, loading: festivalLoading } = useActiveFestival();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  async function reload() {
    if (festivalLoading) return;
    if (!festivalId) { setItems([]); setError(null); setLoading(false); return; }
    setLoading(true);
    try {
      setItems(await committeeApi.list(festivalId));
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
      name: item.name, position_en: item.position_en, position_te: item.position_te, position_source_lang: item.position_source_lang,
      phone: item.phone || '', sort_order: item.sort_order || 0, photo_url: item.photo_url || '',
    });
    setFile(null);
    setEditing(item);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      let photo_url = form.photo_url;
      if (file) {
        const path = `committee/${Date.now()}-${file.name}`;
        photo_url = await uploadImage(file, path);
      }
      const payload = { ...form, photo_url, festival_id: festivalId, sort_order: Number(form.sort_order) || 0 };
      if (editing?.id) {
        await committeeApi.update(editing.id, payload);
        toast('Member updated');
      } else {
        await committeeApi.add(payload);
        toast('Member added');
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
      await committeeApi.remove(toDelete.id);
      toast('Member removed');
      setToDelete(null);
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <>
      <AdminHeader title="Committee" showBack />
      <div className="page">
        <FestivalBanner festival={festival} />

        {!editing && (
          <button className="btn btn-primary btn-block" onClick={openNew} disabled={!festivalId}>
            <Plus size={16} /> Add Member
          </button>
        )}

        {editing && (
          <form className="card card-pad" onSubmit={handleSave}>
            <FormGrid>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{editing.id ? 'Edit' : 'New'} Member</strong>
                <button type="button" onClick={() => setEditing(null)} aria-label="Close"><X size={18} /></button>
              </div>
              <Field label="Name">
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <BilingualField label="Position" baseName="position" form={form} setForm={setForm} required placeholder="President" />
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label="Photo">
                <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </Field>
              <Field label="Sort order">
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </Field>
              <button className="btn btn-primary btn-block" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </FormGrid>
          </form>
        )}

        {loading && <PageSkeleton />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && items.length === 0 && <div className="card empty-state">No committee members yet.</div>}
        {!loading && !error && items.map((m) => (
          <div key={m.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={publicUrl(m.photo_url) || undefined}
              alt=""
              className="thumb"
              loading="lazy"
              decoding="async"
              style={{ width: 48, height: 48, borderRadius: '50%' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="title">{m.name}</div>
              <div className="meta">{m.position_en || m.position_te}{m.phone ? ` · ${m.phone}` : ''}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="icon-btn" onClick={() => openEdit(m)} aria-label="Edit"><Pencil size={16} /></button>
              <button className="icon-btn" onClick={() => setToDelete(m)} aria-label="Delete"><Trash2 size={16} color="var(--color-danger)" /></button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={!!toDelete}
        message={`Remove "${toDelete?.name}" from the committee?`}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

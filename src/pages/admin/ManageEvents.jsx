import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, MapPin, Clock } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import FestivalBanner from '../../components/admin/FestivalBanner';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { Field, Input, FormGrid } from '../../components/admin/FormField';
import BilingualField from '../../components/admin/BilingualField';
import { useToast } from '../../components/admin/Toast';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import { eventsApi } from '../../services/adminApi';
import { PageSkeleton, PageError } from '../../components/LoadingStates';

const blank = {
  title_en: '', title_te: '', title_source_lang: null,
  description_en: '', description_te: '', description_source_lang: null,
  location_en: '', location_te: '', location_source_lang: null,
  event_date: '', event_time: '', sort_order: 0,
};

export default function ManageEvents() {
  const toast = useToast();
  const { festival, festivalId, loading: festivalLoading } = useActiveFestival();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  async function reload() {
    if (festivalLoading) return;
    if (!festivalId) { setItems([]); setError(null); setLoading(false); return; }
    setLoading(true);
    try {
      setItems(await eventsApi.list(festivalId));
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
    setEditing({});
  }
  function openEdit(item) {
    setForm({
      title_en: item.title_en, title_te: item.title_te, title_source_lang: item.title_source_lang,
      description_en: item.description_en || '', description_te: item.description_te || '', description_source_lang: item.description_source_lang,
      location_en: item.location_en || '', location_te: item.location_te || '', location_source_lang: item.location_source_lang,
      event_date: item.event_date || '', event_time: item.event_time || '',
      sort_order: item.sort_order || 0,
    });
    setEditing(item);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, festival_id: festivalId, sort_order: Number(form.sort_order) || 0 };
      if (editing?.id) {
        await eventsApi.update(editing.id, payload);
        toast('Event updated');
      } else {
        await eventsApi.add(payload);
        toast('Event added');
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
      await eventsApi.remove(toDelete.id);
      toast('Event deleted');
      setToDelete(null);
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <>
      <AdminHeader title="Events" showBack />
      <div className="page">
        <FestivalBanner festival={festival} />

        {!editing && (
          <button className="btn btn-primary btn-block" onClick={openNew} disabled={!festivalId}>
            <Plus size={16} /> Add Event
          </button>
        )}

        {editing && (
          <form className="card card-pad" onSubmit={handleSave}>
            <FormGrid>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{editing.id ? 'Edit' : 'New'} Event</strong>
                <button type="button" onClick={() => setEditing(null)} aria-label="Close"><X size={18} /></button>
              </div>
              <BilingualField label="Title" baseName="title" form={form} setForm={setForm} required />
              <div style={{ display: 'flex', gap: 10 }}>
                <Field label="Date">
                  <Input type="date" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                </Field>
                <Field label="Time">
                  <Input placeholder="6:00 PM" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} />
                </Field>
              </div>
              <BilingualField label="Location" baseName="location" form={form} setForm={setForm} />
              <BilingualField label="Description" baseName="description" form={form} setForm={setForm} multiline />
              <Field label="Sort order" hint="Lower numbers appear first on the same date">
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
        {!loading && !error && items.length === 0 && <div className="card empty-state">No events yet.</div>}
        {!loading && !error && items.map((ev) => (
          <div key={ev.id} className="card card-pad" style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="title">{ev.title_en || ev.title_te}</div>
              <div className="meta" style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <span><Clock size={12} style={{ verticalAlign: -2 }} /> {ev.event_date} {ev.event_time}</span>
              </div>
              {(ev.location_en || ev.location_te) && (
                <div className="meta" style={{ marginTop: 2 }}>
                  <MapPin size={12} style={{ verticalAlign: -2 }} /> {ev.location_en || ev.location_te}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="icon-btn" onClick={() => openEdit(ev)} aria-label="Edit"><Pencil size={16} /></button>
              <button className="icon-btn" onClick={() => setToDelete(ev)} aria-label="Delete"><Trash2 size={16} color="var(--color-danger)" /></button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={!!toDelete}
        message={`Delete "${toDelete?.title_en || toDelete?.title_te}"? This can't be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { Field, Input, FormGrid } from '../../components/admin/FormField';
import BilingualField from '../../components/admin/BilingualField';
import { useToast } from '../../components/admin/Toast';
import { contactsApi } from '../../services/adminApi';
import { useCloseOnBack } from '../../hooks/useCloseOnBack';
import { PageSkeleton, PageError } from '../../components/LoadingStates';
import SwipeRow from '../../components/SwipeRow';
import Reveal from '../../components/Reveal';

const blank = { name: '', role_en: '', role_te: '', role_source_lang: null, phone: '', sort_order: 0 };

export default function ManageContacts() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  useCloseOnBack(!!editing, () => setEditing(null));
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [q, setQ] = useState('');

  async function reload() {
    setLoading(true);
    try {
      setItems(await contactsApi.list());
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((c) => (c.name || '').toLowerCase().includes(needle) || (c.phone || '').includes(needle));
  }, [items, q]);

  function openNew() {
    setForm(blank);
    setEditing({});
  }
  function openEdit(item) {
    setForm({ name: item.name, role_en: item.role_en, role_te: item.role_te, role_source_lang: item.role_source_lang, phone: item.phone, sort_order: item.sort_order || 0 });
    setEditing(item);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, sort_order: Number(form.sort_order) || 0 };
      if (editing?.id) {
        await contactsApi.update(editing.id, payload);
        toast('Contact updated');
      } else {
        await contactsApi.add(payload);
        toast('Contact added');
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
      await contactsApi.remove(toDelete.id);
      toast('Contact removed');
      setToDelete(null);
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <>
      <AdminHeader title="Contacts" showBack />
      <div className="page">
        {!editing && (
          <button className="btn btn-primary btn-block" onClick={openNew}>
            <Plus size={16} /> Add Contact
          </button>
        )}

        {editing && (
          <form className="card card-pad" onSubmit={handleSave}>
            <FormGrid>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{editing.id ? 'Edit' : 'New'} Contact</strong>
                <button type="button" onClick={() => setEditing(null)} aria-label="Close"><X size={18} /></button>
              </div>
              <Field label="Name">
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <BilingualField label="Role" baseName="role" form={form} setForm={setForm} required />
              <Field label="Phone">
                <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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

        {!editing && items.length > 6 && (
          <div className="search-bar" style={{ margin: 0 }}>
            <Search size={16} strokeWidth={2.4} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contacts…" />
          </div>
        )}

        {loading && <PageSkeleton />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && items.length === 0 && <div className="card empty-state">No contacts yet.</div>}
        {!loading && !error && filtered.map((c, i) => (
          <Reveal key={c.id} delay={Math.min(i, 8) * 30} as="div">
            <SwipeRow onEdit={() => openEdit(c)} onDelete={() => setToDelete(c)}>
              <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="title">{c.name}</div>
                  <div className="meta">{c.role_en || c.role_te} · {c.phone}</div>
                </div>
              </div>
            </SwipeRow>
          </Reveal>
        ))}
      </div>
      <ConfirmDialog
        open={!!toDelete}
        message={`Remove "${toDelete?.name}" from contacts?`}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

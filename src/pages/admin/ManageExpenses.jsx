import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import FestivalBanner from '../../components/admin/FestivalBanner';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { Field, Input, Select, Textarea, FormGrid } from '../../components/admin/FormField';
import { useToast } from '../../components/admin/Toast';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import { expensesApi } from '../../services/adminApi';
import { PageSkeleton, PageError } from '../../components/LoadingStates';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const categories = ['Decoration', 'Lighting', 'Sound', 'Food', 'Idol', 'Transport', 'Prasadam', 'Programs', 'Other'];
const blank = { name: '', category: 'Decoration', amount: '', expense_date: new Date().toISOString().slice(0, 10), notes: '' };

export default function ManageExpenses() {
  const toast = useToast();
  const { festival, festivalId, loading: festivalLoading } = useActiveFestival();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  async function reload() {
    if (festivalLoading) return;
    if (!festivalId) { setItems([]); setError(null); setLoading(false); return; }
    setLoading(true);
    try {
      setItems(await expensesApi.list(festivalId));
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

  const total = useMemo(() => items.reduce((s, e) => s + Number(e.amount || 0), 0), [items]);

  async function handleSave(e) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      toast('Enter an amount greater than ₹0', 'error');
      return;
    }
    setSaving(true);
    try {
      await expensesApi.add({ ...form, amount, festival_id: festivalId });
      toast('Expense recorded');
      setForm(blank);
      setAdding(false);
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await expensesApi.remove(toDelete.id);
      toast('Expense deleted');
      setToDelete(null);
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <>
      <AdminHeader title="Expenses" showBack />
      <div className="page">
        <FestivalBanner festival={festival} />

        <div className="card card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)' }}>Total this year</div>
            <div style={{ fontWeight: 700, fontSize: 'var(--fs-lg)' }}>{inr(total)}</div>
          </div>
          {!adding && (
            <button className="btn btn-primary" onClick={() => setAdding(true)} disabled={!festivalId}>
              <Plus size={16} /> Add
            </button>
          )}
        </div>

        {adding && (
          <form className="card card-pad" onSubmit={handleSave}>
            <FormGrid>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>New Expense</strong>
                <button type="button" onClick={() => setAdding(false)} aria-label="Close"><X size={18} /></button>
              </div>
              <Field label="Expense Name">
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Category">
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Amount (₹)">
                <Input required type="number" min="1" step="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </Field>
              <Field label="Date">
                <Input type="date" required value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
              </Field>
              <Field label="Notes">
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Field>
              <button className="btn btn-primary btn-block" disabled={saving}>
                {saving ? 'Saving…' : 'Save Expense'}
              </button>
            </FormGrid>
          </form>
        )}

        {loading && <PageSkeleton />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && items.length === 0 && <div className="card empty-state">No expenses recorded.</div>}
        {!loading && !error && items.map((e) => (
          <div key={e.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="title">{e.name}</div>
              <div className="meta"><span className="chip">{e.category}</span> {e.expense_date}</div>
            </div>
            <div style={{ fontWeight: 700 }}>{inr(e.amount)}</div>
            <button className="icon-btn" onClick={() => setToDelete(e)} aria-label="Delete"><Trash2 size={16} color="var(--color-danger)" /></button>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={!!toDelete}
        message={`Delete expense "${toDelete?.name}" (${inr(toDelete?.amount)})?`}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

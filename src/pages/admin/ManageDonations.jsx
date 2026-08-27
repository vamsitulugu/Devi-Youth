import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2, X, History } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import FestivalBanner from '../../components/admin/FestivalBanner';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import { Field, Input, Select, Textarea, FormGrid } from '../../components/admin/FormField';
import { useToast } from '../../components/admin/Toast';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import { donationsApi, getDonorHistory } from '../../services/adminApi';
import { PageSkeleton, PageError } from '../../components/LoadingStates';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const blank = { donor_name: '', amount: '', donation_date: new Date().toISOString().slice(0, 10), payment_method: 'Cash', collector: '', notes: '' };

export default function ManageDonations() {
  const toast = useToast();
  const { festival, festivalId } = useActiveFestival();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
  const [history, setHistory] = useState([]);

  async function reload() {
    if (!festivalId) return;
    setLoading(true);
    try {
      setItems(await donationsApi.list(festivalId));
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
  }, [festivalId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter((d) => d.donor_name.toLowerCase().includes(q));
  }, [items, search]);

  const total = useMemo(() => filtered.reduce((s, d) => s + Number(d.amount || 0), 0), [filtered]);

  async function handleSave(e) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      toast('Enter an amount greater than ₹0', 'error');
      return;
    }
    setSaving(true);
    try {
      await donationsApi.add({ ...form, amount, festival_id: festivalId });
      toast('Donation recorded');
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
      await donationsApi.remove(toDelete.id);
      toast('Donation deleted');
      setToDelete(null);
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function openHistory(donorName) {
    setHistoryFor(donorName);
    try {
      setHistory(await getDonorHistory(donorName));
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <>
      <AdminHeader title="Donations" showBack />
      <div className="page">
        <FestivalBanner festival={festival} />
        <div className="chip chip-danger" style={{ alignSelf: 'flex-start' }}>Private — villagers never see this</div>

        <div className="card card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)' }}>{search ? 'Matching total' : 'Total this year'}</div>
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
                <strong>New Donation</strong>
                <button type="button" onClick={() => setAdding(false)} aria-label="Close"><X size={18} /></button>
              </div>
              <Field label="Donor Name">
                <Input required value={form.donor_name} onChange={(e) => setForm({ ...form, donor_name: e.target.value })} />
              </Field>
              <Field label="Amount (₹)">
                <Input required type="number" min="1" step="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </Field>
              <Field label="Date">
                <Input type="date" required value={form.donation_date} onChange={(e) => setForm({ ...form, donation_date: e.target.value })} />
              </Field>
              <Field label="Payment Method">
                <Select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                  <option>Other</option>
                </Select>
              </Field>
              <Field label="Collector">
                <Input value={form.collector} onChange={(e) => setForm({ ...form, collector: e.target.value })} />
              </Field>
              <Field label="Notes">
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Field>
              <button className="btn btn-primary btn-block" disabled={saving}>
                {saving ? 'Saving…' : 'Save Donation'}
              </button>
            </FormGrid>
          </form>
        )}

        <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} color="var(--color-ink-soft)" />
          <input
            placeholder="Search donor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-body)' }}
          />
        </div>

        {loading && <PageSkeleton />}
        {!loading && error && <PageError />}
        {!loading && !error && filtered.length === 0 && <div className="card empty-state">No donations recorded.</div>}
        {!loading && !error && filtered.map((d) => (
          <div key={d.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="title">{d.donor_name}</div>
              <div className="meta">{d.donation_date} · {d.payment_method}{d.collector ? ` · ${d.collector}` : ''}</div>
            </div>
            <div style={{ fontWeight: 700 }}>{inr(d.amount)}</div>
            <button className="icon-btn" onClick={() => openHistory(d.donor_name)} aria-label="History"><History size={16} /></button>
            <button className="icon-btn" onClick={() => setToDelete(d)} aria-label="Delete"><Trash2 size={16} color="var(--color-danger)" /></button>
          </div>
        ))}
      </div>

      {historyFor && (
        <div className="lightbox" style={{ background: 'rgba(20,10,5,0.55)' }} onClick={() => setHistoryFor(null)}>
          <div className="card card-pad" style={{ width: 'min(92vw, 400px)', maxHeight: '70vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <strong>{historyFor}</strong>
              <button onClick={() => setHistoryFor(null)} aria-label="Close"><X size={18} /></button>
            </div>
            {history.map((h) => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--color-border)' }}>
                <span>{h.festivals?.year} — {h.donation_date}</span>
                <strong>{inr(h.amount)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        message={`Delete donation from "${toDelete?.donor_name}" (${inr(toDelete?.amount)})?`}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

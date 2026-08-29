import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, X, WifiOff, AlertTriangle, History } from 'lucide-react';
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

// ---------- crash / refresh / lost-connection safety net ----------
// Same reasoning as ManageDonations.jsx: this is money, so a half-typed
// expense is mirrored to localStorage as it's typed, and every save is
// idempotent so a dropped response + retry can never double-record it.
const DRAFT_KEY = 'expense_draft_v1';

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.form) return null;
    return parsed;
  } catch {
    return null; // corrupted draft should never crash the page
  }
}

function saveDraft(festivalId, form, clientId) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ festivalId, form, clientId, savedAt: Date.now() }));
  } catch {
    // Storage full/unavailable — non-fatal, form still works in-memory.
  }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

function hasMeaningfulInput(form) {
  if (!form) return false;
  return !!(form.name?.trim() || form.amount);
}

function makeClientId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export default function ManageExpenses() {
  const toast = useToast();
  const { festival, festivalId, loading: festivalLoading } = useActiveFestival();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blank);
  const [clientId, setClientId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const savingRef = useRef(false); // guards against double-submit from a double-tap

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

  // Draft recovery: on first mount, offer to restore any half-typed
  // expense left over from a refresh/crash/closed tab.
  useEffect(() => {
    const draft = loadDraft();
    if (draft && hasMeaningfulInput(draft.form)) {
      setForm({ ...blank, ...draft.form });
      setClientId(draft.clientId || makeClientId());
      setAdding(true);
      setRestoredDraft(true);
    }
  }, []);

  // Mirror the form to localStorage while it's open.
  useEffect(() => {
    if (!adding) return;
    saveDraft(festivalId, form, clientId);
  }, [adding, form, clientId, festivalId]);

  // Warn before an accidental tab close/refresh with unsaved data.
  useEffect(() => {
    function beforeUnload(e) {
      if (adding && hasMeaningfulInput(form) && !saving) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [adding, form, saving]);

  // Track online/offline so Save can refuse a request that's guaranteed
  // to fail, instead of silently losing the attempt.
  useEffect(() => {
    function goOnline() { setOnline(true); }
    function goOffline() { setOnline(false); }
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const total = useMemo(() => items.reduce((s, e) => s + Number(e.amount || 0), 0), [items]);

  async function handleSave(e) {
    e.preventDefault();
    if (savingRef.current) return; // double-tap / double form-submit guard
    setSaveError(null);

    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      toast('Enter an amount greater than ₹0', 'error');
      return;
    }
    if (!online) {
      setSaveError("You're offline — this entry is saved on your device and will submit once you're back online.");
      return;
    }

    // Reusing the same client_id on every attempt (including retries)
    // means a dropped response followed by a retry can never create a
    // duplicate expense row — see expensesApi.add / 11_expense_reliability.sql.
    const id = clientId || makeClientId();
    if (!clientId) setClientId(id);

    savingRef.current = true;
    setSaving(true);
    try {
      await expensesApi.add({ ...form, amount, festival_id: festivalId, client_id: id });
      toast('Expense recorded');
      clearDraft();
      setForm(blank);
      setClientId(null);
      setAdding(false);
      setRestoredDraft(false);
      await reload();
    } catch (err) {
      // Do NOT clear the form or the draft here — the typed expense
      // stays exactly as entered so the person can just hit Save again;
      // reusing the same client_id makes that retry safe.
      const msg = err?.message || 'Something went wrong.';
      setSaveError(msg);
      toast(msg, 'error');
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  function closeAddForm() {
    if (hasMeaningfulInput(form) && !window.confirm('Discard this unsaved expense entry?')) {
      return;
    }
    clearDraft();
    setForm(blank);
    setClientId(null);
    setAdding(false);
    setSaveError(null);
    setRestoredDraft(false);
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
            <button className="btn btn-primary" onClick={() => { setForm(blank); setClientId(makeClientId()); setAdding(true); }} disabled={!festivalId}>
              <Plus size={16} /> Add
            </button>
          )}
        </div>

        {!online && (
          <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-warning-bg, #FFF6E5)', color: 'var(--color-warning-ink, #8A5A00)' }}>
            <WifiOff size={16} />
            <span style={{ fontSize: 'var(--fs-sm)' }}>
              You're offline. Anything you type stays safely on this device and nothing will be sent until your connection is back.
            </span>
          </div>
        )}

        {adding && (
          <form className="card card-pad" onSubmit={handleSave}>
            <FormGrid>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>New Expense</strong>
                <button type="button" onClick={closeAddForm} aria-label="Close"><X size={18} /></button>
              </div>
              {restoredDraft && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', color: 'var(--color-leaf-dark, #2F6B3E)' }}>
                  <History size={14} /> Recovered an unsaved entry from before — review and save, or discard it.
                </div>
              )}
              {saveError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', color: 'var(--color-danger)' }}>
                  <AlertTriangle size={14} /> {saveError}
                </div>
              )}
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
              <button className="btn btn-primary btn-block" disabled={saving || !online}>
                {saving ? 'Saving…' : (!online ? "Offline — can't save yet" : 'Save Expense')}
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
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, X, History, ListX, Send, WifiOff, AlertTriangle } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import FestivalBanner from '../../components/admin/FestivalBanner';
import DeleteDonationDialog from '../../components/admin/DeleteDonationDialog';
import { Field, Input, Select, Textarea, FormGrid } from '../../components/admin/FormField';
import { useToast } from '../../components/admin/Toast';
import { useAuth } from '../../auth/AuthContext';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import { useCloseOnBack } from '../../hooks/useCloseOnBack';
import { donationsApi, getDonorHistory, deleteDonationWithReason } from '../../services/adminApi';
import { openWhatsAppReceipt } from '../../lib/whatsappReceipt';
import { PageSkeleton, PageError } from '../../components/LoadingStates';
import { useLanguage } from '../../i18n/LanguageContext';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const todayIso = () => new Date().toISOString().slice(0, 10);
const blank = { donor_name: '', donor_phone: '', donor_village: '', amount: '', donation_date: todayIso(), payment_method: 'Cash', source: 'Other', collector: '', notes: '' };
const SOURCES = ['Shop', 'Society', 'Other'];

// ---------- crash / refresh / lost-connection safety net ----------
// Every keystroke in the "add donation" form is mirrored to localStorage.
// If the tab is refreshed, the app is closed, the phone locks, or the
// browser crashes mid-entry, the half-typed donation is recovered on
// next visit instead of silently vanishing — this is money, so nothing
// typed should ever be lost to an accidental refresh.
const DRAFT_KEY = 'donation_draft_v1';

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
    // Storage full/unavailable (private browsing etc.) — non-fatal, the
    // form still works in-memory for this session.
  }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

function hasMeaningfulInput(form) {
  if (!form) return false;
  return !!(form.donor_name?.trim() || form.donor_phone?.trim() || form.amount);
}

function makeClientId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export default function ManageDonations() {
  const { t } = useLanguage();
  const toast = useToast();
  const { profile } = useAuth();
  const { festival, festivalId, loading: festivalLoading } = useActiveFestival();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  useCloseOnBack(adding, () => setAdding(false));
  const [form, setForm] = useState(blank);
  const [clientId, setClientId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [historyFor, setHistoryFor] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const savingRef = useRef(false); // guards against double-submit from a double-tap

  // ---------- draft recovery: on first mount, offer to restore any
  // half-typed donation left over from a refresh/crash/closed tab ----------
  useEffect(() => {
    const draft = loadDraft();
    if (draft && hasMeaningfulInput(draft.form)) {
      setForm({ ...blank, ...draft.form });
      setClientId(draft.clientId || makeClientId());
      setAdding(true);
      setRestoredDraft(true);
    }
  }, []);

  // Keep the draft mirrored to localStorage while the form is open, so a
  // refresh mid-entry never loses what was typed.
  useEffect(() => {
    if (!adding) return;
    saveDraft(festivalId, form, clientId);
  }, [adding, form, clientId, festivalId]);

  // Warn before an accidental tab close/refresh while there's unsaved
  // donation data sitting in the form.
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

  // Track online/offline so the Save button can refuse to fire a request
  // that's guaranteed to fail, and instead tell the person plainly that
  // their entry is safe on-device but hasn't reached the server yet.
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

  async function reload() {
    if (festivalLoading) return;
    if (!festivalId) { setItems([]); setError(null); setLoading(false); return; }
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
  }, [festivalId, festivalLoading]);

  // Contacts-app-style search: type a few letters/digits and matching
  // rows filter live. Matches across name, village, phone and amount.
  // Each word in the query must match the *start* of some word in the
  // donor name/village (so "va" finds "Vamsi" and "Vasavi", but not
  // "Shivaji"), while phone/amount match anywhere in the digits (so "43"
  // finds a phone ending in ...43 or an amount of 4300).
  function wordStartMatch(text, token) {
    if (!text) return false;
    return text
      .toLowerCase()
      .split(/\s+/)
      .some((word) => word.startsWith(token));
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    const tokens = q.split(/\s+/).filter(Boolean);
    return items.filter((d) => {
      const amountStr = String(Math.round(Number(d.amount || 0)));
      return tokens.every((tok) =>
        wordStartMatch(d.donor_name, tok) ||
        wordStartMatch(d.donor_village, tok) ||
        (d.donor_phone || '').includes(tok) ||
        amountStr.includes(tok)
      );
    });
  }, [items, search]);

  const total = useMemo(() => filtered.reduce((s, d) => s + Number(d.amount || 0), 0), [filtered]);
  const todayTotal = useMemo(
    () => items.filter((d) => d.donation_date === todayIso()).reduce((s, d) => s + Number(d.amount || 0), 0),
    [items]
  );

  async function handleSave(e) {
    e.preventDefault();
    if (savingRef.current) return; // double-tap / double form-submit guard
    setSaveError(null);

    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      toast(t('admin_donations_amount_error'), 'error');
      return;
    }
    if (!online) {
      setSaveError(t('admin_donations_offline_error') || "You're offline — this entry is saved on your device and will submit once you're back online.");
      return;
    }

    // Every attempt (including retries) reuses the same client_id, so a
    // dropped response followed by a retry can never create a duplicate
    // donation row — see donationsApi.add / 10_donation_reliability.sql.
    const id = clientId || makeClientId();
    if (!clientId) setClientId(id);

    savingRef.current = true;
    setSaving(true);
    try {
      const saved = await donationsApi.add({ ...form, amount, festival_id: festivalId, client_id: id });
      toast(t('admin_donations_saved'));
      clearDraft();
      setForm(blank);
      setClientId(null);
      setAdding(false);
      setRestoredDraft(false);
      await reload();

      // Instant WhatsApp receipt: only when a phone number was given.
      // No phone -> logged silently, shows up later in "Pending sends"
      // with no phone (nothing to send to), same as before.
      if (saved?.donor_phone) {
        openWhatsAppReceipt({
          phone: saved.donor_phone,
          donorName: saved.donor_name,
          amount: saved.amount,
          festivalName: festival?.name_en,
          donationId: saved.id,
        });
        try {
          await donationsApi.update(saved.id, { receipt_sent: true, receipt_sent_at: new Date().toISOString() });
          await reload();
        } catch {
          // Non-fatal: the WhatsApp message already opened; if marking
          // "sent" fails it'll just also show up in Pending sends, where
          // re-sending is harmless.
        }
      }
    } catch (err) {
      // Deliberately do NOT clear the form or the draft here. The typed
      // donation stays exactly as entered (and stays mirrored in
      // localStorage) so the person can just hit Save again — reusing
      // the same client_id makes that retry safe even if the first
      // attempt actually reached the server.
      const msg = err?.message || 'Something went wrong.';
      setSaveError(msg);
      toast(msg, 'error');
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  function closeAddForm() {
    if (hasMeaningfulInput(form) && !window.confirm(t('admin_donations_discard_confirm') || 'Discard this unsaved donation entry?')) {
      return;
    }
    clearDraft();
    setForm(blank);
    setClientId(null);
    setAdding(false);
    setSaveError(null);
    setRestoredDraft(false);
  }

  // Deleting always requires a reason and the deleter's name (enforced
  // again at the database level) — the donation is archived into
  // Deleted Donations rather than simply removed. See
  // supabase/07_donation_deletion.sql and DeleteDonationDialog.
  async function handleDelete(reason, deletedByName) {
    try {
      await deleteDonationWithReason(toDelete.id, reason, deletedByName);
      toast(t('admin_donations_deleted'));
      setToDelete(null);
      await reload();
    } catch (err) {
      toast(err.message, 'error');
      throw err;
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
      <AdminHeader title={t('admin_donations_title')} showBack />
      <div className="page">
        <FestivalBanner festival={festival} />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <div className="chip chip-danger" style={{ flex: '1 1 100%' }}>{t('admin_money_private_note')}</div>
          <Link to="/admin/money/pending-sends" className="btn btn-outline btn-xs">
            <Send size={13} /> {t('admin_donations_pending_sends')}
          </Link>
          <Link to="/admin/money/deleted-donations" className="btn btn-outline btn-xs">
            <ListX size={13} /> {t('admin_money_deleted_donations')}
          </Link>
        </div>

        <div className="card card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)' }}>
                {search ? t('admin_donations_total_matching') : t('admin_donations_total_year')}
              </div>
              <div className="amount-lg">{inr(total)}</div>
            </div>
            {!search && (
              <div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)' }}>
                  {t('admin_donations_total_today')}
                </div>
                <div className="amount-lg" style={{ color: 'var(--color-leaf-dark, #2F6B3E)' }}>{inr(todayTotal)}</div>
              </div>
            )}
          </div>
          {!adding && (
            <button
              className="btn btn-primary"
              onClick={() => { setForm({ ...blank, collector: profile?.full_name || '' }); setClientId(makeClientId()); setAdding(true); }}
              disabled={!festivalId}
            >
              <Plus size={16} /> {t('admin_donations_add')}
            </button>
          )}
        </div>

        {!online && (
          <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-warning-bg, #FFF6E5)', color: 'var(--color-warning-ink, #8A5A00)' }}>
            <WifiOff size={16} />
            <span style={{ fontSize: 'var(--fs-sm)' }}>
              {t('admin_donations_offline_banner') || "You're offline. Anything you type stays safely on this device and nothing will be sent until your connection is back."}
            </span>
          </div>
        )}

        {adding && (
          <form className="card card-pad" onSubmit={handleSave}>
            <FormGrid>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{t('admin_donations_new')}</strong>
                <button type="button" onClick={closeAddForm} aria-label="Close"><X size={18} /></button>
              </div>
              {restoredDraft && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', color: 'var(--color-leaf-dark, #2F6B3E)' }}>
                  <History size={14} /> {t('admin_donations_draft_restored') || 'Recovered an unsaved entry from before — review and save, or discard it.'}
                </div>
              )}
              {saveError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', color: 'var(--color-danger)' }}>
                  <AlertTriangle size={14} /> {saveError}
                </div>
              )}
              <Field label={t('admin_donations_donor_name')} required>
                <Input required value={form.donor_name} onChange={(e) => setForm({ ...form, donor_name: e.target.value })} />
              </Field>
              <Field label={t('admin_donations_donor_phone')} hint={t('admin_donations_donor_phone_hint')}>
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  value={form.donor_phone}
                  onChange={(e) => setForm({ ...form, donor_phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                />
              </Field>
              <Field label={t('admin_donations_donor_village')}>
                <Input value={form.donor_village} onChange={(e) => setForm({ ...form, donor_village: e.target.value })} />
              </Field>
              <Field label={t('admin_donations_amount')} required>
                <Input required type="number" min="1" step="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </Field>
              <Field label={t('admin_donations_date')} required>
                <Input type="date" required value={form.donation_date} onChange={(e) => setForm({ ...form, donation_date: e.target.value })} />
              </Field>
              <Field label={t('admin_donations_payment_method')}>
                <Select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                  <option>Other</option>
                </Select>
              </Field>
              <Field label={t('admin_donations_source')}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SOURCES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`btn btn-sm ${form.source === s ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setForm({ ...form, source: s })}
                    >
                      {t(`admin_donations_source_${s.toLowerCase()}`)}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={t('admin_donations_collector')} hint={t('admin_donations_collector_hint')}>
                <Input value={form.collector} onChange={(e) => setForm({ ...form, collector: e.target.value })} />
              </Field>
              <Field label={t('admin_donations_notes')}>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Field>
              <button className="btn btn-primary btn-block" disabled={saving || !online}>
                {saving ? t('admin_donations_saving') : (!online ? (t('admin_donations_offline_short') || "Offline — can't save yet") : t('admin_donations_save'))}
              </button>
            </FormGrid>
          </form>
        )}

        <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} color="var(--color-ink-soft)" />
          <input
            placeholder={t('admin_donations_search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-body)' }}
          />
          {search && (
            <button type="button" className="icon-btn" onClick={() => setSearch('')} aria-label={t('admin_donations_search_clear')}>
              <X size={16} color="var(--color-ink-soft)" />
            </button>
          )}
        </div>
        {search && (
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)', marginTop: -8 }}>
            {filtered.length} {t('admin_donations_search_results')}
          </div>
        )}

        {loading && <PageSkeleton />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && filtered.length === 0 && <div className="card empty-state">{t('admin_donations_empty')}</div>}
        {!loading && !error && filtered.map((d) => {
          const isToday = d.donation_date === todayIso();
          const expanded = expandedId === d.id;
          return (
            <div
              key={d.id}
              className="card donation-row"
              onClick={() => setExpandedId(expanded ? null : d.id)}
              role="button"
              tabIndex={0}
            >
              <div className="donation-row-main">
                <div className="donation-row-name">{d.donor_name}</div>
                <div className="donation-row-date" style={isToday ? { color: 'var(--color-leaf-dark, #2F6B3E)' } : undefined}>
                  {isToday ? t('admin_donations_today') : d.donation_date}
                </div>
                <div className="donation-row-amount">{inr(d.amount)}</div>
              </div>
              {expanded && (
                <div className="donation-row-details" onClick={(e) => e.stopPropagation()}>
                  <div className="meta">
                    <strong style={{ color: isToday ? 'var(--color-leaf-dark, #2F6B3E)' : 'var(--color-ink)' }}>
                      {d.donation_date}{isToday ? ` (${t('admin_donations_today')})` : ''}
                    </strong>
                    {' · '}{d.payment_method} · {t(`admin_donations_source_${(d.source || 'other').toLowerCase()}`)}{d.donor_village ? ` · ${d.donor_village}` : ''}{d.collector ? ` · ${d.collector}` : ''}{d.donor_phone ? ` · ${d.donor_phone}` : ''}
                  </div>
                  <div className="donation-row-actions">
                    {d.donor_phone && (
                      d.receipt_sent
                        ? <Send size={16} color="var(--color-leaf, #3F7D4F)" aria-label={t('admin_donations_receipt_sent')} />
                        : <Send size={16} color="var(--color-ink-soft)" style={{ opacity: 0.4 }} aria-label={t('admin_donations_receipt_pending')} />
                    )}
                    <button className="icon-btn" onClick={() => openHistory(d.donor_name)} aria-label={t('admin_donations_history')}><History size={16} /></button>
                    <button className="icon-btn" onClick={() => setToDelete(d)} aria-label={t('admin_donations_delete')}><Trash2 size={16} color="var(--color-danger)" /></button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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

      <DeleteDonationDialog
        open={!!toDelete}
        donation={toDelete}
        defaultDeletedBy={profile?.full_name || ''}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
import { useMemo, useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import FestivalBanner from '../../components/admin/FestivalBanner';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import { donationsApi } from '../../services/adminApi';
import { useAsyncData } from '../../hooks/useAsyncData';
import { PageSkeleton, PageError } from '../../components/LoadingStates';
import { useToast } from '../../components/admin/Toast';
import { openWhatsAppReceipt } from '../../lib/whatsappReceipt';
import { useLanguage } from '../../i18n/LanguageContext';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function PendingSends() {
  const { t } = useLanguage();
  const toast = useToast();
  const { festival, festivalId, loading: festivalLoading } = useActiveFestival();
  const [sendingId, setSendingId] = useState(null);

  const fetcher = () => (festivalId ? donationsApi.list(festivalId) : Promise.resolve([]));
  const { data, loading, error, reload } = useAsyncData(fetcher, [festivalId, festivalLoading]);

  // Only donors who gave a phone number are actionable here. Donors with
  // no phone were logged "without a receipt" on purpose (see item 3) —
  // they never appear as pending, there's nothing to send them.
  const pending = useMemo(
    () => (data || []).filter((d) => d.donor_phone && !d.receipt_sent),
    [data]
  );

  async function sendOne(d) {
    setSendingId(d.id);
    try {
      openWhatsAppReceipt({
        phone: d.donor_phone,
        donorName: d.donor_name,
        amount: d.amount,
        festivalName: festival?.name_en,
        donationId: d.id,
      });
      await donationsApi.update(d.id, { receipt_sent: true, receipt_sent_at: new Date().toISOString() });
      await reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSendingId(null);
    }
  }

  // WhatsApp only lets one chat be opened per click (browsers/OSes block
  // rapid-fire popup windows), so "send all" is a guided queue: send the
  // first one, and once that tab opens, immediately move to the next.
  // The list shrinks after each send, so pressing this repeatedly walks
  // through everyone left.
  async function sendNext() {
    if (pending.length === 0) return;
    await sendOne(pending[0]);
  }

  return (
    <>
      <AdminHeader title={t('admin_pending_sends_title')} showBack />
      <div className="page">
        <FestivalBanner festival={festival} />
        <div className="chip chip-danger" style={{ alignSelf: 'flex-start' }}>
          {t('admin_money_private_note')}
        </div>

        {(loading || festivalLoading) && <PageSkeleton />}
        {!loading && !festivalLoading && error && <PageError onRetry={reload} />}

        {!loading && !festivalLoading && !error && (
          <div className="card card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)' }}>
                {t('admin_pending_sends_count')}
              </div>
              <div style={{ fontWeight: 700, fontSize: 'var(--fs-lg)' }}>{pending.length}</div>
            </div>
            {pending.length > 0 && (
              <button className="btn btn-primary" onClick={sendNext} disabled={!!sendingId}>
                <Send size={16} /> {t('admin_pending_sends_send_next')}
              </button>
            )}
          </div>
        )}

        {!loading && !festivalLoading && !error && pending.length === 0 && (
          <div className="card empty-state">
            <CheckCircle2 size={28} color="var(--color-leaf, #3F7D4F)" />
            <div>{t('admin_pending_sends_empty')}</div>
          </div>
        )}

        {!loading && !festivalLoading && !error && pending.map((d) => (
          <div key={d.id} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="title">{d.donor_name}</div>
              <div className="meta">{d.donation_date} · {d.donor_phone}</div>
            </div>
            <div style={{ fontWeight: 700 }}>{inr(d.amount)}</div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => sendOne(d)}
              disabled={sendingId === d.id}
            >
              <Send size={14} /> {t('admin_pending_sends_send')}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

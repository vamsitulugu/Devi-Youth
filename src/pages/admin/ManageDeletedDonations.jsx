import { AdminHeader } from '../../components/admin/AdminLayout';
import FestivalBanner from '../../components/admin/FestivalBanner';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import { getDeletedDonations } from '../../services/adminApi';
import { useAsyncData } from '../../hooks/useAsyncData';
import { PageSkeleton, PageError } from '../../components/LoadingStates';
import { useLanguage } from '../../i18n/LanguageContext';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function ManageDeletedDonations() {
  const { t } = useLanguage();
  const { festival, festivalId, loading: festivalLoading } = useActiveFestival();

  const fetcher = () => (festivalId ? getDeletedDonations(festivalId) : Promise.resolve([]));
  const { data, loading, error, reload } = useAsyncData(fetcher, [festivalId, festivalLoading]);
  const items = data || [];

  return (
    <>
      <AdminHeader title={t('admin_deleted_donations_title')} showBack />
      <div className="page">
        <FestivalBanner festival={festival} />
        <div className="chip chip-danger" style={{ alignSelf: 'flex-start' }}>
          {t('admin_money_private_note')}
        </div>

        {(loading || festivalLoading) && <PageSkeleton />}
        {!loading && !festivalLoading && error && <PageError onRetry={reload} />}
        {!loading && !festivalLoading && !error && items.length === 0 && (
          <div className="card empty-state">
            <div>{t('admin_deleted_donations_empty')}</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)', marginTop: 4 }}>
              {t('admin_deleted_donations_empty_sub')}
            </div>
          </div>
        )}
        {!loading && !festivalLoading && !error && items.map((d) => (
          <div key={d.id} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div className="title">{d.donor_name}</div>
                <div className="meta">
                  {t('admin_deleted_donations_original_date')}: {d.donation_date}
                  {d.payment_method ? ` · ${d.payment_method}` : ''}
                  {d.collector ? ` · ${d.collector}` : ''}
                </div>
              </div>
              <div style={{ fontWeight: 700, flexShrink: 0 }}>{inr(d.amount)}</div>
            </div>

            <div style={{ borderTop: '1px dashed var(--color-border)', marginTop: 4, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 'var(--fs-sm)' }}>
                <strong style={{ color: 'var(--color-ink-soft)', fontWeight: 700, fontSize: 'var(--fs-xs)' }}>
                  {t('admin_deleted_donations_reason')}:
                </strong>{' '}
                {d.reason}
              </div>
              <div className="meta">
                {t('admin_deleted_donations_by')}: {d.deleted_by_name} · {t('admin_deleted_donations_on')}: {new Date(d.deleted_at).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

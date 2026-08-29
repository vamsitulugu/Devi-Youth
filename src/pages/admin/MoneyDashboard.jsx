import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, Wallet, ChevronRight, ListX, Send, Plus } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import { donationsApi, expensesApi } from '../../services/adminApi';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { PageSkeleton, PageError } from '../../components/LoadingStates';
import { useLanguage } from '../../i18n/LanguageContext';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const isoDay = (d) => d.toISOString().slice(0, 10);

function lastNDays(n) {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(isoDay(d));
  }
  return days;
}

function Bar({ label, sub, amount, total, color }) {
  const pct = total > 0 ? Math.max(2, Math.round((amount / total) * 100)) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', marginBottom: 4 }}>
        <span>{label}{sub ? <span style={{ color: 'var(--color-ink-soft)' }}> · {sub}</span> : null}</span>
        <strong>{inr(amount)}</strong>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: 'var(--color-border)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color || 'var(--color-vermillion)' }} />
      </div>
    </div>
  );
}

export default function MoneyDashboard() {
  const { t } = useLanguage();
  const { festivalId, loading: festivalLoading } = useActiveFestival();
  const [donations, setDonations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(isoDay(new Date()));

  async function reload() {
    if (festivalLoading) return;
    if (!festivalId) { setDonations([]); setExpenses([]); setLoading(false); return; }
    setLoading(true);
    try {
      const [d, e] = await Promise.all([donationsApi.list(festivalId), expensesApi.list(festivalId)]);
      setDonations(d);
      setExpenses(e);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [festivalId, festivalLoading]);

  // Live sync: any committee member adding/editing/deleting a donation or
  // expense refreshes everyone else's dashboard automatically — no manual
  // refresh, no "sync" button needed.
  useEffect(() => {
    if (!isSupabaseConfigured || !festivalId) return;
    const channel = supabase
      .channel(`money-dashboard-${festivalId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations', filter: `festival_id=eq.${festivalId}` }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `festival_id=eq.${festivalId}` }, reload)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [festivalId]);

  const days = useMemo(() => lastNDays(7), []);
  const dayLabel = (iso) => new Date(iso).toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase();
  const dayNum = (iso) => new Date(iso).getDate();

  const dayDonations = useMemo(
    () => donations.filter((d) => d.donation_date === selectedDay),
    [donations, selectedDay]
  );
  const dayTotal = useMemo(() => dayDonations.reduce((s, d) => s + Number(d.amount || 0), 0), [dayDonations]);

  const bySource = useMemo(() => {
    const map = {};
    for (const d of dayDonations) {
      const key = d.source || 'Other';
      map[key] = map[key] || { amount: 0, count: 0 };
      map[key].amount += Number(d.amount || 0);
      map[key].count += 1;
    }
    return map;
  }, [dayDonations]);

  const byVolunteer = useMemo(() => {
    const map = {};
    for (const d of dayDonations) {
      const key = d.collector || t('admin_dashboard_unassigned');
      map[key] = (map[key] || 0) + Number(d.amount || 0);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [dayDonations, t]);

  const dayExpenseTotal = useMemo(
    () => expenses.filter((e) => e.expense_date === selectedDay).reduce((s, e) => s + Number(e.amount || 0), 0),
    [expenses, selectedDay]
  );

  const yearTotal = useMemo(() => donations.reduce((s, d) => s + Number(d.amount || 0), 0), [donations]);
  const isToday = selectedDay === isoDay(new Date());

  const menuItems = [
    { to: '/admin/content/donations', icon: IndianRupee, label: t('admin_money_donations') },
    { to: '/admin/content/expenses', icon: Wallet, label: t('admin_money_expenses') },
    { to: '/admin/money/pending-sends', icon: Send, label: t('admin_donations_pending_sends') },
    { to: '/admin/money/deleted-donations', icon: ListX, label: t('admin_money_deleted_donations') },
  ];

  if (loading || festivalLoading) return (<><AdminHeader title={t('admin_money_title')} /><div className="page"><PageSkeleton /></div></>);
  if (error) return (<><AdminHeader title={t('admin_money_title')} /><div className="page"><PageError onRetry={reload} /></div></>);

  return (
    <>
      <AdminHeader title={t('admin_money_title')} />
      <div className="page">
        <div className="chip chip-danger" style={{ alignSelf: 'flex-start' }}>{t('admin_money_private_note')}</div>

        <div className="card card-pad">
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{t('admin_dashboard_by_day')}</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {days.map((iso) => (
              <button
                key={iso}
                onClick={() => setSelectedDay(iso)}
                className="btn btn-sm"
                style={{
                  flexShrink: 0,
                  flexDirection: 'column',
                  minWidth: 52,
                  background: selectedDay === iso ? 'var(--color-ink)' : 'transparent',
                  color: selectedDay === iso ? '#fff' : 'var(--color-ink)',
                  border: selectedDay === iso ? 'none' : '1.5px solid var(--color-border)',
                }}
              >
                <div style={{ fontSize: 10, opacity: 0.7 }}>{dayLabel(iso)}</div>
                <div style={{ fontWeight: 700 }}>{dayNum(iso)}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card card-pad">
          {dayDonations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--color-ink-soft)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, opacity: 0.4 }}>{inr(0)}</div>
              <div>{isToday ? t('admin_dashboard_no_collections') : t('admin_dashboard_no_collections_on_day')}</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--color-ink-soft)', textTransform: 'uppercase' }}>
                {isToday ? t('admin_dashboard_collected_today') : t('admin_dashboard_collected_on_day')}
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-leaf-dark, #2F6B3E)' }}>
                {inr(dayTotal)}
              </div>
              <div style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--fs-sm)', marginBottom: 14 }}>
                {dayDonations.length} {t('admin_dashboard_donations_collected')}
              </div>

              <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--color-ink-soft)', marginBottom: 8, textTransform: 'uppercase' }}>
                {t('admin_dashboard_by_source')}
              </div>
              {['Shop', 'Society', 'Other'].map((s) => (
                bySource[s] ? (
                  <Bar
                    key={s}
                    label={t(`admin_donations_source_${s.toLowerCase()}`)}
                    sub={`${bySource[s].count} ${t('admin_dashboard_donation_count')}`}
                    amount={bySource[s].amount}
                    total={dayTotal}
                  />
                ) : null
              ))}

              <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--color-ink-soft)', margin: '14px 0 8px', textTransform: 'uppercase' }}>
                {t('admin_dashboard_by_volunteer')}
              </div>
              {byVolunteer.map(([name, amount]) => (
                <Bar key={name} label={name} amount={amount} total={dayTotal} color="var(--color-marigold-text, #C77A00)" />
              ))}
            </>
          )}
        </div>

        <div className="card card-pad" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('admin_dashboard_expenses_this_day')}</span>
          <strong>{inr(dayExpenseTotal)}</strong>
        </div>

        <div className="card card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--color-ink-soft)' }}>{t('admin_dashboard_year_total_hint')}</span>
          <strong>{inr(yearTotal)}</strong>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {menuItems.map(({ to, icon: Icon, label }, i) => (
            <Link
              key={to}
              to={to}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderBottom: i < menuItems.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <div className="icon-badge"><Icon size={18} /></div>
              <div style={{ flex: 1, fontWeight: 600 }}>{label}</div>
              <ChevronRight size={18} color="var(--color-border)" />
            </Link>
          ))}
        </div>

        <Link to="/admin/content/donations" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>
          <Plus size={16} /> {t('admin_donations_add')}
        </Link>
      </div>
    </>
  );
}
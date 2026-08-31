import { Link } from 'react-router-dom';
import { IndianRupee, Wallet, ChevronRight, ListX } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import { useLanguage } from '../../i18n/LanguageContext';
import Reveal from '../../components/Reveal';

export default function MoneyHub() {
  const { t } = useLanguage();

  const items = [
    { to: '/admin/content/donations', icon: IndianRupee, label: t('admin_money_donations') },
    { to: '/admin/content/expenses', icon: Wallet, label: t('admin_money_expenses') },
    { to: '/admin/money/deleted-donations', icon: ListX, label: t('admin_money_deleted_donations'), sub: t('admin_money_deleted_donations_sub') },
  ];

  return (
    <>
      <AdminHeader title={t('admin_money_title')} />
      <div className="page">
        <div className="chip chip-danger" style={{ alignSelf: 'flex-start' }}>{t('admin_money_private_note')}</div>
        <Reveal as="div" className="card" style={{ overflow: 'hidden' }}>
          {items.map(({ to, icon: Icon, label, sub }, i) => (
            <Link
              key={to}
              to={to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <div className="icon-badge"><Icon size={18} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{label}</div>
                {sub && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)' }}>{sub}</div>}
              </div>
              <ChevronRight size={18} color="var(--color-border)" />
            </Link>
          ))}
        </Reveal>
      </div>
    </>
  );
}

import { Link } from 'react-router-dom';
import { IndianRupee, Wallet, ChevronRight } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';

const items = [
  { to: '/admin/content/donations', icon: IndianRupee, label: 'Donations' },
  { to: '/admin/content/expenses', icon: Wallet, label: 'Expenses' },
];

export default function MoneyHub() {
  return (
    <>
      <AdminHeader title="Money" />
      <div className="page">
        <div className="chip chip-danger" style={{ alignSelf: 'flex-start' }}>Private — visible to committee/admin only</div>
        <div className="card" style={{ overflow: 'hidden' }}>
          {items.map(({ to, icon: Icon, label }, i) => (
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
              <span style={{ flex: 1, fontWeight: 600 }}>{label}</span>
              <ChevronRight size={18} color="var(--color-border)" />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

import { Link } from 'react-router-dom';
import {
  Megaphone, CalendarClock, Users, Gift, Ticket, Phone, IndianRupee, Wallet, ChevronRight,
} from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import { useAuth } from '../../auth/AuthContext';

const items = [
  { to: '/admin/content/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/admin/content/events', icon: CalendarClock, label: 'Events' },
  { to: '/admin/content/committee', icon: Users, label: 'Committee', adminOnly: true },
  { to: '/admin/content/laddu', icon: Gift, label: 'Laddu Velam' },
  { to: '/admin/content/lottery', icon: Ticket, label: 'Lottery' },
  { to: '/admin/content/contacts', icon: Phone, label: 'Contacts', adminOnly: true },
  { to: '/admin/content/donations', icon: IndianRupee, label: 'Donations' },
  { to: '/admin/content/expenses', icon: Wallet, label: 'Expenses' },
];

export default function ContentHub() {
  const { isAdmin } = useAuth();
  const visible = items.filter((i) => !i.adminOnly || isAdmin);

  return (
    <>
      <AdminHeader title="Manage Content" />
      <div className="page">
        <div className="card" style={{ overflow: 'hidden' }}>
          {visible.map(({ to, icon: Icon, label }, i) => (
            <Link
              key={to}
              to={to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderBottom: i < visible.length - 1 ? '1px solid var(--color-border)' : 'none',
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

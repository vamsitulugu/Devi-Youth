import { Link } from 'react-router-dom';
import {
  Megaphone, CalendarClock, Users, Gift, Ticket, Phone, IndianRupee, Wallet,
} from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import { useAuth } from '../../auth/AuthContext';
import Reveal from '../../components/Reveal';

const items = [
  { to: '/admin/content/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/admin/content/events', icon: CalendarClock, label: 'Events' },
  { to: '/admin/content/committee', icon: Users, label: 'Committee' },
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
        <Reveal className="quick-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {visible.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className="quick-tile">
              <span className="quick-tile-icon"><Icon size={19} strokeWidth={2.2} /></span>
              <span className="quick-tile-label">{label}</span>
            </Link>
          ))}
        </Reveal>
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee, Wallet, Scale, Users, CalendarClock, Megaphone,
  PlusCircle, Image as ImageIcon, Gift, Ticket,
} from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminLayout';
import { useAuth } from '../../auth/AuthContext';
import { useActiveFestival } from '../../hooks/useActiveFestival';
import { getDashboardStats } from '../../services/adminApi';
import { PageSkeleton, PageError } from '../../components/LoadingStates';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        className="icon-badge"
        style={{ background: tone || 'var(--color-surface-alt)', color: '#fff', flexShrink: 0 }}
      >
        <Icon size={18} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)' }}>{label}</div>
        <div style={{ fontWeight: 700, fontSize: 'var(--fs-md)' }}>{value}</div>
      </div>
    </div>
  );
}

const quickActions = [
  { to: '/admin/content/donations', icon: PlusCircle, label: 'Add Donation' },
  { to: '/admin/content/expenses', icon: Wallet, label: 'Add Expense' },
  { to: '/admin/content/announcements', icon: Megaphone, label: 'Add Announcement' },
  { to: '/admin/content/events', icon: CalendarClock, label: 'Add Event' },
  { to: '/admin/gallery', icon: ImageIcon, label: 'Upload Photos' },
  { to: '/admin/content/lottery', icon: Ticket, label: 'Update Lottery' },
  { to: '/admin/content/laddu', icon: Gift, label: 'Update Laddu' },
];

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { festival, festivalId, loading: festivalLoading } = useActiveFestival();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!festivalId) return;
    let alive = true;
    setLoading(true);
    getDashboardStats(festivalId)
      .then((s) => alive && setStats(s))
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [festivalId]);

  return (
    <>
      <AdminHeader title="Dashboard" />
      <div className="page">
        <div className="card card-pad" style={{ background: 'var(--color-surface-alt)' }}>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-ink-soft)' }}>Welcome back,</div>
          <div style={{ fontWeight: 700, fontSize: 'var(--fs-md)' }}>{profile?.full_name || 'Committee Member'}</div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-marigold)', fontWeight: 700, textTransform: 'capitalize' }}>
            {profile?.role}{festival ? ` · ${festival.year} festival` : ''}
          </div>
        </div>

        {(loading || festivalLoading) && <PageSkeleton rows={4} />}
        {!loading && error && <PageError message="Couldn't load stats." />}
        {!loading && !error && !festival && (
          <div className="card card-pad empty-state">
            No festival year set up yet. Create one in Settings to get started.
          </div>
        )}

        {!loading && !error && stats && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <StatCard icon={IndianRupee} label="Total Donations" value={inr(stats.totalDonations)} tone="var(--color-leaf)" />
              <StatCard icon={Wallet} label="Total Expenses" value={inr(stats.totalExpenses)} tone="var(--color-vermillion)" />
              <StatCard icon={Scale} label="Current Balance" value={inr(stats.balance)} tone="var(--color-brass)" />
              <StatCard icon={Users} label="Donors" value={stats.donorCount} tone="var(--color-marigold)" />
              <StatCard icon={CalendarClock} label="Upcoming Events" value={stats.upcomingEvents} tone="var(--color-leaf-dark)" />
              <StatCard icon={Megaphone} label="Announcements" value={stats.announcementCount} tone="var(--color-vermillion-dark)" />
            </div>

            <div>
              <div className="section-title"><h2>Quick Actions</h2></div>
              <div className="hscroll">
                {quickActions.map(({ to, icon: Icon, label }) => (
                  <Link
                    key={label}
                    to={to}
                    className="card"
                    style={{
                      width: 108,
                      padding: '16px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      textAlign: 'center',
                    }}
                  >
                    <div className="icon-badge"><Icon size={18} /></div>
                    <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

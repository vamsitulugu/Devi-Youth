import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, LayoutDashboard, Megaphone, Wallet, Images, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/content', icon: Megaphone, label: 'Content' },
  { to: '/admin/money', icon: Wallet, label: 'Money' },
  { to: '/admin/gallery', icon: Images, label: 'Gallery' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminHeader({ title, showBack = false }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <header className="app-header">
      {showBack ? (
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <ChevronLeft size={22} />
        </button>
      ) : (
        <span style={{ width: 22 }} />
      )}
      <h1 className="title">{title}</h1>
      <button
        className="lang-toggle"
        onClick={async () => {
          await signOut();
          navigate('/admin/login');
        }}
        aria-label="Log out"
        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <LogOut size={13} /> Exit
      </button>
    </header>
  );
}

export default function AdminLayout({ children }) {
  const location = useLocation();

  return (
    <div className="app-shell">
      {children}
      <nav className="bottom-nav">
        {navItems.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <Link key={to} to={to} className={`nav-item ${active ? 'active' : ''}`}>
              <Icon size={20} />
              <span className="nav-label">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

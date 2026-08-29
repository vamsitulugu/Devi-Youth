import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, LayoutDashboard, Megaphone, Wallet, Images, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import Toranam from '../Toranam';

function useNavItems() {
  const { t } = useLanguage();
  return [
    { to: '/admin', icon: LayoutDashboard, label: t('admin_nav_dashboard'), exact: true },
    { to: '/admin/content', icon: Megaphone, label: t('admin_nav_content') },
    { to: '/admin/money', icon: Wallet, label: t('admin_nav_money') },
    { to: '/admin/gallery', icon: Images, label: t('admin_nav_gallery') },
    { to: '/admin/settings', icon: Settings, label: t('admin_nav_settings') },
  ];
}

export function AdminHeader({ title, showBack = false }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="app-header">
      <div className="app-header-row">
        {showBack ? (
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <ChevronLeft size={22} />
          </button>
        ) : (
          <Link to="/admin" className="brand" aria-label="Admin dashboard">
            <img src="/icon-192.png" alt="" className="brand-logo" />
          </Link>
        )}
        <h1 className="title">{title}</h1>
        <div className="app-header-actions">
          <button
            className="lang-toggle"
            onClick={() => setLang(lang === 'en' ? 'te' : 'en')}
            aria-label={t('admin_switch_language')}
          >
            <span className={lang === 'en' ? 'active' : ''}>EN</span>
            <span className="sep">|</span>
            <span className={lang === 'te' ? 'active' : ''}>తె</span>
          </button>
          <button
            className="lang-toggle"
            onClick={async () => {
              await signOut();
              navigate('/admin/login');
            }}
            aria-label={t('admin_logout')}
          >
            <LogOut size={13} /> {t('admin_logout')}
          </button>
        </div>
      </div>
      <Toranam />
    </header>
  );
}

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navItems = useNavItems();

  return (
    <div className="app-shell">
      <div className="app-shell-content">
        {children}
      </div>
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
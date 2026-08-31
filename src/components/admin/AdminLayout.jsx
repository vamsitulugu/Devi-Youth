import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, LayoutDashboard, Megaphone, Wallet, Images, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import Toranam from '../Toranam';
import AppQrCode from '../AppQrCode';

/**
 * AdminLayout — identical routes/behavior to the original. The bottom nav
 * is now the same frosted "nav-v2" treatment as the public app's
 * BottomNav (upgrade.css), so committee members get the same polish
 * without a second nav component to maintain.
 */

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
    <>
      <header className="app-header">
        <Toranam />
        <div className="app-header-row">
          {showBack && (
            <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
              <ChevronLeft size={22} />
            </button>
          )}
          <Link to="/admin" className="brand" aria-label="Admin dashboard">
            <img src="/icon-192.png" alt="" className="brand-logo" />
            <span className="brand-name">{t('app_name')}</span>
          </Link>
          <div className="app-header-actions">
            <AppQrCode />
            <button
              className="lang-toggle"
              onClick={() => setLang(lang === 'en' ? 'te' : 'en')}
              aria-label={t('admin_switch_language')}
            >
              <span className={lang === 'en' ? 'active' : ''}>EN</span>
              <span className="sep">|</span>
              <span className={lang === 'te' ? 'active' : ''}>తెలుగు</span>
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
      </header>
      {title && <h1 className="page-title-bar">{title}</h1>}
    </>
  );
}

function usePendingInviteCount(isAdmin) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured || !isAdmin) {
      setCount(0);
      return;
    }
    let cancelled = false;
    async function load() {
      const { count: c } = await supabase
        .from('invite_codes')
        .select('id', { count: 'exact', head: true })
        .eq('used', false)
        .gt('expires_at', new Date().toISOString());
      if (!cancelled) setCount(c || 0);
    }
    load();
    const channel = supabase
      .channel('admin-nav-pending-invites')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invite_codes' }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  return count;
}

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navItems = useNavItems();
  const { isAdmin } = useAuth();
  const pendingInvites = usePendingInviteCount(isAdmin);

  return (
    <div className="app-shell admin-shell">
      <div className="app-shell-content">
        {children}
      </div>
      <nav className="bottom-nav nav-v2">
        {navItems.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to);
          const showDot = to === '/admin/settings' && pendingInvites > 0;
          return (
            <Link key={to} to={to} className={`nav-item ${active ? 'active' : ''}`}>
              <span className="nav-icon-wrap">
                <Icon size={20} />
                {showDot && <span className="nav-dot" />}
              </span>
              <span className="nav-label">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

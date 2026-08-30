import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, LayoutDashboard, Megaphone, Wallet, Images, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
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

  useEffect(() => {
    document.title = title ? `${title} — ${t('admin_app_name')}` : t('admin_app_name');
  }, [title, t, lang]);

  return (
    <>
      <header className="app-header">
        <Toranam />
        <div className="app-header-row">
          <Link to="/admin" className="brand" aria-label="Admin dashboard">
            <img src="/icon-192.png" alt="" className="brand-logo" />
            <span className="brand-name">{t('admin_app_name')}</span>
          </Link>
          <div className="app-header-actions">
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
      {title && (
        <div className={`page-title-bar${showBack ? ' with-back' : ''}`}>
          {showBack && (
            <button className="page-title-back" onClick={() => navigate(-1)} aria-label="Go back">
              <ChevronLeft size={20} />
            </button>
          )}
          <h1 className="page-title-bar-text">{title}</h1>
        </div>
      )}
    </>
  );
}

// A small red dot on the Settings tab so an admin notices a pending
// invite without having to open Settings first. Live-updates the same
// way Settings itself does, via Supabase Realtime on invite_codes.
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
    <div className="app-shell">
      <div className="app-shell-content">
        {children}
      </div>
      <nav className="bottom-nav">
        {navItems.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to);
          const showDot = to === '/admin/settings' && pendingInvites > 0;
          return (
            <Link key={to} to={to} className={`nav-item ${active ? 'active' : ''}`}>
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <Icon size={20} />
                {showDot && (
                  <span
                    aria-label={`${pendingInvites} pending invite${pendingInvites === 1 ? '' : 's'}`}
                    style={{
                      position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--color-vermillion)', border: '1.5px solid var(--color-surface)',
                    }}
                  />
                )}
              </span>
              <span className="nav-label">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
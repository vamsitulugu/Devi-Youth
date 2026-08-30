import { Link } from 'react-router-dom';
import { Gift, Ticket, Users, Clock3, Phone, ChevronRight, LogIn, HeartHandshake } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import Header from '../components/Header';

const links = [
  { to: '/donations', icon: HeartHandshake, key: 'donations_title' },
  { to: '/laddu', icon: Gift, key: 'laddu_title' },
  { to: '/lottery', icon: Ticket, key: 'lottery_title' },
  { to: '/committee', icon: Users, key: 'committee_title' },
  { to: '/history', icon: Clock3, key: 'history_title' },
  { to: '/contacts', icon: Phone, key: 'contacts_title' },
];

// Same app, same deployment — the admin/committee area is just another
// route here, so this is a normal in-app link (not an external tab).
// Keeping it in the same tab is what makes the back-button behavior
// correct: before signing in, back naturally returns here; once
// signed in, App.jsx's back-guard takes over instead.
const COMMITTEE_LOGIN_PATH = '/admin/login';

export default function More() {
  const { t } = useLanguage();
  return (
    <>
      <Header title={t('nav_more')} />
      <div className="page">
        <div className="card" style={{ overflow: 'hidden' }}>
          {links.map(({ to, icon: Icon, key }, i) => (
            <Link
              key={to}
              to={to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderBottom: i < links.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <div className="icon-badge"><Icon size={18} /></div>
              <span style={{ flex: 1, fontWeight: 600 }}>{t(key)}</span>
              <ChevronRight size={18} color="var(--color-border)" />
            </Link>
          ))}
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <Link
            to={COMMITTEE_LOGIN_PATH}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}
          >
            <div className="icon-badge"><LogIn size={18} /></div>
            <span style={{ flex: 1, fontWeight: 600 }}>{t('committee_login')}</span>
            <ChevronRight size={18} color="var(--color-border)" />
          </Link>
        </div>
      </div>
    </>
  );
}
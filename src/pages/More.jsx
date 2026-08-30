import { Link } from 'react-router-dom';
import { Gift, Ticket, Users, Clock3, Phone, ChevronRight, LogIn } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import Header from '../components/Header';

const links = [
  { to: '/laddu', icon: Gift, key: 'laddu_title' },
  { to: '/lottery', icon: Ticket, key: 'lottery_title' },
  { to: '/committee', icon: Users, key: 'committee_title' },
  { to: '/history', icon: Clock3, key: 'history_title' },
  { to: '/contacts', icon: Phone, key: 'contacts_title' },
];

// The committee/admin dashboard lives in a separate deployment (this
// app is villager-facing only) — so this is a plain external link,
// not an in-app route.
const COMMITTEE_LOGIN_URL = 'https://deviyouth.vercel.app/#/admin/login';

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
          <a
            href={COMMITTEE_LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}
          >
            <div className="icon-badge"><LogIn size={18} /></div>
            <span style={{ flex: 1, fontWeight: 600 }}>{t('committee_login')}</span>
            <ChevronRight size={18} color="var(--color-border)" />
          </a>
        </div>
      </div>
    </>
  );
}
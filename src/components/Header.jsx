import { useEffect, useState } from 'react';
import { ChevronLeft, Search, Bell } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import Toranam from './Toranam';
import AppQrCode from './AppQrCode';
import SearchSheet from './SearchSheet';
import NotificationSheet, { useUnreadCount } from './NotificationSheet';

/**
 * Header v2 — same red bar, same brand block, same EN|తెలుగు toggle.
 * Adds two header actions that every page inherits for free:
 *   • Search  — full-text search across announcements, events, committee,
 *               contacts, laddu and lottery (SearchSheet.jsx)
 *   • Bell    — notification feed built from the newest announcements and
 *               events, with an unread badge (NotificationSheet.jsx)
 */
export default function Header({ title, showBack = false, onBack }) {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();
  const [sheet, setSheet] = useState(null); // 'search' | 'notifications' | null
  const unread = useUnreadCount();

  // Lock body scroll while a sheet is open.
  useEffect(() => {
    if (!sheet) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [sheet]);

  return (
    <>
      <header className="app-header">
        <Toranam />
        <div className="app-header-row">
          {showBack && (
            <button className="back-btn" onClick={onBack || (() => navigate(-1))} aria-label="Go back">
              <ChevronLeft size={22} />
            </button>
          )}
          <Link to="/" className="brand" aria-label="Home">
            <img src="/icon-192.png" alt="" className="brand-logo" />
            <span className="brand-name">{t('app_name')}</span>
          </Link>
          <div className="app-header-actions">
            <button
              className="icon-btn-header"
              onClick={() => setSheet('search')}
              aria-label={lang === 'te' ? 'వెతకండి' : 'Search'}
            >
              <Search size={17} strokeWidth={2.4} />
            </button>
            <button
              className="icon-btn-header"
              onClick={() => setSheet('notifications')}
              aria-label={lang === 'te' ? 'నోటిఫికేషన్లు' : 'Notifications'}
            >
              <Bell size={17} strokeWidth={2.4} />
              {unread > 0 && <span className="header-badge">{unread > 9 ? '9+' : unread}</span>}
            </button>
            <AppQrCode />
            <button
              className="lang-toggle"
              onClick={() => setLang(lang === 'en' ? 'te' : 'en')}
              aria-label="Switch language"
            >
              <span className={lang === 'en' ? 'active' : ''}>EN</span>
              <span className="sep">|</span>
              <span className={lang === 'te' ? 'active' : ''}>తెలుగు</span>
            </button>
          </div>
        </div>
        {title && <h1 className="page-title-bar">{title}</h1>}
      </header>

      {sheet === 'search' && <SearchSheet onClose={() => setSheet(null)} />}
      {sheet === 'notifications' && <NotificationSheet onClose={() => setSheet(null)} />}
    </>
  );
}

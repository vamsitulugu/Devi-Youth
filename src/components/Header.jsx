import { ChevronLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import Toranam from './Toranam';
import AppQrCode from './AppQrCode';

export default function Header({ title, showBack = false, onBack }) {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();

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
      </header>
      {title && <h1 className="page-title-bar">{title}</h1>}
    </>
  );
}
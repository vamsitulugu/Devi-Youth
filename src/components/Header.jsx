import { ChevronLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import Toranam from './Toranam';

export default function Header({ title, showBack = false, onBack }) {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();

  return (
    <header className="app-header">
      <div className="app-header-row">
        {showBack ? (
          <button className="back-btn" onClick={onBack || (() => navigate(-1))} aria-label="Go back">
            <ChevronLeft size={22} />
          </button>
        ) : (
          <Link to="/" className="brand" aria-label="Home">
            <img src="/icon-192.png" alt="" className="brand-logo" />
          </Link>
        )}
        <h1 className="title">{title}</h1>
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
      <Toranam />
    </header>
  );
}
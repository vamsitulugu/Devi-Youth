import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import Toranam from './Toranam';

export default function Header({ title, showBack = false }) {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();

  return (
    <>
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
          onClick={() => setLang(lang === 'en' ? 'te' : 'en')}
          aria-label="Switch language"
        >
          <span className={lang === 'en' ? 'active' : ''}>EN</span>
          <span className="sep">|</span>
          <span className={lang === 'te' ? 'active' : ''}>తెలుగు</span>
        </button>
      </header>
      <Toranam />
    </>
  );
}

import { useEffect } from 'react';
import { ChevronLeft, Download } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '../i18n/LanguageContext';
import { useAppMeta, APK_DOWNLOAD_URL } from '../hooks/useAppMeta';
import Toranam from './Toranam';

export default function Header({ title, showBack = false, onBack }) {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();
  const meta = useAppMeta();
  const showDownload = !Capacitor.isNativePlatform() && Boolean(meta);

  useEffect(() => {
    document.title = title ? `${title} — ${t('app_name')}` : `${t('app_name')} — ${t('app_tag')}`;
  }, [title, t, lang]);

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
          {showDownload && (
            <a
              href={APK_DOWNLOAD_URL}
              download
              className="lang-toggle header-download-btn"
              aria-label={t('app_download_button')}
              title={t('app_download_button')}
            >
              <Download size={14} />
            </a>
          )}
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
      </header>
      {title && <h1 className="page-title-bar">{title}</h1>}
    </>
  );
}
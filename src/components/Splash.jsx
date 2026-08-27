import { useLanguage } from '../i18n/LanguageContext';

export default function Splash() {
  const { t } = useLanguage();
  return (
    <div className="splash">
      <div className="emblem">
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="20" r="10" fill="#F6B93B" />
          <path d="M16 40c0-8 4.5-14 10-14s10 6 10 14" stroke="#F6B93B" strokeWidth="3" strokeLinecap="round" />
          <circle cx="26" cy="20" r="3" fill="#C22B1F" />
        </svg>
      </div>
      <h1>{t('app_name')}</h1>
      <p className="tag">{t('app_tag')}</p>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8 }}>{t('splash_loading')}</p>
    </div>
  );
}

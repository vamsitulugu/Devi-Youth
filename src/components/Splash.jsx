import { useLanguage } from '../i18n/LanguageContext';
import logo from '../assets/logo.png';

export default function Splash() {
  const { t } = useLanguage();
  return (
    <div className="splash">
      <div className="emblem">
        <img src={logo} alt="" width={72} height={72} style={{ borderRadius: '50%', display: 'block' }} />
      </div>
      <h1>{t('app_name')}</h1>
      <p className="tag">{t('app_tag')}</p>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8 }}>{t('splash_loading')}</p>
    </div>
  );
}

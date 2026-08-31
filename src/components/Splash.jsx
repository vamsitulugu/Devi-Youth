import { useLanguage } from '../i18n/LanguageContext';
import logo from '../assets/logo.png';

/**
 * Splash v2 — the emblem blooms in, three toranam rings ripple outward,
 * and a marigold bar tracks the 1100ms boot window in App.jsx.
 * Same logo, same copy keys.
 */
export default function Splash() {
  const { t } = useLanguage();
  return (
    <div className="splash-v2">
      <div className="splash-v2-rings" aria-hidden="true">
        <span className="splash-v2-ring" style={{ animationDelay: '0ms' }} />
        <span className="splash-v2-ring" style={{ animationDelay: '650ms' }} />
        <span className="splash-v2-ring" style={{ animationDelay: '1300ms' }} />
      </div>
      <div className="splash-v2-emblem">
        <img src={logo} alt="" width={78} height={78} style={{ borderRadius: '50%', display: 'block' }} />
      </div>
      <h1>{t('app_name')}</h1>
      <p className="tag">{t('app_tag')}</p>
      <div className="splash-v2-bar"><span /></div>
      <p className="loading">{t('splash_loading')}</p>
    </div>
  );
}

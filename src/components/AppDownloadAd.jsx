import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Download, X, Smartphone } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAppMeta, APK_DOWNLOAD_URL } from '../hooks/useAppMeta';

const FIRST_SHOW_DELAY_MS = 4_000;
const REPEAT_EVERY_MS = 9 * 60 * 1000;
const VISIBLE_FOR_MS = 3_000;

export default function AppDownloadAd() {
  const { t } = useLanguage();
  const meta = useAppMeta();
  const [visible, setVisible] = useState(false);

  // Never inside the installed native app (it would be nagging someone
  // to download the app they're already using), and never before a
  // real APK has actually been published — see useAppMeta.
  const eligible = !Capacitor.isNativePlatform() && Boolean(meta);

  useEffect(() => {
    if (!eligible) return;

    let hideTimer;
    function show() {
      setVisible(true);
      hideTimer = setTimeout(() => setVisible(false), VISIBLE_FOR_MS);
    }

    const firstTimer = setTimeout(show, FIRST_SHOW_DELAY_MS);
    const repeatTimer = setInterval(show, REPEAT_EVERY_MS);

    return () => {
      clearTimeout(firstTimer);
      clearTimeout(hideTimer);
      clearInterval(repeatTimer);
    };
  }, [eligible]);

  if (!eligible || !visible) return null;

  return (
    <div className="app-download-ad" role="dialog" aria-label={t('app_download_ad_title')}>
      <div className="app-download-ad-icon"><Smartphone size={20} /></div>
      <div className="app-download-ad-copy">
        <div className="app-download-ad-title">{t('app_download_ad_title')}</div>
        <div className="app-download-ad-body">{t('app_download_ad_body')}</div>
      </div>
      <a href={APK_DOWNLOAD_URL} download className="btn btn-primary btn-sm app-download-ad-btn">
        <Download size={14} /> {t('app_download_button')}
      </a>
      <button className="app-download-ad-close" onClick={() => setVisible(false)} aria-label="Close">
        <X size={16} />
      </button>
    </div>
  );
}

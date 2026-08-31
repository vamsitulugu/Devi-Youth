import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Download, X, Smartphone } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAppMeta } from '../hooks/useAppMeta';
import AppQrCode from './AppQrCode';

const SHOW_DELAY_MS = 4_000;

export default function AppDownloadAd() {
  const { t } = useLanguage();
  const meta = useAppMeta();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Never inside the installed native app (it would be nagging someone
  // to download the app they're already using), and never before a
  // real APK has actually been published — see useAppMeta.
  const eligible = !Capacitor.isNativePlatform() && Boolean(meta?.downloadUrl);

  useEffect(() => {
    if (!eligible) return undefined;
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [eligible]);

  if (!eligible || !visible || dismissed) return null;

  return (
    <div className="app-download-ad" role="dialog" aria-label={t('app_download_ad_title')}>
      <div className="app-download-ad-icon"><Smartphone size={20} /></div>
      <div className="app-download-ad-copy">
        <div className="app-download-ad-title">{t('app_download_ad_title')}</div>
        <div className="app-download-ad-body">{t('app_download_ad_body')}</div>
      </div>
      <div className="app-download-ad-actions">
        <a href={meta?.downloadUrl} download="devi-youth.apk" className="btn btn-primary btn-sm app-download-ad-btn">
          <Download size={14} /> {t('app_download_button')}
        </a>
        <AppQrCode variant="icon" />
      </div>
      <button className="app-download-ad-close" onClick={() => setDismissed(true)} aria-label="Close">
        <X size={16} />
      </button>
    </div>
  );
}

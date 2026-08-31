import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift, Ticket, Users, Clock3, Phone, ChevronRight, LogIn, HeartHandshake,
  Download, Smartphone, Heart, WifiOff,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '../i18n/LanguageContext';
import { useAppMeta } from '../hooks/useAppMeta';
import { useFavorites } from '../hooks/useFavorites';
import Header from '../components/Header';
import AppQrCode from '../components/AppQrCode';
import Reveal from '../components/Reveal';
import SavedPhotosSheet from '../components/SavedPhotosSheet';

const links = [
  { to: '/donations', icon: HeartHandshake, key: 'donations_title' },
  { to: '/laddu', icon: Gift, key: 'laddu_title' },
  { to: '/lottery', icon: Ticket, key: 'lottery_title' },
  { to: '/committee', icon: Users, key: 'committee_title' },
  { to: '/history', icon: Clock3, key: 'history_title' },
  { to: '/contacts', icon: Phone, key: 'contacts_title' },
];

const COPY = { en: { saved: 'Saved Photos', offline: "You're offline — showing what's already loaded." }, te: { saved: 'సేవ్ చేసిన ఫోటోలు', offline: 'ఆఫ్‌లైన్‌లో ఉన్నారు — ముందుగా లోడ్ అయినవి చూపిస్తున్నాం.' } };

const COMMITTEE_LOGIN_PATH = '/admin/login';

function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

export default function More() {
  const { t, lang } = useLanguage();
  const c = COPY[lang] || COPY.en;
  const meta = useAppMeta();
  const { count } = useFavorites();
  const online = useOnline();
  const [savedOpen, setSavedOpen] = useState(false);
  const downloadEligible = !Capacitor.isNativePlatform() && Boolean(meta?.downloadUrl);

  return (
    <>
      <Header title={t('nav_more')} />
      {!online && (
        <div className="offline-strip"><WifiOff size={14} /> {c.offline}</div>
      )}
      <div className="page">
        {downloadEligible && (
          <Reveal as="div" className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
              <div className="icon-badge"><Smartphone size={18} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{t('app_download_ad_title')}</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)', marginTop: 1 }}>
                  {t('app_download_ad_body')}
                </div>
              </div>
              <a href={meta.downloadUrl} download="devi-youth.apk" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                <Download size={14} /> {t('app_download_button')}
              </a>
              <AppQrCode variant="icon" />
            </div>
          </Reveal>
        )}

        <Reveal as="div" delay={40} className="card" style={{ overflow: 'hidden' }}>
          <button
            onClick={() => setSavedOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', width: '100%',
              borderBottom: '1px solid var(--color-border)', textAlign: 'left',
            }}
          >
            <div className="icon-badge"><Heart size={18} /></div>
            <span style={{ flex: 1, fontWeight: 600 }}>{c.saved}</span>
            {count > 0 && <span className="chip chip-danger">{count}</span>}
            <ChevronRight size={18} color="var(--color-border)" />
          </button>
          {links.map(({ to, icon: Icon, key }, i) => (
            <Link
              key={to}
              to={to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderBottom: i < links.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <div className="icon-badge"><Icon size={18} /></div>
              <span style={{ flex: 1, fontWeight: 600 }}>{t(key)}</span>
              <ChevronRight size={18} color="var(--color-border)" />
            </Link>
          ))}
        </Reveal>

        <Reveal as="div" delay={80} className="card" style={{ overflow: 'hidden' }}>
          <Link
            to={COMMITTEE_LOGIN_PATH}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}
          >
            <div className="icon-badge"><LogIn size={18} /></div>
            <span style={{ flex: 1, fontWeight: 600 }}>{t('committee_login')}</span>
            <ChevronRight size={18} color="var(--color-border)" />
          </Link>
        </Reveal>
      </div>

      {savedOpen && <SavedPhotosSheet onClose={() => setSavedOpen(false)} />}
    </>
  );
}

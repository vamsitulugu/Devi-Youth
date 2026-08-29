import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import Header from '../components/Header';

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <>
      <Header title="404" />
      <div className="page" style={{ alignItems: 'center', textAlign: 'center', paddingTop: 48 }}>
        <div
          style={{
            width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle, var(--color-surface-alt) 55%, transparent 100%)',
            boxShadow: '0 0 0 1px var(--color-border) inset',
          }}
        >
          <Compass size={34} color="var(--color-marigold-text)" strokeWidth={1.5} />
        </div>
        <h2>{t('not_found_title')}</h2>
        <p style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--fs-sm)' }}>
          {t('not_found_body')}
        </p>
        <Link to="/" className="btn btn-primary">{t('nav_home')}</Link>
      </div>
    </>
  );
}

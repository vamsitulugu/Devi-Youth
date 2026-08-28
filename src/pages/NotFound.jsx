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
        <Compass size={40} color="var(--color-border)" />
        <h2>{t('not_found_title')}</h2>
        <p style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--fs-sm)' }}>
          {t('not_found_body')}
        </p>
        <Link to="/" className="btn btn-primary">{t('nav_home')}</Link>
      </div>
    </>
  );
}

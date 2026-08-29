import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export function PageSkeleton({ rows = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card card-pad skeleton-row" style={{ height: 76 }} />
      ))}
    </div>
  );
}

export function PageError({ message, onRetry }) {
  const { t } = useLanguage();
  return (
    <div className="card empty-state">
      <AlertTriangle className="icon" size={28} />
      <div>{message || t('page_error')}</div>
      {onRetry && (
        <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 10 }} onClick={onRetry}>
          {t('retry')}
        </button>
      )}
    </div>
  );
}
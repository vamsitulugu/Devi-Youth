import { Clock3 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getHistory } from '../services/api';
import PhotoTile from '../components/PhotoTile';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import { PageSkeleton, PageError } from '../components/LoadingStates';

export default function History() {
  const { t, lang } = useLanguage();
  const { data: history, loading, error, reload } = useAsyncData(getHistory, []);

  return (
    <>
      <Header title={t('history_title')} />
      <div className="page">
        {loading && <PageSkeleton rows={3} />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && (!history || history.length === 0) && (
          <EmptyState icon={Clock3} title={t('history_empty')} subtitle={t('history_empty_sub')} />
        )}
        {!loading && !error && history?.length > 0 && (
          <div className="timeline">
            {history.map((h) => (
              <div className="timeline-item" key={h.year}>
                <h3>{h.year}</h3>
                <div className="card card-pad" style={{ marginTop: 8 }}>
                  {h.highlight?.[lang] && (
                    <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-ink-soft)' }}>{h.highlight[lang]}</p>
                  )}
                  <div className="hscroll" style={{ marginTop: 10 }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <PhotoTile key={i} wide />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
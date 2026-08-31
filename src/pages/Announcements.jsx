import { useMemo, useState } from 'react';
import { CalendarDays, Megaphone } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { useCloseOnBack } from '../hooks/useCloseOnBack';
import { getAnnouncements } from '../services/api';
import PhotoTile from '../components/PhotoTile';
import WhatsAppShare from '../components/WhatsAppShare';
import Header from '../components/Header';
import PhotoViewer from '../components/PhotoViewer';
import EmptyState from '../components/EmptyState';
import Reveal from '../components/Reveal';
import { PageSkeleton, PageError } from '../components/LoadingStates';

const COPY = { en: { all: 'All', important: 'Important' }, te: { all: 'అన్నీ', important: 'ముఖ్యమైనవి' } };

export default function Announcements() {
  const { t, lang } = useLanguage();
  const c = COPY[lang] || COPY.en;
  const { data: announcements, loading, error, reload } = useAsyncData(getAnnouncements, []);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [filter, setFilter] = useState('all');
  useCloseOnBack(viewerIndex !== null, () => setViewerIndex(null));

  const photos = useMemo(
    () => (announcements || [])
      .filter((a) => a.image)
      .map((a) => ({ id: a.id, src: a.image, caption: a.title?.[lang] })),
    [announcements, lang]
  );

  const importantCount = (announcements || []).filter((a) => a.important).length;
  const visible = (announcements || []).filter((a) => filter === 'all' || a.important);

  return (
    <>
      <Header title={t('announcements_title')} />
      <div className="page">
        {loading && <PageSkeleton />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && announcements?.length === 0 && (
          <EmptyState icon={Megaphone} title={t('announcements_empty')} subtitle={t('announcements_empty_sub')} />
        )}

        {!loading && !error && announcements?.length > 0 && importantCount > 0 && (
          <div className="search-scopes" style={{ padding: 0, margin: 0 }}>
            <button className={`scope-pill${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>{c.all}</button>
            <button className={`scope-pill${filter === 'important' ? ' active' : ''}`} onClick={() => setFilter('important')}>{c.important} · {importantCount}</button>
          </div>
        )}

        {!loading && !error && visible.map((a, i) => {
          const photoIndex = a.image ? photos.findIndex((p) => p.id === a.id) : -1;
          return (
            <Reveal key={a.id} delay={Math.min(i, 6) * 40} as="div" className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {a.image && (
                <PhotoTile
                  src={a.image}
                  alt=""
                  wide
                  onClick={photoIndex >= 0 ? () => setViewerIndex(photoIndex) : undefined}
                />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {a.important && <span className="chip chip-danger">{t('important')}</span>}
                <span className="meta" style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)' }}>
                  <CalendarDays size={12} style={{ verticalAlign: -2 }} /> {a.date}
                </span>
              </div>
              <div className="title" style={{ fontSize: 'var(--fs-md)' }}>{a.title?.[lang] || ''}</div>
              <div className="desc" style={{ fontSize: 'var(--fs-sm)' }}>{a.body?.[lang] || ''}</div>
              <div>
                <WhatsAppShare text={`🙏 ${a.title?.[lang] || ''}\n\n${a.body?.[lang] || ''}`} />
              </div>
            </Reveal>
          );
        })}
      </div>

      {viewerIndex !== null && photos.length > 0 && (
        <PhotoViewer
          photos={photos}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}

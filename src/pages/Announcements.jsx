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
import { PageSkeleton, PageError } from '../components/LoadingStates';

export default function Announcements() {
  const { t, lang } = useLanguage();
  const { data: announcements, loading, error, reload } = useAsyncData(getAnnouncements, []);
  const [viewerIndex, setViewerIndex] = useState(null);
  useCloseOnBack(viewerIndex !== null, () => setViewerIndex(null));

  const photos = useMemo(
    () => (announcements || [])
      .filter((a) => a.image)
      .map((a) => ({ id: a.id, src: a.image, caption: a.title?.[lang] })),
    [announcements, lang]
  );

  return (
    <>
      <Header title={t('announcements_title')} />
      <div className="page">
        {loading && <PageSkeleton />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && announcements?.length === 0 && (
          <EmptyState icon={Megaphone} title={t('announcements_empty')} subtitle={t('announcements_empty_sub')} />
        )}
        {!loading && !error && announcements?.map((a) => {
          const photoIndex = a.image ? photos.findIndex((p) => p.id === a.id) : -1;
          return (
          <div className="card card-pad" key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
          </div>
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
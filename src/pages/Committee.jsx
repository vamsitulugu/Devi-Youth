import { useMemo, useState } from 'react';
import { Phone, Users } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getCommittee } from '../services/api';
import PhotoTile from '../components/PhotoTile';
import Header from '../components/Header';
import PhotoViewer from '../components/PhotoViewer';
import EmptyState from '../components/EmptyState';
import { PageSkeleton, PageError } from '../components/LoadingStates';

export default function Committee() {
  const { t, lang } = useLanguage();
  const { data: committee, loading, error, reload } = useAsyncData(getCommittee, []);
  const [viewerIndex, setViewerIndex] = useState(null);

  // Only members with a real photo can be opened in the lightbox; keep a
  // parallel index map so clicking a tile opens the right photo.
  const photos = useMemo(
    () => (committee || [])
      .filter((m) => m.photo)
      .map((m) => ({ id: m.id, src: m.photo, caption: m.name })),
    [committee]
  );

  return (
    <>
      <Header title={t('committee_title')} />
      <div className="page">
        {loading && <PageSkeleton rows={4} />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && (!committee || committee.length === 0) && (
          <EmptyState icon={Users} title={t('committee_empty')} subtitle={t('committee_empty_sub')} />
        )}
        {!loading && !error && committee?.length > 0 && (
          <div className="committee-grid">
            {committee.map((m) => {
              const photoIndex = m.photo ? photos.findIndex((p) => p.id === m.id) : -1;
              return (
                <div className="card member-card" key={m.id}>
                  <PhotoTile
                    src={m.photo}
                    className="avatar"
                    style={photoIndex >= 0 ? { cursor: 'zoom-in' } : undefined}
                    onClick={photoIndex >= 0 ? () => setViewerIndex(photoIndex) : undefined}
                  />
                  <div className="name">{m.name}</div>
                  <div className="position">{m.position[lang]}</div>
                  {m.phone && (
                    <a className="btn btn-outline btn-sm" href={`tel:${m.phone}`}>
                      <Phone size={13} /> {t('contact')}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
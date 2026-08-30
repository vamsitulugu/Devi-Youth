import { useCallback, useState } from 'react';
import { ChevronRight, ImageIcon } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getGalleryYears, getGalleryAlbums, getAlbumPhotos } from '../services/api';
import Header from '../components/Header';
import PhotoViewer from '../components/PhotoViewer';
import EmptyState from '../components/EmptyState';
import { PageSkeleton, PageError } from '../components/LoadingStates';

export default function Gallery() {
  const { t, lang } = useLanguage();
  const [openAlbum, setOpenAlbum] = useState(null);

  const fetchTimeline = useCallback(async () => {
    const years = await getGalleryYears();
    const albumsByYear = await Promise.all(years.map((y) => getGalleryAlbums(y)));
    return years
      .map((year, i) => ({ year, albums: albumsByYear[i] }))
      .filter((yr) => yr.albums.length > 0);
  }, []);
  const { data: timeline, loading, error, reload } = useAsyncData(fetchTimeline, []);

  if (openAlbum) {
    return (
      <AlbumView
        album={openAlbum}
        lang={lang}
        t={t}
        onBack={() => setOpenAlbum(null)}
      />
    );
  }

  return (
    <>
      <Header title={t('gallery_title')} />
      <div className="page">
        {loading && <PageSkeleton rows={2} />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && timeline?.length === 0 && (
          <EmptyState icon={ImageIcon} title={t('gallery_empty')} subtitle={t('gallery_empty_sub')} />
        )}
        {!loading && !error && timeline?.length > 0 && (
          <div className="gallery-timeline">
            {timeline.map(({ year, albums }, i) => (
              <div className="timeline-row" key={year}>
                <div className="timeline-rail">
                  <span className="timeline-dot" />
                  {i < timeline.length - 1 && <span className="timeline-line" />}
                </div>
                <div className="timeline-body">
                  <h3 className="timeline-year">{year}</h3>
                  <div className="album-grid">
                    {albums.map((a) => (
                      <button key={a.id} className="card album-card" onClick={() => setOpenAlbum(a)}>
                        <div className="album-cover">
                          {a.cover ? (
                            <img src={a.cover} alt="" loading="lazy" decoding="async" />
                          ) : (
                            <div className="album-cover-empty">
                              <ImageIcon size={26} strokeWidth={1.5} />
                              {/* Only claim "no photos" when that's actually true — if
                                  count > 0 but no cover is set yet, just show the icon
                                  so it doesn't contradict the count badge below. */}
                              {a.count === 0 && <span>{t('gallery_no_photos_yet')}</span>}
                            </div>
                          )}
                          {a.count > 0 && (
                            <span className="album-cover-badge">{a.count} {t('gallery_photos_word')}</span>
                          )}
                        </div>
                        <div className="album-info">
                          <span className="album-name">{a.album[lang]}</span>
                          <ChevronRight size={18} className="album-chevron" />
                        </div>
                      </button>
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

function AlbumView({ album, lang, t, onBack }) {
  const fetchPhotos = useCallback(() => getAlbumPhotos(album.id), [album.id]);
  const { data: photos, loading, error, reload } = useAsyncData(fetchPhotos, [album.id]);
  const [viewerIndex, setViewerIndex] = useState(null);

  return (
    <>
      <Header title={album.album[lang]} showBack onBack={onBack} />
      <div className="page">
        {loading && <PageSkeleton rows={2} />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && (!photos || photos.length === 0) && (
          <EmptyState icon={ImageIcon} title={t('gallery_album_empty')} subtitle={t('gallery_album_empty_sub')} />
        )}
        {!loading && !error && photos?.length > 0 && (
          <div className="gallery-grid">
            {photos.map((p, i) => (
              <img
                key={p.id}
                src={p.src}
                alt=""
                loading="lazy"
                decoding="async"
                onClick={() => setViewerIndex(i)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </div>
        )}
      </div>

      {viewerIndex !== null && photos && (
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
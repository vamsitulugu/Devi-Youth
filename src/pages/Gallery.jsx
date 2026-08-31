import { useCallback, useState } from 'react';
import { ChevronRight, ImageIcon, Heart, Play } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { useCloseOnBack } from '../hooks/useCloseOnBack';
import { useFavorites } from '../hooks/useFavorites';
import { getGalleryYears, getGalleryAlbums, getAlbumPhotos } from '../services/api';
import Header from '../components/Header';
import PhotoViewer from '../components/PhotoViewer';
import EmptyState from '../components/EmptyState';
import Reveal from '../components/Reveal';
import { PageSkeleton, PageError } from '../components/LoadingStates';

export default function Gallery() {
  const { t, lang } = useLanguage();
  const [openAlbum, setOpenAlbum] = useState(null);
  useCloseOnBack(!!openAlbum, () => setOpenAlbum(null));

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
              <Reveal key={year} delay={Math.min(i, 4) * 60} as="div" className="timeline-row">
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
              </Reveal>
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
  const { isFav, toggle } = useFavorites();
  useCloseOnBack(viewerIndex !== null, () => setViewerIndex(null));

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
            {photos.map((p, i) => {
              const isVideo = p.type === 'video' || Boolean(p.videoUrl);
              return (
                <div className="photo-wrap" key={p.id}>
                  {isVideo ? (
                    <div className="video-tile" onClick={() => setViewerIndex(i)} style={{ aspectRatio: 1, cursor: 'pointer' }}>
                      <img src={p.thumbnail || p.src} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                      <div className="play"><span className="play-ring"><Play size={16} fill="#fff" /></span></div>
                      {p.duration && <span className="dur">{p.duration}</span>}
                    </div>
                  ) : (
                    <img
                      src={p.src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onClick={() => setViewerIndex(i)}
                      style={{ cursor: 'pointer' }}
                    />
                  )}
                  <button
                    className={`fav-btn${isFav(p.id) ? ' on' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggle(p.id); }}
                    aria-pressed={isFav(p.id)}
                    aria-label="Save"
                  >
                    <Heart size={15} fill={isFav(p.id) ? 'currentColor' : 'none'} strokeWidth={2.2} />
                  </button>
                </div>
              );
            })}
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

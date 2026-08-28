import { useCallback, useState } from 'react';
import { ArrowLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getGalleryYears, getGalleryAlbums, getAlbumPhotos } from '../services/api';
import Header from '../components/Header';
import PhotoViewer from '../components/PhotoViewer';
import EmptyState from '../components/EmptyState';
import { PageSkeleton, PageError } from '../components/LoadingStates';

export default function Gallery() {
  const { t, lang } = useLanguage();
  const { data: years, loading: yearsLoading } = useAsyncData(getGalleryYears, []);
  const [year, setYear] = useState(null);
  const [openAlbum, setOpenAlbum] = useState(null);

  const activeYear = year ?? years?.[0];
  const fetchAlbums = useCallback(() => getGalleryAlbums(activeYear), [activeYear]);
  const { data: albums, loading: albumsLoading, error } = useAsyncData(fetchAlbums, [activeYear]);

  const loading = yearsLoading || (!!activeYear && albumsLoading);

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
        {years?.length > 0 && (
          <div className="year-pills">
            {years.map((y) => (
              <button
                key={y}
                className={`year-pill${y === activeYear ? ' active' : ''}`}
                onClick={() => setYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        {loading && <PageSkeleton rows={2} />}
        {!loading && error && <PageError />}
        {!loading && !error && albums?.length === 0 && (
          <EmptyState icon={ImageIcon} title={t('gallery_empty')} subtitle={t('gallery_empty_sub')} />
        )}
        {!loading && !error && albums?.length > 0 && (
          <div className="album-grid">
            {albums.map((a) => (
              <button key={a.id} className="card album-card" onClick={() => setOpenAlbum(a)}>
                <div className="album-cover">
                  {a.cover ? (
                    <img src={a.cover} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <div className="album-cover-empty">
                      <ImageIcon size={28} strokeWidth={1.5} />
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
        )}
      </div>
    </>
  );
}

function AlbumView({ album, lang, t, onBack }) {
  const fetchPhotos = useCallback(() => getAlbumPhotos(album.id), [album.id]);
  const { data: photos, loading, error } = useAsyncData(fetchPhotos, [album.id]);
  const [viewerIndex, setViewerIndex] = useState(null);

  return (
    <>
      <Header title={album.album[lang]} />
      <div className="page">
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', fontWeight: 600, color: 'var(--color-vermillion)' }}
        >
          <ArrowLeft size={16} /> {t('gallery_all_albums')}
        </button>

        {loading && <PageSkeleton rows={2} />}
        {!loading && error && <PageError />}
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
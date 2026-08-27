import { useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getGalleryYears, getGalleryAlbums } from '../services/api';
import PhotoTile from '../components/PhotoTile';
import Header from '../components/Header';
import { PageSkeleton, PageError } from '../components/LoadingStates';

export default function Gallery() {
  const { t, lang } = useLanguage();
  const { data: years, loading: yearsLoading } = useAsyncData(getGalleryYears, []);
  const [year, setYear] = useState(null);
  const [active, setActive] = useState(null);

  const activeYear = year ?? years?.[0];
  const fetchAlbums = useCallback(() => getGalleryAlbums(activeYear), [activeYear]);
  const { data: albums, loading: albumsLoading, error } = useAsyncData(fetchAlbums, [activeYear]);

  const loading = yearsLoading || (!!activeYear && albumsLoading);

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
          <div className="card empty-state">{t('gallery_empty')}</div>
        )}
        {!loading && !error && albums?.length > 0 && (
          <div className="gallery-grid">
            {albums.map((p) => (
              <PhotoTile key={p.id} src={p.cover} onClick={() => setActive(p)} />
            ))}
          </div>
        )}
      </div>

      {active && (
        <div className="lightbox" onClick={() => setActive(null)}>
          <button className="close-btn" onClick={() => setActive(null)} aria-label="Close">
            <X size={26} />
          </button>
          <PhotoTile src={active.cover} wide />
          <div className="caption">{active.album[lang]} · {activeYear}</div>
        </div>
      )}
    </>
  );
}

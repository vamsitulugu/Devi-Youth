import { useEffect, useMemo, useState } from 'react';
import { Heart, X, ImageIcon } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useFavorites } from '../hooks/useFavorites';
import { getGalleryYears, getGalleryAlbums, getAlbumPhotos } from '../services/api';
import PhotoViewer from './PhotoViewer';

const COPY = {
  en: { title: 'Saved Photos', empty: 'Nothing saved yet', emptySub: 'Tap the heart on any photo in the Gallery or Home to keep it here.' },
  te: { title: 'సేవ్ చేసిన ఫోటోలు', empty: 'ఇంకా ఏమీ సేవ్ చేయలేదు', emptySub: 'గ్యాలరీ లేదా హోమ్‌లో ఏ ఫోటోపైనైనా హార్ట్ నొక్కితే అది ఇక్కడ ఉంటుంది.' },
};

/** Bottom sheet listing every photo the villager has hearted, pulled from
 * across all years/albums so it works regardless of where they saved it. */
export default function SavedPhotosSheet({ onClose }) {
  const { lang } = useLanguage();
  const c = COPY[lang] || COPY.en;
  const { ids, isFav, toggle } = useFavorites();
  const [all, setAll] = useState(null);
  const [closing, setClosing] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const years = await getGalleryYears();
        const albumLists = await Promise.all(years.map((y) => getGalleryAlbums(y)));
        const albums = albumLists.flat();
        const photoLists = await Promise.all(albums.map((a) => getAlbumPhotos(a.id).catch(() => [])));
        if (!alive) return;
        setAll(photoLists.flat());
      } catch {
        if (alive) setAll([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const saved = useMemo(() => (all || []).filter((p) => ids.includes(String(p.id))), [all, ids]);

  const close = () => { setClosing(true); setTimeout(onClose, 200); };

  return (
    <>
      <div className="sheet-backdrop" onClick={close} />
      <div className={`sheet${closing ? ' sheet-closing' : ''}`} role="dialog" aria-modal="true">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h2>{c.title}</h2>
          <button className="sheet-close" onClick={close} aria-label="Close"><X size={17} /></button>
        </div>
        <div className="sheet-body">
          {all === null && <div className="search-empty">…</div>}
          {all !== null && saved.length === 0 && (
            <div className="search-empty">
              <Heart size={28} color="var(--color-border)" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{c.empty}</div>
              <div style={{ marginTop: 6 }}>{c.emptySub}</div>
            </div>
          )}
          {saved.length > 0 && (
            <div className="gallery-grid">
              {saved.map((p, i) => (
                <div className="photo-wrap" key={p.id}>
                  <img
                    src={p.src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onClick={() => setViewerIndex(i)}
                    style={{ cursor: 'zoom-in' }}
                  />
                  <button
                    className="fav-btn on"
                    onClick={(e) => { e.stopPropagation(); toggle(p.id); }}
                    aria-label="Unsave"
                  >
                    <Heart size={15} fill="currentColor" strokeWidth={2.2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {viewerIndex !== null && saved.length > 0 && (
        <PhotoViewer
          photos={saved}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}

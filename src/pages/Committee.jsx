import { useMemo, useState } from 'react';
import { Users, QrCode } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { useCloseOnBack } from '../hooks/useCloseOnBack';
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
  const [qrViewerIndex, setQrViewerIndex] = useState(null);
  useCloseOnBack(viewerIndex !== null || qrViewerIndex !== null, () => {
    setViewerIndex(null);
    setQrViewerIndex(null);
  });

  // Only members with a real photo can be opened in the lightbox; keep a
  // parallel index map so clicking a tile opens the right photo.
  const photos = useMemo(
    () => (committee || [])
      .filter((m) => m.photo)
      .map((m) => ({
        id: m.id,
        src: m.photo,
        caption: m.name,
        subtitle: [m.position[lang], m.phone].filter(Boolean).join(' · '),
      })),
    [committee, lang]
  );

  // Same pattern, but for each member's own donation QR code — kept as a
  // separate list/viewer from the profile photos above so tapping one
  // never mixes with the other, and so someone can page through just the
  // QR codes if several members have one set.
  const qrPhotos = useMemo(
    () => (committee || [])
      .filter((m) => m.qr)
      .map((m) => ({
        id: m.id,
        src: m.qr,
        caption: m.name,
        subtitle: t('committee_scan_to_pay'),
      })),
    [committee, t]
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
              const qrIndex = m.qr ? qrPhotos.findIndex((p) => p.id === m.id) : -1;
              return (
                <div className="member-card" key={m.id}>
                  <PhotoTile
                    src={m.photo}
                    className="avatar"
                    style={photoIndex >= 0 ? { cursor: 'zoom-in' } : undefined}
                    onClick={photoIndex >= 0 ? () => setViewerIndex(photoIndex) : undefined}
                  />
                  <div className="name">{m.name}</div>
                  {m.position?.[lang] && <div className="position">{m.position[lang]}</div>}
                  {qrIndex >= 0 && (
                    <button
                      type="button"
                      className="member-qr-btn"
                      onClick={() => setQrViewerIndex(qrIndex)}
                      aria-label={`${t('committee_scan_to_pay')} — ${m.name}`}
                    >
                      <img src={m.qr} alt="" className="member-qr-thumb" />
                      <span><QrCode size={12} /> {t('committee_scan_to_pay')}</span>
                    </button>
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

      {qrViewerIndex !== null && qrPhotos.length > 0 && (
        <PhotoViewer
          photos={qrPhotos}
          index={qrViewerIndex}
          onIndexChange={setQrViewerIndex}
          onClose={() => setQrViewerIndex(null)}
        />
      )}
    </>
  );
}
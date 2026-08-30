import { useMemo, useState } from 'react';
import { HeartHandshake, QrCode } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { useCloseOnBack } from '../hooks/useCloseOnBack';
import { getCommittee } from '../services/api';
import PhotoTile from '../components/PhotoTile';
import Header from '../components/Header';
import PhotoViewer from '../components/PhotoViewer';
import EmptyState from '../components/EmptyState';
import { PageSkeleton, PageError } from '../components/LoadingStates';

export default function Donations() {
  const { t, lang } = useLanguage();
  const { data: committee, loading, error, reload } = useAsyncData(getCommittee, []);
  const [viewerIndex, setViewerIndex] = useState(null);
  useCloseOnBack(viewerIndex !== null, () => setViewerIndex(null));

  // Only members who actually have a QR uploaded get a block — and only
  // those can be opened full-screen in the lightbox for an easy scan.
  const withQr = useMemo(() => (committee || []).filter((m) => m.qr), [committee]);
  const qrPhotos = useMemo(
    () => withQr.map((m) => ({
      id: m.id,
      src: m.qr,
      caption: m.name,
      subtitle: [m.position[lang], m.phone].filter(Boolean).join(' · '),
    })),
    [withQr, lang]
  );

  return (
    <>
      <Header title={t('donations_title')} />
      <div className="page">
        {loading && <PageSkeleton rows={3} />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && withQr.length === 0 && (
          <EmptyState icon={HeartHandshake} title={t('donations_empty')} subtitle={t('donations_empty_sub')} />
        )}
        {!loading && !error && withQr.length > 0 && (
          <>
            <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <QrCode size={20} />
              <div className="meta">{t('donations_hint')}</div>
            </div>
            {withQr.map((m, i) => (
              <div className="card card-pad" key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <PhotoTile src={m.photo} alt="" className="avatar" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="title">{m.name}</div>
                    <div className="meta">{[m.position[lang], m.phone].filter(Boolean).join(' · ')}</div>
                  </div>
                </div>
                <img
                  src={m.qr}
                  alt={`${m.name} QR`}
                  onClick={() => setViewerIndex(i)}
                  style={{
                    width: '100%',
                    maxWidth: 260,
                    aspectRatio: '1 / 1',
                    objectFit: 'contain',
                    margin: '0 auto',
                    background: '#fff',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    cursor: 'zoom-in',
                  }}
                />
              </div>
            ))}
          </>
        )}
      </div>

      {viewerIndex !== null && qrPhotos.length > 0 && (
        <PhotoViewer
          photos={qrPhotos}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}

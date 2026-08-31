import { useMemo, useState } from 'react';
import { Users, QrCode, Search } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { useCloseOnBack } from '../hooks/useCloseOnBack';
import { getCommittee } from '../services/api';
import PhotoTile from '../components/PhotoTile';
import Header from '../components/Header';
import PhotoViewer from '../components/PhotoViewer';
import EmptyState from '../components/EmptyState';
import Reveal from '../components/Reveal';
import { PageSkeleton, PageError } from '../components/LoadingStates';

const COPY = { en: { search: 'Find a member…', none: 'No one matches that search.' }, te: { search: 'సభ్యుడిని వెతకండి…', none: 'ఆ పేరుతో ఎవరూ లేరు.' } };

export default function Committee() {
  const { t, lang } = useLanguage();
  const c = COPY[lang] || COPY.en;
  const { data: committee, loading, error, reload } = useAsyncData(getCommittee, []);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [qrViewerIndex, setQrViewerIndex] = useState(null);
  const [q, setQ] = useState('');
  useCloseOnBack(viewerIndex !== null || qrViewerIndex !== null, () => {
    setViewerIndex(null);
    setQrViewerIndex(null);
  });

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

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return committee || [];
    return (committee || []).filter((m) =>
      m.name?.toLowerCase().includes(needle) || m.position?.[lang]?.toLowerCase().includes(needle));
  }, [committee, q, lang]);

  return (
    <>
      <Header title={t('committee_title')} />
      <div className="page">
        {loading && <PageSkeleton rows={4} />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && (!committee || committee.length === 0) && (
          <EmptyState icon={Users} title={t('committee_empty')} subtitle={t('committee_empty_sub')} />
        )}

        {!loading && !error && committee?.length > 6 && (
          <div className="search-bar" style={{ margin: 0 }}>
            <Search size={16} strokeWidth={2.4} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={c.search} aria-label={c.search} />
          </div>
        )}

        {!loading && !error && committee?.length > 0 && filtered.length === 0 && (
          <EmptyState icon={Users} title={c.none} />
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="committee-grid">
            {filtered.map((m, i) => {
              const photoIndex = m.photo ? photos.findIndex((p) => p.id === m.id) : -1;
              const qrIndex = m.qr ? qrPhotos.findIndex((p) => p.id === m.id) : -1;
              return (
                <Reveal key={m.id} delay={Math.min(i, 8) * 35} as="div" className="member-card">
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
                </Reveal>
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

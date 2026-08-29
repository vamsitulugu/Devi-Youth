import { useMemo, useState } from 'react';
import { CalendarDays, MapPin, Info, Trophy } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getLottery } from '../services/api';
import PhotoTile from '../components/PhotoTile';
import Header from '../components/Header';
import PhotoViewer from '../components/PhotoViewer';
import EmptyState from '../components/EmptyState';
import { PageSkeleton, PageError } from '../components/LoadingStates';

export default function Lottery() {
  const { t, lang } = useLanguage();
  const { data: lottery, loading, error, reload } = useAsyncData(getLottery, []);
  const [viewerIndex, setViewerIndex] = useState(null);

  const prizePhotos = useMemo(
    () => (lottery?.prizes || [])
      .filter((p) => p.image)
      .map((p) => ({ id: p.id, src: p.image, caption: p.name?.[lang] })),
    [lottery, lang]
  );

  return (
    <>
      <Header title={t('lottery_title')} />
      <div className="page">
        {loading && <PageSkeleton rows={3} />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && !lottery && (
          <EmptyState icon={Trophy} title={t('lottery_empty')} subtitle={t('lottery_empty_sub')} />
        )}
        {!loading && !error && lottery && (
          <>
            <div className="card card-pad">
              <div className="section-title" style={{ marginBottom: 8 }}><h2 style={{ fontSize: 'var(--fs-md)' }}>{t('draw_details')}</h2></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--color-border)' }}>
                <span style={{ color: 'var(--color-ink-soft)' }}><CalendarDays size={13} style={{ verticalAlign: -2 }} /> {t('auction_date')}</span>
                <span style={{ fontWeight: 700 }}>{lottery.drawDate}, {lottery.drawTime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: 'var(--color-ink-soft)' }}><MapPin size={13} style={{ verticalAlign: -2 }} /> {t('location')}</span>
                <span style={{ fontWeight: 700 }}>{lottery.location?.[lang]}</span>
              </div>
            </div>

            <section>
              <div className="section-title"><h2>{t('lottery_prizes')}</h2></div>
              {(!lottery.prizes || lottery.prizes.length === 0) && (
                <EmptyState icon={Trophy} title={t('lottery_empty')} subtitle={t('lottery_empty_sub')} />
              )}
              <div className="prize-grid">
                {lottery.prizes?.map((p) => {
                  const photoIndex = p.image ? prizePhotos.findIndex((ph) => ph.id === p.id) : -1;
                  return (
                  <div className="card prize-card" key={p.id}>
                    <PhotoTile
                      src={p.image}
                      alt=""
                      onClick={photoIndex >= 0 ? () => setViewerIndex(photoIndex) : undefined}
                    />
                    <div className="content">
                      <div className="name">{p.name[lang]}</div>
                      <div className="value">{p.value}</div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="section-title"><h2>{t('winners_title')}</h2></div>
              {lottery.winners.length === 0 ? (
                <EmptyState icon={Trophy} title={t('result_pending')} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {lottery.winners.map((w, i) => (
                    <div className="card list-card" key={i}>
                      <PhotoTile />
                      <div className="body">
                        <div className="title">{w.name}</div>
                        <div className="meta">{w.prize}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="card card-pad" style={{ display: 'flex', gap: 10, background: 'var(--color-surface-alt)' }}>
              <Info size={18} color="var(--color-brass)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-ink-soft)' }}>{t('offline_note')}</span>
            </div>

            {lottery.history?.length > 0 && (
              <section>
                <div className="section-title"><h2>{t('previous_years')}</h2></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {lottery.history.map((h) => (
                    <div className="card list-card" key={h.year}>
                      <PhotoTile />
                      <div className="body">
                        <div className="title">{h.year}</div>
                        <div className="meta">{h.topPrize?.[lang]} — {h.winner}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {viewerIndex !== null && prizePhotos.length > 0 && (
        <PhotoViewer
          photos={prizePhotos}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}
import { useMemo, useState } from 'react';
import { CalendarDays, MapPin, Info, Trophy, Share2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { useCloseOnBack } from '../hooks/useCloseOnBack';
import { getLottery } from '../services/api';
import PhotoTile from '../components/PhotoTile';
import Header from '../components/Header';
import PhotoViewer from '../components/PhotoViewer';
import EmptyState from '../components/EmptyState';
import Reveal from '../components/Reveal';
import { PageSkeleton, PageError } from '../components/LoadingStates';

const COPY = { en: { share: 'Share draw on WhatsApp', firstPrize: '1st Prize' }, te: { share: 'డ్రా వాట్సాప్‌లో పంచుకోండి', firstPrize: 'మొదటి బహుమతి' } };

function shareLottery(lottery, lang) {
  const lines = [
    '🎟️ Lottery Draw',
    `${lottery.drawDate || ''} ${lottery.drawTime || ''}`.trim(),
    lottery.location?.[lang] || '',
    '',
    ...(lottery.prizes || []).slice(0, 3).map((p) => `${p.name?.[lang] || ''} — ${p.value || ''}`),
  ].filter(Boolean);
  window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
}

export default function Lottery() {
  const { t, lang } = useLanguage();
  const c = COPY[lang] || COPY.en;
  const { data: lottery, loading, error, reload } = useAsyncData(getLottery, []);
  const [viewerIndex, setViewerIndex] = useState(null);
  useCloseOnBack(viewerIndex !== null, () => setViewerIndex(null));

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
            <Reveal as="div" className="card card-pad">
              <div className="section-title" style={{ marginBottom: 8 }}><h2 style={{ fontSize: 'var(--fs-md)' }}>{t('draw_details')}</h2></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--color-border)' }}>
                <span style={{ color: 'var(--color-ink-soft)' }}><CalendarDays size={13} style={{ verticalAlign: -2 }} /> {t('auction_date')}</span>
                <span style={{ fontWeight: 700 }}>{lottery.drawDate}, {lottery.drawTime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: 'var(--color-ink-soft)' }}><MapPin size={13} style={{ verticalAlign: -2 }} /> {t('location')}</span>
                <span style={{ fontWeight: 700 }}>{lottery.location?.[lang]}</span>
              </div>
            </Reveal>

            <button className="btn btn-outline btn-block" onClick={() => shareLottery(lottery, lang)}>
              <Share2 size={15} /> {c.share}
            </button>

            <Reveal delay={40}>
              <div className="section-title"><h2>{t('lottery_prizes')}</h2></div>
              {(!lottery.prizes || lottery.prizes.length === 0) && (
                <EmptyState icon={Trophy} title={t('lottery_empty')} subtitle={t('lottery_empty_sub')} />
              )}
              <div className="prize-grid">
                {lottery.prizes?.map((p, i) => {
                  const photoIndex = p.image ? prizePhotos.findIndex((ph) => ph.id === p.id) : -1;
                  return (
                    <div className="card prize-card" key={p.id} style={i === 0 ? { boxShadow: 'var(--shadow-glow-marigold)' } : undefined}>
                      <div style={{ position: 'relative' }}>
                        <PhotoTile
                          src={p.image}
                          alt=""
                          onClick={photoIndex >= 0 ? () => setViewerIndex(photoIndex) : undefined}
                        />
                        {i === 0 && (
                          <span className="chip" style={{ position: 'absolute', top: 6, left: 6, background: 'var(--color-turmeric)', color: '#3a2405' }}>
                            <Trophy size={11} /> {c.firstPrize}
                          </span>
                        )}
                      </div>
                      <div className="content">
                        <div className="name">{p.name[lang]}</div>
                        <div className="value">{p.value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Reveal>

            <Reveal delay={80}>
              <div className="section-title"><h2>{t('winners_title')}</h2></div>
              {lottery.winners.length === 0 ? (
                <EmptyState icon={Trophy} title={t('result_pending')} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {lottery.winners.map((w, i) => (
                    <div className="card list-card" key={i}>
                      <div className="thumb" style={{ display: 'grid', placeItems: 'center', background: 'var(--color-surface-alt)', color: 'var(--color-marigold-text)' }}>
                        <Trophy size={22} />
                      </div>
                      <div className="body">
                        <div className="title">{w.name}</div>
                        <div className="meta">{w.prize}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Reveal>

            <Reveal as="div" delay={120} className="card card-pad" style={{ display: 'flex', gap: 10, background: 'var(--color-surface-alt)' }}>
              <Info size={18} color="var(--color-brass)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-ink-soft)' }}>{t('offline_note')}</span>
            </Reveal>

            {lottery.history?.length > 0 && (
              <Reveal delay={160}>
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
              </Reveal>
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

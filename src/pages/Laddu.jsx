import { useMemo, useState } from 'react';
import { Info, Gift, Share2, Trophy } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getLaddu } from '../services/api';
import PhotoTile from '../components/PhotoTile';
import Header from '../components/Header';
import PhotoViewer from '../components/PhotoViewer';
import EmptyState from '../components/EmptyState';
import Reveal from '../components/Reveal';
import { PageSkeleton, PageError } from '../components/LoadingStates';

const COPY = {
  en: { settled: 'Result declared', pending: 'Awaiting auction', share: 'Share on WhatsApp' },
  te: { settled: 'ఫలితం ప్రకటించారు', pending: 'వేలం జరగాల్సి ఉంది', share: 'వాట్సాప్‌లో పంచుకోండి' },
};

function shareLaddu(current, lang) {
  const lines = [
    `🙏 ${current.title?.[lang] || ''}`,
    `${current.date || ''} ${current.time || ''}`.trim(),
    current.location?.[lang] || '',
    '',
    `Starting price: ${current.startingPrice || ''}`,
    current.finalPrice ? `Final price: ${current.finalPrice}` : '',
    current.winner ? `Winner: ${current.winner}` : '',
  ].filter(Boolean);
  window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
}

export default function Laddu() {
  const { t, lang } = useLanguage();
  const c = COPY[lang] || COPY.en;
  const { data: laddu, loading, error, reload } = useAsyncData(getLaddu, []);
  const [showPhoto, setShowPhoto] = useState(false);

  const settled = Boolean(laddu?.current?.finalPrice || laddu?.current?.winner);

  return (
    <>
      <Header title={t('laddu_title')} />
      <div className="page">
        {loading && <PageSkeleton rows={2} />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && !laddu && (
          <EmptyState icon={Gift} title={t('laddu_empty')} subtitle={t('laddu_empty_sub')} />
        )}
        {!loading && !error && laddu && (
          <>
            <Reveal as="div" className="card feature-card">
              <PhotoTile
                src={laddu.current.image}
                wide
                className="feature-img"
                alt=""
                onClick={laddu.current.image ? () => setShowPhoto(true) : undefined}
              />
              <div className="content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div className="title" style={{ fontSize: 'var(--fs-md)' }}>{laddu.current.title[lang]}</div>
                  <span className={`chip ${settled ? 'chip-leaf' : ''}`}>{settled ? c.settled : c.pending}</span>
                </div>
                <div className="row"><span className="label">{t('starting_price')}</span><span className="value">{laddu.current.startingPrice}</span></div>
                <div className="row">
                  <span className="label">{t('final_price')}</span>
                  <span className="value">{laddu.current.finalPrice || t('result_pending')}</span>
                </div>
                <div className="row">
                  <span className="label">{t('winner')}</span>
                  <span className="value">{laddu.current.winner || '—'}</span>
                </div>
                <div className="row"><span className="label">{t('auction_date')}</span><span className="value">{laddu.current.date}, {laddu.current.time}</span></div>
                <div className="row"><span className="label">{t('location')}</span><span className="value">{laddu.current.location?.[lang]}</span></div>
              </div>
            </Reveal>

            <button className="btn btn-outline btn-block" onClick={() => shareLaddu(laddu.current, lang)}>
              <Share2 size={15} /> {c.share}
            </button>

            <Reveal as="div" delay={40} className="card card-pad" style={{ display: 'flex', gap: 10, background: 'var(--color-surface-alt)' }}>
              <Info size={18} color="var(--color-brass)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-ink-soft)' }}>{t('offline_note')}</span>
            </Reveal>

            {laddu.history?.length > 0 && (
              <Reveal delay={80}>
                <div className="section-title"><h2>{t('previous_years')}</h2></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {laddu.history.map((h) => (
                    <div className="card list-card" key={h.year}>
                      <PhotoTile className="thumb" />
                      <div className="body">
                        <div className="title">{h.year}</div>
                        <div className="meta">{t('final_price')}: {h.finalPrice}</div>
                        <div className="meta">{t('winner')}: {h.winner}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            )}
          </>
        )}
      </div>

      {showPhoto && laddu?.current?.image && (
        <PhotoViewer
          photos={[{ id: 'laddu-current', src: laddu.current.image, caption: laddu.current.title?.[lang] }]}
          index={0}
          onIndexChange={() => {}}
          onClose={() => setShowPhoto(false)}
        />
      )}
    </>
  );
}

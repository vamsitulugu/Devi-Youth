import { Info } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getLaddu } from '../services/api';
import PhotoTile from '../components/PhotoTile';
import Header from '../components/Header';
import { PageSkeleton, PageError } from '../components/LoadingStates';

export default function Laddu() {
  const { t, lang } = useLanguage();
  const { data: laddu, loading, error } = useAsyncData(getLaddu, []);

  return (
    <>
      <Header title={t('laddu_title')} />
      <div className="page">
        {loading && <PageSkeleton rows={2} />}
        {!loading && error && <PageError />}
        {!loading && !error && !laddu && (
          <div className="card empty-state">{t('laddu_empty')}</div>
        )}
        {!loading && !error && laddu && (
          <>
            <div className="card feature-card">
              <PhotoTile src={laddu.current.image} wide className="feature-img" alt="" />
              <div className="content">
                <div className="title" style={{ fontSize: 'var(--fs-md)', marginBottom: 8 }}>{laddu.current.title[lang]}</div>
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
            </div>

            <div className="card card-pad" style={{ display: 'flex', gap: 10, background: 'var(--color-surface-alt)' }}>
              <Info size={18} color="var(--color-brass)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-ink-soft)' }}>{t('offline_note')}</span>
            </div>

            {laddu.history?.length > 0 && (
              <section>
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
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
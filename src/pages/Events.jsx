import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getEvents } from '../services/api';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import { PageSkeleton, PageError } from '../components/LoadingStates';

export default function Events() {
  const { t, lang } = useLanguage();
  const { data: events, loading, error } = useAsyncData(getEvents, []);

  return (
    <>
      <Header title={t('events_title')} />
      <div className="page">
        {loading && <PageSkeleton />}
        {!loading && error && <PageError />}
        {!loading && !error && events?.length === 0 && (
          <EmptyState icon={CalendarDays} title={t('events_empty')} subtitle={t('events_empty_sub')} />
        )}
        {!loading && !error && events?.length > 0 && (
          <div className="timeline">
            {events.map((ev) => (
              <div className="timeline-item" key={ev.id}>
                <h3>{ev.title[lang]}</h3>
                <div className="card card-pad" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div className="meta" style={{ fontSize: 'var(--fs-sm)' }}>
                    <CalendarDays size={13} style={{ verticalAlign: -2 }} /> {ev.date}{' '}
                    <Clock size={13} style={{ verticalAlign: -2, marginLeft: 8 }} /> {ev.time}
                  </div>
                  <div className="meta" style={{ fontSize: 'var(--fs-sm)' }}>
                    <MapPin size={13} style={{ verticalAlign: -2 }} /> {ev.location[lang]}
                  </div>
                  {ev.description?.[lang] && (
                    <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-ink-soft)', marginTop: 4 }}>
                      {ev.description[lang]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
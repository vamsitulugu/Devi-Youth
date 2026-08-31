import { useMemo, useState } from 'react';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getEvents } from '../services/api';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import Reveal from '../components/Reveal';
import { PageSkeleton, PageError } from '../components/LoadingStates';

const COPY = {
  en: { upcoming: 'Upcoming', past: 'Past', all: 'All', today: 'Today', tomorrow: 'Tomorrow', inDays: '{n}', live: 'Happening now' },
  te: { upcoming: 'రాబోయేవి', past: 'గతంలో జరిగినవి', all: 'అన్నీ', today: 'నేడు', tomorrow: 'రేపు', inDays: '{n}', live: 'ఇప్పుడు జరుగుతోంది' },
};

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

function dayLabel(ev, c) {
  if (!ev.date) return null;
  const d = startOfDay(new Date(ev.date)).getTime();
  const today = startOfDay(new Date()).getTime();
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return { text: c.today, live: true };
  if (diff === 1) return { text: c.tomorrow, live: false };
  if (diff > 1) return { text: `${diff}d`, live: false };
  return null; // past
}

export default function Events() {
  const { t, lang } = useLanguage();
  const c = COPY[lang] || COPY.en;
  const { data: events, loading, error, reload } = useAsyncData(getEvents, []);
  const [filter, setFilter] = useState('upcoming');

  const withMeta = useMemo(() => (events || []).map((ev) => {
    const d = ev.date ? startOfDay(new Date(ev.date)).getTime() : null;
    const today = startOfDay(new Date()).getTime();
    return { ...ev, _past: d !== null && d < today };
  }), [events]);

  const hasPast = withMeta.some((e) => e._past);
  const visible = withMeta.filter((e) => filter === 'all' || (filter === 'upcoming' ? !e._past : e._past));

  return (
    <>
      <Header title={t('events_title')} />
      <div className="page">
        {loading && <PageSkeleton />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && events?.length === 0 && (
          <EmptyState icon={CalendarDays} title={t('events_empty')} subtitle={t('events_empty_sub')} />
        )}

        {!loading && !error && hasPast && (
          <div className="search-scopes" style={{ padding: 0, margin: 0 }}>
            <button className={`scope-pill${filter === 'upcoming' ? ' active' : ''}`} onClick={() => setFilter('upcoming')}>{c.upcoming}</button>
            <button className={`scope-pill${filter === 'past' ? ' active' : ''}`} onClick={() => setFilter('past')}>{c.past}</button>
            <button className={`scope-pill${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>{c.all}</button>
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="timeline">
            {visible.map((ev, i) => {
              const label = dayLabel(ev, c);
              return (
                <Reveal key={ev.id} delay={Math.min(i, 6) * 40} as="div" className="timeline-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>{ev.title[lang]}</h3>
                    {label?.live && (
                      <span className="chip chip-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span className="live-dot" /> {label.text}
                      </span>
                    )}
                    {label && !label.live && <span className="chip chip-leaf">{label.text}</span>}
                  </div>
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
                </Reveal>
              );
            })}
          </div>
        )}

        {!loading && !error && events?.length > 0 && visible.length === 0 && (
          <EmptyState icon={CalendarDays} title={t('events_empty')} subtitle={t('events_empty_sub')} />
        )}
      </div>
    </>
  );
}

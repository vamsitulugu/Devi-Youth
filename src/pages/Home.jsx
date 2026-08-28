import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { getFestival, getAnnouncements, getEvents, getLaddu, getLottery, getCommittee, getLatestPhotos } from '../services/api';
import PhotoTile from '../components/PhotoTile';
import Header from '../components/Header';
import PhotoViewer from '../components/PhotoViewer';
import EmptyState from '../components/EmptyState';
import { PageSkeleton, PageError } from '../components/LoadingStates';

export default function Home() {
  const { t, lang } = useLanguage();

  const fetcher = useCallback(async () => {
    const [festival, announcements, events, laddu, lottery, committee, latestPhotos] = await Promise.all([
      getFestival(),
      getAnnouncements(),
      getEvents(),
      getLaddu(),
      getLottery(),
      getCommittee(),
      getLatestPhotos(6),
    ]);
    return { festival, announcements, events, laddu, lottery, committee, latestPhotos };
  }, []);

  const { data, loading, error } = useAsyncData(fetcher, []);

  return (
    <>
      <Header title={t('app_name')} />
      <div className="page">
        {loading && <PageSkeleton rows={4} />}
        {!loading && error && <PageError />}
        {!loading && !error && data && (
          <HomeContent data={data} t={t} lang={lang} />
        )}
      </div>
    </>
  );
}

function HomeContent({ data, t, lang }) {
  const { festival, announcements, events, laddu, lottery, committee, latestPhotos } = data;
  const latestAnnouncement = announcements[0];
  const upcoming = events.slice(0, 3);
  const hasFestival = Boolean(festival.id) || Boolean(festival.year);

  const nothingPublishedYet =
    !hasFestival &&
    !latestAnnouncement &&
    upcoming.length === 0 &&
    !laddu?.current &&
    !lottery &&
    !(latestPhotos?.length > 0) &&
    !(committee.length > 0) &&
    !festival.publicDonationTotal;

  // Single shared lightbox for every clickable photo on this page —
  // holds { photos, index } and renders <PhotoViewer /> when set.
  const [viewer, setViewer] = useState(null);
  const openViewer = (photos, index = 0) => setViewer({ photos, index });
  const closeViewer = () => setViewer(null);

  return (
    <>
      <section className="hero">
        {hasFestival ? (
          <>
            <div className="eyebrow">{festival.village[lang]} · {festival.year}</div>
            <h1>{festival.name[lang]}</h1>
            <div className="dates">
              <CalendarDays size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
              {festival.dates[lang]}
            </div>
          </>
        ) : (
          <h1 style={{ fontSize: 'var(--fs-lg)' }}>{t('home_no_festival')}</h1>
        )}
        <div className="modak-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M24 10c9 0 16 8 16 16 0 8-7 12-16 12S8 34 8 26c0-8 7-16 16-16Z" fill="#F6B93B" opacity="0.9" />
            <path d="M24 10c2-4 5-6 8-6" stroke="#F6B93B" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </section>

      {nothingPublishedYet && (
        <EmptyState icon={Sparkles} title={t('home_empty')} subtitle={t('home_empty_sub')} />
      )}

      {latestAnnouncement && (
        <section>
          <div className="section-title">
            <h2>{t('home_latest_announcement')}</h2>
            <Link to="/announcements" className="see-all">{t('see_all')}</Link>
          </div>
          <Link to="/announcements" className="card list-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            {latestAnnouncement.image && (
              <PhotoTile
                src={latestAnnouncement.image}
                alt=""
                className="thumb"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openViewer([{ id: 'announcement', src: latestAnnouncement.image, caption: latestAnnouncement.title?.[lang] }]);
                }}
                style={{ cursor: 'zoom-in' }}
              />
            )}
            <div className="body">
              {latestAnnouncement.important && <span className="chip chip-danger">{t('important')}</span>}
              <div className="title">{latestAnnouncement.title?.[lang] || ''}</div>
              <div className="desc">{latestAnnouncement.body?.[lang] || ''}</div>
            </div>
          </Link>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <div className="section-title">
            <h2>{t('home_upcoming_events')}</h2>
            <Link to="/events" className="see-all">{t('see_all')}</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.map((ev) => (
              <div className="card list-card" key={ev.id}>
                <div className="body">
                  <div className="title">{ev.title[lang]}</div>
                  <div className="meta">
                    <CalendarDays size={12} style={{ verticalAlign: -2 }} /> {ev.date} · {ev.time}
                  </div>
                  <div className="meta">
                    <MapPin size={12} style={{ verticalAlign: -2 }} /> {ev.location[lang]}
                  </div>
                </div>
                <ChevronRight size={18} color="var(--color-border)" />
              </div>
            ))}
          </div>
        </section>
      )}

      {laddu?.current && (
        <section>
          <div className="section-title"><h2>{t('home_laddu_highlight')}</h2></div>
          <Link to="/laddu" className="card feature-card" style={{ display: 'block' }}>
            <PhotoTile
              src={laddu.current.image}
              alt=""
              wide
              className="feature-img"
              onClick={laddu.current.image ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                openViewer([{ id: 'laddu-current', src: laddu.current.image, caption: laddu.current.title?.[lang] }]);
              } : undefined}
            />
            <div className="content">
              <div className="row"><span className="label">{t('starting_price')}</span><span className="value">{laddu.current.startingPrice}</span></div>
              <div className="row"><span className="label">{t('auction_date')}</span><span className="value">{laddu.current.date}, {laddu.current.time}</span></div>
            </div>
          </Link>
        </section>
      )}

      {lottery && (
        <section>
          <div className="section-title"><h2>{t('home_lottery_highlight')}</h2></div>
          <Link to="/lottery" className="card card-pad" style={{ display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="chip">{lottery.drawDate}</span>
              <span className="chip chip-leaf">{lottery.prizes.length} {t('lottery_prizes')}</span>
            </div>
            {lottery.prizes[0] && (
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-ink-soft)' }}>
                {lottery.prizes[0].name[lang]} — {lottery.prizes[0].value}
              </div>
            )}
          </Link>
        </section>
      )}

      {latestPhotos?.length > 0 && (
        <section>
          <div className="section-title">
            <h2>{t('home_latest_photos')}</h2>
            <Link to="/gallery" className="see-all">{t('see_all')}</Link>
          </div>
          <div className="gallery-grid">
            {latestPhotos.map((p) => (
              <Link key={p.id} to="/gallery">
                <PhotoTile src={p.src} alt="" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {committee.length > 0 && (
        <section>
          <div className="section-title">
            <h2>{t('home_committee')}</h2>
            <Link to="/committee" className="see-all">{t('see_all')}</Link>
          </div>
          <div className="hscroll">
            {committee.slice(0, 4).map((m) => (
              <div className="card member-card" key={m.id} style={{ width: 130 }}>
                <PhotoTile
                  src={m.photo}
                  className="avatar"
                  onClick={m.photo ? () => openViewer([{ id: m.id, src: m.photo, caption: m.name }]) : undefined}
                />
                <div className="name">{m.name}</div>
                <div className="position">{m.position[lang]}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {festival.publicDonationTotal && (
        <section className="card card-pad" style={{ textAlign: 'center', background: 'var(--color-surface-alt)' }}>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--color-ink-soft)' }}>{t('home_donations_public')}</div>
          <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--color-vermillion-dark)', fontFamily: 'var(--font-display)' }}>
            {festival.publicDonationTotal}
          </div>
        </section>
      )}

      {viewer && (
        <PhotoViewer
          photos={viewer.photos}
          index={viewer.index}
          onIndexChange={(i) => setViewer((v) => ({ ...v, index: i }))}
          onClose={closeViewer}
        />
      )}
    </>
  );
}
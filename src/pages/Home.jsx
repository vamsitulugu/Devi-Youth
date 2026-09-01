import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays, MapPin, ChevronRight, Sparkles, Gift, Ticket, Users, Phone,
  Images, Heart, Share2, Clock, History as HistoryIcon,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAsyncData } from '../hooks/useAsyncData';
import { useCloseOnBack } from '../hooks/useCloseOnBack';
import { useFavorites } from '../hooks/useFavorites';
import {
  getFestival, getAnnouncements, getEvents, getLaddu, getLottery, getCommittee,
  getLatestPhotos, getGalleryAlbums,
} from '../services/api';
import { getLiveStatus } from '../services/livestream';
import PhotoTile from '../components/PhotoTile';
import Header from '../components/Header';
import PhotoViewer from '../components/PhotoViewer';
import EmptyState from '../components/EmptyState';
import Reveal from '../components/Reveal';
import WeatherWidget from '../components/WeatherWidget';
import PanchangWidget from '../components/PanchangWidget';
import VenueMap from '../components/VenueMap';
import LiveStream from '../components/LiveStream';
import { PageSkeleton, PageError } from '../components/LoadingStates';

export default function Home() {
  const { t, lang } = useLanguage();

  const fetcher = useCallback(async () => {
    const [festival, announcements, events, laddu, lottery, committee, latestPhotos, albums] = await Promise.all([
      getFestival(),
      getAnnouncements(),
      getEvents(),
      getLaddu(),
      getLottery(),
      getCommittee(),
      getLatestPhotos(9),
      getGalleryAlbums().catch(() => []),
    ]);
    const live = await getLiveStatus(festival.id).catch(() => ({ active: false, roomUrl: '' }));
    return { festival, announcements, events, laddu, lottery, committee, latestPhotos, albums, live };
  }, []);

  const { data, loading, error, reload } = useAsyncData(fetcher, []);

  return (
    <>
      <Header />
      <div className="page">
        {loading && <PageSkeleton rows={4} />}
        {!loading && error && <PageError onRetry={reload} />}
        {!loading && !error && data && <HomeContent data={data} t={t} lang={lang} />}
      </div>
    </>
  );
}

/* ---------------- helpers ---------------- */

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

function hasFestivalStarted(festival) {
  if (!festival.startDate) return false;
  return startOfDay(new Date()) >= startOfDay(festival.startDate);
}

function parseAmount(v) {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  const n = String(v).replace(/[^0-9.]/g, '');
  return n ? Number(n) : 0;
}

function formatINR(n) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/** Parse "6:30 AM" / "18:30" against a date into minutes-from-midnight. */
function timeToMinutes(time) {
  if (!time) return null;
  const m = String(time).trim().match(/^(\d{1,2})[:.](\d{2})\s*([AaPp][Mm])?/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const mer = m[3]?.toLowerCase();
  if (mer === 'pm' && h < 12) h += 12;
  if (mer === 'am' && h === 12) h = 0;
  return h * 60 + min;
}

/** Ticking clock, one update a minute — drives the live timeline states. */
function useMinuteTick() {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((x) => x + 1), 60000);
    return () => clearInterval(id);
  }, []);
}

/** Count a number up once, on first paint. */
function useCountUp(target, ms = 1100) {
  const [v, setV] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (!target) { setV(0); return undefined; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); return undefined; }
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / ms);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, ms]);
  return v;
}

const COPY = {
  en: {
    quick: 'Quick access', laddu: 'Laddu', lottery: 'Lottery', committee: 'Committee',
    contacts: 'Contacts', gallery: 'Gallery', history: 'History',
    today: "Today's schedule", nextDay: 'Next event day', live: 'Live now', upNext: 'Up next',
    raised: 'raised so far', milestone: 'next milestone', donors: 'contributions',
    albums: 'Albums', share: 'Share', saved: 'Saved',
    countdownDays: 'days', countdownHrs: 'hrs', countdownMin: 'min',
  },
  te: {
    quick: 'త్వరిత ప్రవేశం', laddu: 'లడ్డు', lottery: 'లాటరీ', committee: 'కమిటీ',
    contacts: 'సంప్రదింపులు', gallery: 'గ్యాలరీ', history: 'చరిత్ర',
    today: 'నేటి కార్యక్రమం', nextDay: 'తదుపరి కార్యక్రమ రోజు', live: 'ఇప్పుడు జరుగుతోంది', upNext: 'తర్వాత',
    raised: 'ఇప్పటి వరకు సేకరణ', milestone: 'తదుపరి లక్ష్యం', donors: 'విరాళాలు',
    albums: 'ఆల్బమ్‌లు', share: 'పంచుకోండి', saved: 'సేవ్ చేసినవి',
    countdownDays: 'రోజులు', countdownHrs: 'గంటలు', countdownMin: 'నిమిషాలు',
  },
};

/* ---------------- hero countdown ---------------- */

function FestivalCountdown({ festival, t, c }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!festival.startDate || !festival.endDate) return null;
  const now = new Date();
  const today = startOfDay(now);
  const start = startOfDay(festival.startDate);
  const end = startOfDay(festival.endDate);

  if (today > end) return <div className="hero-countdown">{t('countdown_over')}</div>;
  if (today >= start) {
    return (
      <div className="hero-countdown">
        <span className="live-dot" style={{ marginRight: 8, background: 'var(--color-turmeric)' }} />
        {today.getTime() === start.getTime() ? t('countdown_today') : t('countdown_live')}
      </div>
    );
  }

  const ms = start.getTime() - now.getTime();
  const days = Math.floor(ms / 86400000);
  const hrs = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);

  return (
    <div className="hero-countdown" style={{ gap: 14 }}>
      {[[days, c.countdownDays], [hrs, c.countdownHrs], [mins, c.countdownMin]].map(([n, label]) => (
        <span key={label} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}>
          <b style={{ fontSize: 'var(--fs-md)', fontVariantNumeric: 'tabular-nums' }}>{String(n).padStart(2, '0')}</b>
          <span style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>{label}</span>
        </span>
      ))}
    </div>
  );
}

/* ---------------- page ---------------- */

function HomeContent({ data, t, lang }) {
  const { festival, announcements, events, laddu, lottery, committee, latestPhotos, albums, live } = data;
  const c = COPY[lang] || COPY.en;
  const { isFav, toggle } = useFavorites();
  useMinuteTick();

  const latestAnnouncement = announcements[0];
  const upcoming = events.slice(0, 3);
  const hasFestival = Boolean(festival.id) || Boolean(festival.year);

  const nothingPublishedYet =
    !hasFestival && !latestAnnouncement && upcoming.length === 0 && !laddu?.current &&
    !lottery && !(latestPhotos?.length > 0) && !(committee.length > 0) && !festival.publicDonationTotal;

  const [viewer, setViewer] = useState(null);
  const openViewer = (photos, index = 0) => setViewer({ photos, index });
  const closeViewer = () => setViewer(null);
  useCloseOnBack(!!viewer, closeViewer);

  /* --- donation progress --- */
  const raised = parseAmount(festival.publicDonationTotal);
  const goal = parseAmount(festival.donationGoal || festival.donation_goal)
    || (raised ? Math.ceil(raised / 100000) * 100000 || 100000 : 0);
  const pct = goal ? Math.min(100, (raised / goal) * 100) : 0;
  const shown = useCountUp(raised);
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setBarWidth(pct), 220);
    return () => clearTimeout(id);
  }, [pct]);

  /* --- today's live schedule --- */
  const schedule = useMemo(() => {
    const todayKey = startOfDay(new Date()).getTime();
    const withDate = events
      .map((e) => ({ ...e, _d: e.date ? startOfDay(new Date(e.date)).getTime() : null }))
      .filter((e) => e._d !== null);
    let day = withDate.filter((e) => e._d === todayKey);
    let isToday = day.length > 0;
    if (!isToday) {
      const future = withDate.filter((e) => e._d > todayKey).sort((a, b) => a._d - b._d);
      if (future.length) day = future.filter((e) => e._d === future[0]._d);
    }
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const sorted = day
      .map((e) => ({ ...e, _m: timeToMinutes(e.time) }))
      .sort((a, b) => (a._m ?? 9999) - (b._m ?? 9999));
    const nextIdx = isToday ? sorted.findIndex((e) => (e._m ?? 9999) >= nowMin) : 0;
    return { rows: sorted, isToday, nowIndex: nextIdx === -1 ? sorted.length : nextIdx };
  }, [events]);

  const shareFestival = () => {
    const lines = [
      `🙏 ${festival.name?.[lang] || ''}`,
      festival.village?.[lang] ? `${festival.village[lang]} · ${festival.year || ''}` : '',
      festival.dates?.[lang] || '',
      '',
      window.location.origin + window.location.pathname,
    ].filter(Boolean);
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
  };

  const quickTiles = [
    laddu?.current && { to: '/laddu', icon: Gift, label: c.laddu },
    lottery && { to: '/lottery', icon: Ticket, label: c.lottery },
    committee.length > 0 && { to: '/committee', icon: Users, label: c.committee },
    { to: '/gallery', icon: Images, label: c.gallery },
    { to: '/contacts', icon: Phone, label: c.contacts },
    { to: '/history', icon: HistoryIcon, label: c.history },
  ].filter(Boolean);

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section
        className={`hero${festival.photo ? ' hero-has-photo' : ''}`}
        onClick={festival.photo ? () => openViewer([{
          id: 'festival-photo',
          src: festival.photo,
          caption: festival.name[lang],
          subtitle: [festival.village[lang], festival.dates[lang]].filter(Boolean).join(' · '),
        }]) : undefined}
        style={festival.photo ? { cursor: 'zoom-in' } : undefined}
      >
        {festival.photo && (
          <>
            <div className="hero-photo-bg" style={{ backgroundImage: `url(${festival.photo})` }} />
            <div className="hero-photo-overlay" />
          </>
        )}
        {hasFestival ? (
          <>
            <div className="eyebrow">{festival.village[lang]} · {festival.year}</div>
            <h1>{hasFestivalStarted(festival) ? `${festival.year} ${festival.name[lang]}` : festival.name[lang]}</h1>
            <div className="dates">
              <CalendarDays size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
              {festival.dates[lang]}
            </div>
            <FestivalCountdown festival={festival} t={t} c={c} />
            <button
              className="icon-btn-header"
              onClick={(e) => { e.stopPropagation(); shareFestival(); }}
              aria-label={c.share}
              style={{ position: 'absolute', top: 'var(--space-4)', right: 'var(--space-4)' }}
            >
              <Share2 size={16} strokeWidth={2.4} />
            </button>
          </>
        ) : (
          <h1 style={{ fontSize: 'var(--fs-lg)' }}>{t('home_no_festival')}</h1>
        )}
      </section>

      {nothingPublishedYet && (
        <EmptyState icon={Sparkles} title={t('home_empty')} subtitle={t('home_empty_sub')} />
      )}

      {/* ---------- LIVE STREAM (only if the committee started one) ---------- */}
      {live?.active && live?.roomName && live?.wsUrl && (
        <Reveal><LiveStream active={live.active} roomName={live.roomName} wsUrl={live.wsUrl} orientation={live.orientation} lang={lang} /></Reveal>
      )}

      {/* ---------- QUICK ACCESS ---------- */}
      {quickTiles.length > 0 && (
        <Reveal>
          <div className="section-title"><h2>{c.quick}</h2></div>
          <div className="quick-grid">
            {quickTiles.map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to} className="quick-tile">
                <span className="quick-tile-icon"><Icon size={19} strokeWidth={2.2} /></span>
                <span className="quick-tile-label">{label}</span>
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      {/* ---------- DONATION PROGRESS ---------- */}
      {raised > 0 && (
        <Reveal>
          <div className="section-title"><h2>{t('home_donations_public')}</h2></div>
          <div className="progress-card">
            <div className="progress-head">
              <div>
                <div className="progress-amount">{formatINR(shown)}</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--color-ink-soft)', fontWeight: 600, marginTop: 2 }}>
                  {c.raised}
                </div>
              </div>
              <Gift size={22} color="var(--color-marigold-text)" style={{ flexShrink: 0 }} />
            </div>
            {goal > 0 && (
              <>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${barWidth}%` }} />
                </div>
                <div className="progress-meta">
                  <span><b>{Math.round(pct)}%</b></span>
                  <span>{c.milestone} <b>{formatINR(goal)}</b></span>
                </div>
              </>
            )}
          </div>
        </Reveal>
      )}

      {/* ---------- LIVE SCHEDULE ---------- */}
      {schedule.rows.length > 0 && (
        <Reveal>
          <div className="section-title">
            <h2>{schedule.isToday ? c.today : c.nextDay}</h2>
            <Link to="/events" className="see-all">{t('see_all')}</Link>
          </div>
          <div className="aarti-card">
            {schedule.isToday && (
              <div className="aarti-now"><span className="live-dot" /> {c.live}</div>
            )}
            <div className="aarti-list">
              {schedule.rows.map((ev, i) => {
                const state = !schedule.isToday ? '' : i < schedule.nowIndex ? 'done' : i === schedule.nowIndex ? 'now' : '';
                return (
                  <div className={`aarti-row ${state}`} key={ev.id}>
                    <div className="aarti-time">{ev.time || '—'}</div>
                    <div className="aarti-rail">
                      <span className="aarti-node" />
                      <span className="aarti-line" />
                    </div>
                    <div className="aarti-body">
                      <div className="aarti-name">{ev.title[lang]}</div>
                      <div className="aarti-place">
                        <MapPin size={11} style={{ verticalAlign: -1, marginRight: 3 }} />
                        {ev.location[lang]}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      )}

      {/* ---------- WEATHER ---------- */}
      {hasFestival && festival.village?.[lang] && (
        <Reveal>
          <WeatherWidget village={festival.village.en} startDate={festival.startDate} endDate={festival.endDate} lang={lang} />
        </Reveal>
      )}

      {/* ---------- PANCHANG ---------- */}
      {hasFestival && festival.village?.[lang] && (
        <Reveal>
          <PanchangWidget village={festival.village.en} lang={lang} />
        </Reveal>
      )}

      {/* ---------- VENUE MAP ---------- */}
      {hasFestival && (festival.venueAddress || festival.village?.en) && (
        <Reveal>
          <VenueMap place={festival.venueAddress || `${festival.village.en} temple`} label={festival.village?.[lang]} lang={lang} />
        </Reveal>
      )}

      {/* ---------- LATEST ANNOUNCEMENT ---------- */}
      {latestAnnouncement && (
        <Reveal>
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
        </Reveal>
      )}

      {/* ---------- UPCOMING EVENTS ---------- */}
      {upcoming.length > 0 && (
        <Reveal>
          <div className="section-title">
            <h2>{t('home_upcoming_events')}</h2>
            <Link to="/events" className="see-all">{t('see_all')}</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.map((ev) => (
              <Link to="/events" className="card list-card" key={ev.id} style={{ color: 'inherit' }}>
                <div className="body">
                  <div className="title">{ev.title[lang]}</div>
                  <div className="meta">
                    <Clock size={12} style={{ verticalAlign: -2 }} /> {ev.date} · {ev.time}
                  </div>
                  <div className="meta">
                    <MapPin size={12} style={{ verticalAlign: -2 }} /> {ev.location[lang]}
                  </div>
                </div>
                <ChevronRight size={18} color="var(--color-border)" />
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      {/* ---------- LADDU ---------- */}
      {laddu?.current && (
        <Reveal>
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
        </Reveal>
      )}

      {/* ---------- LOTTERY ---------- */}
      {lottery && (
        <Reveal>
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
        </Reveal>
      )}

      {/* ---------- ALBUM STORY RAIL ---------- */}
      {albums?.length > 0 && (
        <Reveal>
          <div className="section-title">
            <h2>{c.albums}</h2>
            <Link to="/gallery" className="see-all">{t('see_all')}</Link>
          </div>
          <div className="story-rail">
            {albums.slice(0, 12).map((al) => (
              <Link key={al.id} to="/gallery" className="story">
                <span className="story-ring">
                  {al.cover ? (
                    <img src={al.cover} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className="story-fallback"><Images size={20} /></span>
                  )}
                </span>
                <span className="story-label">{al.name?.[lang] || al.name?.en || al.year}</span>
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      {/* ---------- LATEST PHOTOS (with favorites) ---------- */}
      {latestPhotos?.length > 0 && (
        <Reveal>
          <div className="section-title">
            <h2>{t('home_latest_photos')}</h2>
            <Link to="/gallery" className="see-all">{t('see_all')}</Link>
          </div>
          <div className="gallery-grid">
            {latestPhotos.map((p, i) => (
              <div className="photo-wrap" key={p.id}>
                <PhotoTile
                  src={p.src}
                  alt=""
                  onClick={() => openViewer(latestPhotos.map((x) => ({ id: x.id, src: x.src })), i)}
                  style={{ cursor: 'zoom-in' }}
                />
                <button
                  className={`fav-btn${isFav(p.id) ? ' on' : ''}`}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(p.id); }}
                  aria-label={c.saved}
                  aria-pressed={isFav(p.id)}
                >
                  <Heart size={15} fill={isFav(p.id) ? 'currentColor' : 'none'} strokeWidth={2.2} />
                </button>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {/* ---------- COMMITTEE ---------- */}
      {committee.length > 0 && (
        <Reveal>
          <div className="section-title">
            <h2>{t('home_committee')}</h2>
            <Link to="/committee" className="see-all">{t('see_all')}</Link>
          </div>
          <div className="hscroll">
            {committee.map((m) => (
              <div className="member-card" key={m.id} style={{ width: 90 }}>
                <PhotoTile
                  src={m.photo}
                  className="avatar"
                  onClick={m.photo ? () => openViewer([{
                    id: m.id,
                    src: m.photo,
                    caption: m.name,
                    subtitle: [m.position[lang], m.phone].filter(Boolean).join(' · '),
                  }]) : undefined}
                />
                <div className="name">{m.name}</div>
              </div>
            ))}
          </div>
        </Reveal>
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

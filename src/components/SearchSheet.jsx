import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Search, Megaphone, CalendarDays, Users, Phone, Gift, Ticket, Mic } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  getAnnouncements, getEvents, getCommittee, getContacts, getLaddu, getLottery,
} from '../services/api';

/**
 * Search across every public content type. One fetch on open, then
 * filtering happens locally — instant as you type, and it keeps working
 * from the already-loaded set if the connection drops mid-session.
 */

const COPY = {
  en: {
    placeholder: 'Search announcements, events, people…',
    all: 'All', news: 'News', events: 'Events', people: 'Committee', contacts: 'Contacts', festival: 'Festival',
    start: 'Type to search',
    startSub: 'Announcements, events, committee members, contacts, laddu and lottery details.',
    none: 'No matches',
    noneSub: 'Try a shorter word, or switch language.',
    results: 'results',
    voiceUnsupported: 'Voice search isn\u2019t supported on this browser.',
  },
  te: {
    placeholder: 'ప్రకటనలు, కార్యక్రమాలు, వ్యక్తులు వెతకండి…',
    all: 'అన్నీ', news: 'వార్తలు', events: 'కార్యక్రమాలు', people: 'కమిటీ', contacts: 'సంప్రదింపులు', festival: 'ఉత్సవం',
    start: 'వెతకడానికి టైప్ చేయండి',
    startSub: 'ప్రకటనలు, కార్యక్రమాలు, కమిటీ సభ్యులు, సంప్రదింపులు, లడ్డు, లాటరీ వివరాలు.',
    none: 'ఏమీ దొరకలేదు',
    noneSub: 'చిన్న పదం ప్రయత్నించండి, లేదా భాష మార్చండి.',
    results: 'ఫలితాలు',
    voiceUnsupported: 'ఈ బ్రౌజర్‌లో వాయిస్ సెర్చ్ లేదు.',
  },
};

const SCOPES = ['all', 'news', 'events', 'people', 'contacts', 'festival'];

const ICONS = { news: Megaphone, events: CalendarDays, people: Users, contacts: Phone, laddu: Gift, lottery: Ticket };

function bothLangs(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return `${v.en || ''} ${v.te || ''}`;
}

function Highlight({ text, q }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export default function SearchSheet({ onClose }) {
  const { lang } = useLanguage();
  const c = COPY[lang] || COPY.en;
  const [q, setQ] = useState('');
  const [scope, setScope] = useState('all');
  const [index, setIndex] = useState([]);
  const [closing, setClosing] = useState(false);
  const [listening, setListening] = useState(false);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Web Speech API — browser-native, free, no key. Feature-detected;
  // silently hidden if unsupported (older Safari/desktop Firefox).
  const SpeechRecognitionCtor = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  function toggleVoice() {
    if (!SpeechRecognitionCtor) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SpeechRecognitionCtor();
    rec.lang = lang === 'te' ? 'te-IN' : 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => setQ(e.results[0][0].transcript);
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  }

  useEffect(() => () => recognitionRef.current?.stop(), []);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 260);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [announcements, events, committee, contacts, laddu, lottery] = await Promise.all([
        getAnnouncements().catch(() => []),
        getEvents().catch(() => []),
        getCommittee().catch(() => []),
        getContacts().catch(() => []),
        getLaddu().catch(() => null),
        getLottery().catch(() => null),
      ]);
      if (!alive) return;

      const rows = [];
      announcements.forEach((a) => rows.push({
        id: `a-${a.id}`, scope: 'news', kind: 'news', to: '/announcements',
        title: a.title, sub: a.body, hay: `${bothLangs(a.title)} ${bothLangs(a.body)}`,
      }));
      events.forEach((e) => rows.push({
        id: `e-${e.id}`, scope: 'events', kind: 'events', to: '/events',
        title: e.title, sub: { en: `${e.date} · ${e.location?.en || ''}`, te: `${e.date} · ${e.location?.te || ''}` },
        hay: `${bothLangs(e.title)} ${bothLangs(e.location)} ${e.date || ''}`,
      }));
      committee.forEach((m) => rows.push({
        id: `c-${m.id}`, scope: 'people', kind: 'people', to: '/committee',
        title: { en: m.name, te: m.name }, sub: m.position,
        hay: `${m.name || ''} ${bothLangs(m.position)} ${m.phone || ''}`,
      }));
      contacts.forEach((ct) => rows.push({
        id: `t-${ct.id}`, scope: 'contacts', kind: 'contacts', to: '/contacts',
        title: ct.name || { en: ct.label, te: ct.label }, sub: { en: ct.phone, te: ct.phone },
        hay: `${bothLangs(ct.name)} ${bothLangs(ct.label)} ${bothLangs(ct.role)} ${ct.phone || ''}`,
      }));
      if (laddu?.current) {
        rows.push({
          id: 'laddu', scope: 'festival', kind: 'laddu', to: '/laddu',
          title: laddu.current.title || { en: 'Laddu Velam', te: 'లడ్డు వేలం' },
          sub: { en: `${laddu.current.date || ''} · ${laddu.current.startingPrice || ''}`, te: `${laddu.current.date || ''} · ${laddu.current.startingPrice || ''}` },
          hay: `laddu velam లడ్డు వేలం ${bothLangs(laddu.current.title)} ${laddu.current.winner || ''}`,
        });
      }
      if (lottery) {
        rows.push({
          id: 'lottery', scope: 'festival', kind: 'lottery', to: '/lottery',
          title: { en: 'Lottery', te: 'లాటరీ' },
          sub: { en: `${lottery.drawDate || ''} · ${lottery.prizes?.length || 0} prizes`, te: `${lottery.drawDate || ''} · ${lottery.prizes?.length || 0} బహుమతులు` },
          hay: `lottery లాటరీ ${lottery.drawDate || ''} ${(lottery.prizes || []).map((p) => bothLangs(p.name)).join(' ')}`,
        });
        (lottery.prizes || []).forEach((p, i) => rows.push({
          id: `p-${p.id || i}`, scope: 'festival', kind: 'lottery', to: '/lottery',
          title: p.name, sub: { en: p.value, te: p.value },
          hay: `${bothLangs(p.name)} ${p.value || ''}`,
        }));
      }
      setIndex(rows);
    })();
    return () => { alive = false; };
  }, []);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return index
      .filter((r) => (scope === 'all' || r.scope === scope) && r.hay.toLowerCase().includes(needle))
      .slice(0, 40);
  }, [q, scope, index]);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  return (
    <>
      <div className="sheet-backdrop" onClick={close} />
      <div className={`sheet${closing ? ' sheet-closing' : ''}`} role="dialog" aria-modal="true">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h2>{c.all === 'All' ? 'Search' : 'వెతకండి'}</h2>
          <button className="sheet-close" onClick={close} aria-label="Close"><X size={17} /></button>
        </div>

        <div className="search-bar">
          <Search size={17} strokeWidth={2.4} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={c.placeholder}
            enterKeyHint="search"
            aria-label={c.placeholder}
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear" style={{ color: 'var(--color-ink-soft)', display: 'flex' }}>
              <X size={16} />
            </button>
          )}
          {SpeechRecognitionCtor && (
            <button
              type="button"
              onClick={toggleVoice}
              aria-label="Voice search"
              className={`mic-btn${listening ? ' listening' : ''}`}
            >
              <Mic size={16} />
            </button>
          )}
        </div>

        <div className="search-scopes">
          {SCOPES.map((s) => (
            <button
              key={s}
              className={`scope-pill${scope === s ? ' active' : ''}`}
              onClick={() => setScope(s)}
            >
              {c[s]}
            </button>
          ))}
        </div>

        <div className="sheet-body">
          {!q.trim() && (
            <div className="search-empty">
              <div style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{c.start}</div>
              <div style={{ marginTop: 6 }}>{c.startSub}</div>
            </div>
          )}
          {q.trim() && results.length === 0 && (
            <div className="search-empty">
              <div style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{c.none}</div>
              <div style={{ marginTop: 6 }}>{c.noneSub}</div>
            </div>
          )}
          {results.map((r, i) => {
            const Icon = ICONS[r.kind] || Search;
            const title = r.title?.[lang] || r.title?.en || '';
            const sub = r.sub?.[lang] || r.sub?.en || '';
            return (
              <Link
                key={r.id}
                to={r.to}
                onClick={close}
                className="search-result"
                style={{ animationDelay: `${Math.min(i, 10) * 28}ms` }}
              >
                <span className="search-result-icon"><Icon size={17} /></span>
                <span className="body">
                  <span className="title"><Highlight text={title} q={q.trim()} /></span>
                  <span className="sub">{sub}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

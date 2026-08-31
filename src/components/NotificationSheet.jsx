import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { X, Megaphone, CalendarDays, CheckCheck } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getAnnouncements, getEvents } from '../services/api';

/* ------------------------------------------------------------------
   A tiny shared store so the Header bell and the BottomNav dot read the
   same feed without each firing their own request. Fetched once per
   session, refreshed when the sheet is opened.
   ------------------------------------------------------------------ */

const READ_KEY = 'gc_read_notifications';

function loadRead() {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

const store = {
  items: [],
  read: loadRead(),
  loaded: false,
  loading: false,
  listeners: new Set(),
  snapshot: { items: [], unread: 0 },
  emit() {
    const unread = this.items.filter((n) => !this.read.has(n.id)).length;
    this.snapshot = { items: this.items, unread };
    this.listeners.forEach((l) => l());
  },
  subscribe(l) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  },
  markAllRead() {
    this.items.forEach((n) => this.read.add(n.id));
    try { localStorage.setItem(READ_KEY, JSON.stringify([...this.read])); } catch { /* private mode */ }
    this.emit();
  },
  async load(force = false) {
    if (this.loading || (this.loaded && !force)) return;
    this.loading = true;
    try {
      const [announcements, events] = await Promise.all([getAnnouncements(), getEvents()]);
      const feed = [
        ...announcements.map((a) => ({
          id: `a-${a.id}`,
          kind: a.important ? 'important' : 'announcement',
          title: a.title,
          body: a.body,
          at: a.createdAt || a.created_at || a.date || null,
          to: '/announcements',
        })),
        ...events.map((e) => ({
          id: `e-${e.id}`,
          kind: 'event',
          title: e.title,
          body: e.location,
          at: e.date || null,
          to: '/events',
        })),
      ];
      feed.sort((x, y) => new Date(y.at || 0) - new Date(x.at || 0));
      this.items = feed.slice(0, 25);
      this.loaded = true;
      this.emit();
    } catch {
      this.loaded = true;
    } finally {
      this.loading = false;
    }
  },
};

/** Unread count for the header badge / nav dot. Safe to call anywhere. */
export function useUnreadCount() {
  const snap = useSyncExternalStore(
    (l) => store.subscribe(l),
    () => store.snapshot,
    () => store.snapshot,
  );
  useEffect(() => { store.load(); }, []);
  return snap.unread;
}

function relativeTime(at, lang) {
  if (!at) return '';
  const then = new Date(at).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.round((Date.now() - then) / 60000);
  const te = lang === 'te';
  if (mins < 1) return te ? 'ఇప్పుడే' : 'just now';
  if (mins < 60) return te ? `${mins} నిమిషాల క్రితం` : `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return te ? `${hrs} గంటల క్రితం` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return te ? `${days} రోజుల క్రితం` : `${days}d ago`;
  return new Date(at).toLocaleDateString(te ? 'te-IN' : 'en-IN', { day: 'numeric', month: 'short' });
}

const COPY = {
  en: { title: 'Notifications', empty: 'Nothing new yet.', emptySub: 'Announcements and events show up here the moment the committee posts them.', markAll: 'Mark all read' },
  te: { title: 'నోటిఫికేషన్లు', empty: 'కొత్తది ఏమీ లేదు.', emptySub: 'కమిటీ పోస్ట్ చేసిన వెంటనే ప్రకటనలు, కార్యక్రమాలు ఇక్కడ కనిపిస్తాయి.', markAll: 'అన్నీ చదివినట్టు' },
};

export default function NotificationSheet({ onClose }) {
  const { lang } = useLanguage();
  const c = COPY[lang] || COPY.en;
  const [closing, setClosing] = useState(false);

  const snap = useSyncExternalStore(
    (l) => store.subscribe(l),
    () => store.snapshot,
    () => store.snapshot,
  );

  useEffect(() => { store.load(true); }, []);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  const items = snap.items;
  const anyUnread = useMemo(() => items.some((n) => !store.read.has(n.id)), [items, snap.unread]);

  return (
    <>
      <div className="sheet-backdrop" onClick={close} />
      <div className={`sheet${closing ? ' sheet-closing' : ''}`} role="dialog" aria-modal="true">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h2>{c.title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {anyUnread && (
              <button className="btn btn-xs btn-outline" onClick={() => store.markAllRead()}>
                <CheckCheck size={13} /> {c.markAll}
              </button>
            )}
            <button className="sheet-close" onClick={close} aria-label="Close"><X size={17} /></button>
          </div>
        </div>
        <div className="sheet-body">
          {items.length === 0 && (
            <div className="search-empty">
              <div style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{c.empty}</div>
              <div style={{ marginTop: 6 }}>{c.emptySub}</div>
            </div>
          )}
          {items.map((n, i) => {
            const unread = !store.read.has(n.id);
            const Icon = n.kind === 'event' ? CalendarDays : Megaphone;
            return (
              <Link
                key={n.id}
                to={n.to}
                onClick={close}
                className={`notif-item${unread ? ' unread' : ''}`}
                style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
              >
                <span className={`notif-icon${n.kind === 'important' ? ' is-important' : ''}${n.kind === 'event' ? ' is-event' : ''}`}>
                  <Icon size={17} />
                </span>
                <span className="notif-body">
                  <span className="notif-title">{n.title?.[lang] || n.title?.en || ''}</span>
                  <span className="notif-text">{n.body?.[lang] || n.body?.en || ''}</span>
                  <span className="notif-time">{relativeTime(n.at, lang)}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

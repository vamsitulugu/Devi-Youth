import { useEffect, useState } from 'react';
import { Play, Youtube } from 'lucide-react';

const COPY = {
  en: { live: 'Live Now', tap: 'Tap to watch on YouTube', fallback: 'Watch the live broadcast' },
  te: { live: 'ప్రత్యక్ష ప్రసారం', tap: 'యూట్యూబ్‌లో చూడటానికి నొక్కండి', fallback: 'ప్రత్యక్ష ప్రసారం చూడండి' },
};

const CACHE_MS = 10 * 60 * 1000;

/**
 * The "best live session card" — a rich, tappable card that opens the
 * festival's YouTube Live broadcast in YouTube itself. The thumbnail and
 * title come from YouTube's public oEmbed endpoint (free, no key) so the
 * card looks alive even before anyone's clicked it; if that lookup fails
 * the card still works, just with a plain gradient instead of a photo.
 */
export default function LiveStream({ url, active, lang = 'en' }) {
  const c = COPY[lang] || COPY.en;
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    if (!active || !url) return;
    const cacheKey = `gc_yt_oembed:${url}`;
    let alive = true;
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (cached && Date.now() - cached.at < CACHE_MS) { setMeta(cached.data); return; }
    } catch { /* ignore */ }
    fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !data) return;
        setMeta(data);
        try { localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), data })); } catch { /* ignore */ }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [url, active]);

  if (!active || !url) return null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="live-session-card">
      <div
        className="live-session-bg"
        style={meta?.thumbnail_url ? { backgroundImage: `url(${meta.thumbnail_url})` } : undefined}
      />
      <div className="live-session-overlay" />
      <div className="live-session-badge">
        <span className="live-dot" style={{ width: 8, height: 8, borderRadius: '50%' }} />
        {c.live}
      </div>
      <div className="live-session-play">
        <span className="live-session-play-ring" />
        <Play size={22} fill="#fff" color="#fff" />
      </div>
      <div className="live-session-info">
        <div className="live-session-title">{meta?.title || c.fallback}</div>
        <div className="live-session-sub"><Youtube size={14} /> {c.tap}</div>
      </div>
    </a>
  );
}

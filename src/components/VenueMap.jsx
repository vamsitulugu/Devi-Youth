import { useEffect, useState } from 'react';
import { MapPin, Navigation, RefreshCw } from 'lucide-react';
import { geocodePlace } from '../services/weather';

const COPY = {
  en: { directions: 'Get Directions', unavailable: "Couldn't find that location on the map.", retry: 'Retry' },
  te: { directions: 'దిక్సూచి పొందండి', unavailable: 'ఈ ప్రాంతం మ్యాప్‌లో దొరకలేదు.', retry: 'మళ్లీ ప్రయత్నించండి' },
};

/** Embedded OpenStreetMap preview (no key, no script to load — a plain
 * iframe) plus a "Get Directions" deep link that opens the visitor's own
 * maps app. `place` is free text (village/venue name); coordinates are
 * resolved once via the free Open-Meteo geocoder for the map preview.
 * If that name can't be geocoded (too local/fictional a name), shows a
 * small honest message with a retry rather than vanishing — the
 * directions link still works from the text alone either way. */
export default function VenueMap({ place, label, lang = 'en' }) {
  const c = COPY[lang] || COPY.en;
  const [loc, setLoc] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!place) return;
    let alive = true;
    setFailed(false);
    geocodePlace(place).then((res) => {
      if (!alive) return;
      if (res) setLoc(res);
      else setFailed(true);
    });
    return () => { alive = false; };
  }, [place, attempt]);

  if (!place) return null;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place)}`;

  if (failed) {
    return (
      <div className="card location-fallback">
        <span style={{ flex: 1 }}>{c.unavailable}</span>
        <button type="button" onClick={() => setAttempt((a) => a + 1)}><RefreshCw size={13} /> {c.retry}</button>
      </div>
    );
  }

  const bbox = loc ? [loc.lon - 0.01, loc.lat - 0.008, loc.lon + 0.01, loc.lat + 0.008].join('%2C') : null;

  return (
    <div className="card map-card">
      {bbox ? (
        <iframe
          className="map-embed"
          title="Venue map"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${loc.lat}%2C${loc.lon}`}
          loading="lazy"
        />
      ) : (
        <div className="map-embed map-embed-fallback"><MapPin size={28} /></div>
      )}
      <div className="map-card-footer">
        <span className="map-card-label"><MapPin size={13} /> {label || place}</span>
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
          <Navigation size={13} /> {c.directions}
        </a>
      </div>
    </div>
  );
}

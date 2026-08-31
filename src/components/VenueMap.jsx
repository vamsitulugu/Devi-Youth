import { useEffect, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { geocodePlace } from '../services/weather';

const COPY = { en: { directions: 'Get Directions' }, te: { directions: 'దిక్సూచి పొందండి' } };

/** Embedded OpenStreetMap preview (no key, no script to load — a plain
 * iframe) plus a "Get Directions" deep link that opens the visitor's own
 * maps app. `place` is free text (village/venue name); coordinates are
 * resolved once via the free Open-Meteo geocoder for the map preview —
 * the directions link works from the text alone even if that fails. */
export default function VenueMap({ place, label, lang = 'en' }) {
  const c = COPY[lang] || COPY.en;
  const [loc, setLoc] = useState(null);

  useEffect(() => {
    if (!place) return;
    let alive = true;
    geocodePlace(place).then((res) => { if (alive) setLoc(res); });
    return () => { alive = false; };
  }, [place]);

  if (!place) return null;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place)}`;
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

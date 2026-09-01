/* Weather — Open-Meteo (free, no API key, no signup). Geocoding and
 * forecast are both public endpoints; results are cached in
 * localStorage for 30 minutes so repeat visits don't re-fetch. */

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const CACHE_MS = 30 * 60 * 1000;

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    if (Date.now() - at > CACHE_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function cacheSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), data })); } catch { /* private mode */ }
}

/** Resolve a free-text place name to lat/lon. Returns null if not found.
 * Tries the name as given first, then with ", India" appended — most
 * village/town names alone are ambiguous or too small for the geocoder,
 * but resolve reliably once the country is specified. */
export async function geocodePlace(query) {
  const key = `gc_geocode:${query}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const attempts = [query, `${query}, India`];
  for (const attempt of attempts) {
    try {
      const res = await fetch(`${GEOCODE_URL}?name=${encodeURIComponent(attempt)}&count=1&language=en&format=json`);
      const data = await res.json();
      const hit = data?.results?.[0];
      if (hit) {
        const result = { lat: hit.latitude, lon: hit.longitude, label: hit.name, country: hit.country };
        cacheSet(key, result);
        return result;
      }
    } catch {
      // try the next attempt
    }
  }
  return null;
}

/** Daily forecast (max/min temp, weather code, rain chance) starting today. */
export async function getForecast(place, days = 7) {
  const key = `gc_weather:${place}:${days}`;
  const cached = cacheGet(key);
  if (cached) return cached;
  const loc = await geocodePlace(place);
  if (!loc) return null;
  try {
    const res = await fetch(
      `${FORECAST_URL}?latitude=${loc.lat}&longitude=${loc.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max&timezone=auto&forecast_days=${Math.min(days, 16)}`
    );
    const data = await res.json();
    const result = { location: loc, daily: data.daily };
    cacheSet(key, result);
    return result;
  } catch {
    return null;
  }
}

// WMO weather codes -> a simple {kind, en, te} bucket. `kind` maps to an
// icon in WeatherWidget (sun/cloud/rain/storm/fog/snow).
const CODE_MAP = [
  { codes: [0], kind: 'sun', en: 'Clear sky', te: 'నిర్మలమైన ఆకాశం' },
  { codes: [1, 2], kind: 'cloud-sun', en: 'Partly cloudy', te: 'పాక్షిక మేఘావృతం' },
  { codes: [3], kind: 'cloud', en: 'Overcast', te: 'మేఘావృతం' },
  { codes: [45, 48], kind: 'fog', en: 'Fog', te: 'పొగమంచు' },
  { codes: [51, 53, 55, 56, 57], kind: 'drizzle', en: 'Drizzle', te: 'తుంపర వాన' },
  { codes: [61, 63, 65, 80, 81, 82], kind: 'rain', en: 'Rain', te: 'వర్షం' },
  { codes: [66, 67], kind: 'rain', en: 'Freezing rain', te: 'మంచు వర్షం' },
  { codes: [71, 73, 75, 77, 85, 86], kind: 'snow', en: 'Snow', te: 'మంచు' },
  { codes: [95, 96, 99], kind: 'storm', en: 'Thunderstorm', te: 'పిడుగుల వర్షం' },
];

export function weatherCodeInfo(code) {
  return CODE_MAP.find((c) => c.codes.includes(code)) || { kind: 'cloud', en: 'Weather', te: 'వాతావరణం' };
}

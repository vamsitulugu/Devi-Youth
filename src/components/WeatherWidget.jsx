import { useEffect, useState } from 'react';
import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, Droplets, RefreshCw } from 'lucide-react';
import { getForecast, weatherCodeInfo } from '../services/weather';

const ICONS = {
  sun: Sun, 'cloud-sun': CloudSun, cloud: Cloud, fog: CloudFog,
  drizzle: CloudDrizzle, rain: CloudRain, snow: CloudSnow, storm: CloudLightning,
};

const COPY = {
  en: { title: 'Weather', loading: 'Checking the forecast…', unavailable: "Couldn't find that location for weather.", retry: 'Retry', today: 'Today' },
  te: { title: 'వాతావరణం', loading: 'ఫోర్‌కాస్ట్ చూస్తున్నాం…', unavailable: 'ఈ ప్రాంతానికి వాతావరణం అందుబాటులో లేదు.', retry: 'మళ్లీ ప్రయత్నించండి', today: 'నేడు' },
};

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

/** Villager-facing forecast strip for the festival's days (or the next
 * few days if the festival hasn't been dated yet). Free Open-Meteo data,
 * no key. Shows a small, honest "couldn't find that location" message
 * with a retry instead of silently disappearing — a fictional or very
 * local village name won't geocode; set a nearby recognizable town in
 * Settings if this keeps failing. */
export default function WeatherWidget({ village, startDate, endDate, lang = 'en' }) {
  const c = COPY[lang] || COPY.en;
  const [state, setState] = useState({ status: 'loading', data: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!village) { setState({ status: 'error', data: null }); return; }
    let alive = true;
    setState({ status: 'loading', data: null });
    getForecast(village, 16).then((res) => {
      if (!alive) return;
      setState(res ? { status: 'ok', data: res } : { status: 'error', data: null });
    });
    return () => { alive = false; };
  }, [village, attempt]);

  if (state.status === 'error') {
    return (
      <div className="card location-fallback">
        <span style={{ flex: 1 }}>{c.unavailable}</span>
        <button type="button" onClick={() => setAttempt((a) => a + 1)}><RefreshCw size={13} /> {c.retry}</button>
      </div>
    );
  }
  if (state.status === 'loading') {
    return <div className="card card-pad skeleton-row" style={{ height: 92 }} />;
  }

  const { daily } = state.data;
  const todayKey = startOfDay(new Date()).getTime();
  const start = startDate ? startOfDay(startDate).getTime() : todayKey;
  const end = endDate ? startOfDay(endDate).getTime() : todayKey + 4 * 86400000;

  const rows = daily.time
    .map((iso, i) => ({
      date: iso,
      key: startOfDay(new Date(iso)).getTime(),
      max: Math.round(daily.temperature_2m_max[i]),
      min: Math.round(daily.temperature_2m_min[i]),
      rain: daily.precipitation_probability_max[i],
      code: daily.weathercode[i],
    }))
    .filter((d) => d.key >= Math.min(start, todayKey) && d.key <= end)
    .slice(0, 8);

  if (rows.length === 0) {
    return (
      <div className="card location-fallback">
        <span style={{ flex: 1 }}>{c.unavailable}</span>
        <button type="button" onClick={() => setAttempt((a) => a + 1)}><RefreshCw size={13} /> {c.retry}</button>
      </div>
    );
  }

  return (
    <div className="card card-pad">
      <div className="weather-strip">
        {rows.map((d) => {
          const info = weatherCodeInfo(d.code);
          const Icon = ICONS[info.kind] || Cloud;
          const isToday = d.key === todayKey;
          const label = isToday ? c.today : new Date(d.date).toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-IN', { weekday: 'short' });
          return (
            <div className="weather-day" key={d.date}>
              <span className="weather-day-label">{label}</span>
              <Icon size={26} className="weather-icon" color="var(--color-marigold-text)" />
              <span className="weather-temp"><b>{d.max}°</b> {d.min}°</span>
              {d.rain > 25 && (
                <span className="weather-rain"><Droplets size={11} /> {d.rain}%</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

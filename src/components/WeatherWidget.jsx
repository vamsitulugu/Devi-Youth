import { useEffect, useState } from 'react';
import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, Droplets } from 'lucide-react';
import { getForecast, weatherCodeInfo } from '../services/weather';

const ICONS = {
  sun: Sun, 'cloud-sun': CloudSun, cloud: Cloud, fog: CloudFog,
  drizzle: CloudDrizzle, rain: CloudRain, snow: CloudSnow, storm: CloudLightning,
};

const COPY = {
  en: { title: 'Weather', loading: 'Checking the forecast…', unavailable: 'Forecast unavailable right now.', today: 'Today' },
  te: { title: 'వాతావరణం', loading: 'ఫోర్‌కాస్ట్ చూస్తున్నాం…', unavailable: 'ఇప్పుడు ఫోర్‌కాస్ట్ అందుబాటులో లేదు.', today: 'నేడు' },
};

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

/** Villager-facing forecast strip for the festival's days (or the next
 * few days if the festival hasn't been dated yet). Free Open-Meteo data,
 * no key. Renders nothing if geocoding/forecast both fail — never blocks
 * the page or shows a scary error for a "nice to have" widget. */
export default function WeatherWidget({ village, startDate, endDate, lang = 'en' }) {
  const c = COPY[lang] || COPY.en;
  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    if (!village) { setState({ status: 'error', data: null }); return; }
    let alive = true;
    getForecast(village, 16).then((res) => {
      if (!alive) return;
      setState(res ? { status: 'ok', data: res } : { status: 'error', data: null });
    });
    return () => { alive = false; };
  }, [village]);

  if (state.status === 'error') return null;
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

  if (rows.length === 0) return null;

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

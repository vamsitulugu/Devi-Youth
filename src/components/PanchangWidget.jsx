import { useEffect, useState } from 'react';
import { Moon, Sunrise, Sunset, Clock } from 'lucide-react';
import { geocodePlace } from '../services/weather';
import { getTithi, getSunTimes, getAbhijitMuhurta, formatTime } from '../lib/panchang';

const COPY = {
  en: {
    title: 'Today\'s Panchang', sunrise: 'Sunrise', sunset: 'Sunset', muhurta: 'Abhijit Muhurta',
    note: 'Approximate, for reference only — please confirm timings with your temple priest.',
  },
  te: {
    title: 'నేటి పంచాంగం', sunrise: 'సూర్యోదయం', sunset: 'సూర్యాస్తమయం', muhurta: 'అభిజిత్ ముహూర్తం',
    note: 'ఇది సుమారు సమయం మాత్రమే — ఖచ్చితమైన వివరాలకు పురోహితులను సంప్రదించండి.',
  },
};

/** Today's lunar day + sunrise/sunset + Abhijit muhurta. Tithi is computed
 * client-side (no API); sun times come from the free sunrise-sunset.org
 * API once the village name resolves to coordinates. Everything here is
 * explicitly labeled approximate. */
export default function PanchangWidget({ village, lang = 'en' }) {
  const c = COPY[lang] || COPY.en;
  const [sun, setSun] = useState(null);
  const tithi = getTithi();

  useEffect(() => {
    if (!village) return;
    let alive = true;
    geocodePlace(village).then(async (loc) => {
      if (!loc || !alive) return;
      const times = await getSunTimes(loc.lat, loc.lon);
      if (alive) setSun(times);
    });
    return () => { alive = false; };
  }, [village]);

  const muhurta = sun ? getAbhijitMuhurta(sun.sunrise, sun.sunset) : null;

  return (
    <div className="card card-pad panchang-card">
      <div className="panchang-head">
        <Moon size={16} color="var(--color-marigold-text)" />
        <span>{tithi.paksha[lang]} · {tithi.tithi[lang]}</span>
      </div>
      {sun && (
        <div className="panchang-rows">
          <span><Sunrise size={13} /> {c.sunrise} {formatTime(sun.sunrise)}</span>
          <span><Sunset size={13} /> {c.sunset} {formatTime(sun.sunset)}</span>
          {muhurta && <span><Clock size={13} /> {c.muhurta} {formatTime(muhurta.start)}–{formatTime(muhurta.end)}</span>}
        </div>
      )}
      <div className="panchang-note">{c.note}</div>
    </div>
  );
}

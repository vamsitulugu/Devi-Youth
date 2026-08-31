/* Panchang (lunar day) — a pure-JS approximation, no API key, works
 * offline. Sunrise/sunset comes from sunrise-sunset.org (free, no key);
 * if that's unreachable it falls back to a rough calculation so the
 * widget still renders something.
 *
 * IMPORTANT: the tithi/muhurat figures here are approximate — good
 * enough for a "when does the festival day start" reference, not a
 * substitute for a priest's panchangam. The UI must label them as such.
 */

const SYNODIC_MONTH = 29.530588853; // days
// A well-documented new moon reference (2000-01-06 18:14 UTC).
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);

const TITHI_NAMES = [
  { en: 'Prathama', te: 'పాడ్యమి' }, { en: 'Vidhiya', te: 'విదియ' }, { en: 'Tritiya', te: 'తదియ' },
  { en: 'Chaturthi', te: 'చవితి' }, { en: 'Panchami', te: 'పంచమి' }, { en: 'Shashthi', te: 'షష్ఠి' },
  { en: 'Saptami', te: 'సప్తమి' }, { en: 'Ashtami', te: 'అష్టమి' }, { en: 'Navami', te: 'నవమి' },
  { en: 'Dashami', te: 'దశమి' }, { en: 'Ekadashi', te: 'ఏకాదశి' }, { en: 'Dwadashi', te: 'ద్వాదశి' },
  { en: 'Trayodashi', te: 'త్రయోదశి' }, { en: 'Chaturdashi', te: 'చతుర్దశి' },
];

/** Today's tithi (lunar day) and paksha (waxing/waning half), approximate. */
export function getTithi(date = new Date()) {
  const daysSince = (date.getTime() - REF_NEW_MOON) / 86400000;
  const phase = ((daysSince % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH; // 0..29.53
  const index = Math.floor((phase / SYNODIC_MONTH) * 30); // 0..29
  const isShukla = index < 15;
  const dayInHalf = isShukla ? index : index - 15;
  const isFullOrNew = dayInHalf === 14;
  const name = isFullOrNew
    ? (isShukla ? { en: 'Purnima', te: 'పూర్ణిమ' } : { en: 'Amavasya', te: 'అమావాస్య' })
    : TITHI_NAMES[dayInHalf];
  return {
    paksha: isShukla ? { en: 'Shukla Paksha', te: 'శుక్ల పక్షం' } : { en: 'Krishna Paksha', te: 'కృష్ణ పక్షం' },
    tithi: name,
    dayNumber: dayInHalf + 1,
  };
}

/** Sunrise/sunset for a lat/lon on a given date, via sunrise-sunset.org. */
export async function getSunTimes(lat, lon, date = new Date()) {
  const iso = date.toISOString().slice(0, 10);
  try {
    const res = await fetch(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${iso}&formatted=0`);
    const data = await res.json();
    if (data.status !== 'OK') throw new Error('bad status');
    return { sunrise: new Date(data.results.sunrise), sunset: new Date(data.results.sunset) };
  } catch {
    // Rough fallback: assume 6:00 AM / 6:30 PM local, better than nothing.
    const sunrise = new Date(date); sunrise.setHours(6, 0, 0, 0);
    const sunset = new Date(date); sunset.setHours(18, 30, 0, 0);
    return { sunrise, sunset, approximate: true };
  }
}

/** Abhijit muhurta — commonly taken as the ~24-minute window straddling
 * solar noon (midpoint of sunrise/sunset), one of the day's few
 * universally-agreed auspicious windows that doesn't need a full
 * panchangam to compute. */
export function getAbhijitMuhurta(sunrise, sunset) {
  const noon = new Date((sunrise.getTime() + sunset.getTime()) / 2);
  const start = new Date(noon.getTime() - 12 * 60000);
  const end = new Date(noon.getTime() + 12 * 60000);
  return { start, end };
}

export function formatTime(d) {
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Minus, Plus, PartyPopper, Share2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getFestival } from '../services/api';
import { submitRsvp, getRsvpSummary } from '../services/rsvp';
import { useCountUp } from '../hooks/useCountUp';
import Header from '../components/Header';
import Reveal from '../components/Reveal';

const COPY = {
  en: {
    title: 'RSVP', heading: "Let us know you're coming", sub: 'Helps the committee plan food and seating.',
    name: 'Your Name', phone: 'Phone (optional)', guests: 'How many people, including you?',
    submit: "I'll be there", submitting: 'Saving…', totalLabel: 'villagers RSVP\'d so far',
    successTitle: "You're on the list!", successSub: 'See you at the festival.', share: 'Share on WhatsApp',
    nameRequired: 'Please enter your name.',
  },
  te: {
    title: 'హాజరు నమోదు', heading: 'మీరు వస్తున్నారని తెలియజేయండి', sub: 'భోజనం, సీటింగ్ ప్లాన్ చేయడానికి కమిటీకి సహాయపడుతుంది.',
    name: 'మీ పేరు', phone: 'ఫోన్ (ఐచ్ఛికం)', guests: 'మీతో కలిపి మొత్తం ఎంతమంది?',
    submit: 'నేను వస్తాను', submitting: 'సేవ్ చేస్తోంది…', totalLabel: 'మంది గ్రామస్తులు నమోదు చేసుకున్నారు',
    successTitle: 'మీ పేరు నమోదైంది!', successSub: 'ఉత్సవంలో కలుద్దాం.', share: 'వాట్సాప్‌లో పంచుకోండి',
    nameRequired: 'దయచేసి మీ పేరు నమోదు చేయండి.',
  },
};

function AnimatedCount({ value }) {
  const shown = useCountUp(value);
  return <b>{Math.round(shown).toLocaleString('en-IN')}</b>;
}

export default function Rsvp() {
  const { lang } = useLanguage();
  const c = COPY[lang] || COPY.en;
  const [festival, setFestival] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => { getFestival().then(setFestival); }, []);

  async function refreshSummary(festivalId) {
    try { setSummary(await getRsvpSummary(festivalId)); } catch { /* non-fatal */ }
  }

  useEffect(() => { if (festival) refreshSummary(festival.id); }, [festival]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError(c.nameRequired); return; }
    setError('');
    setSaving(true);
    try {
      await submitRsvp({ name, phone, guests, festivalId: festival?.id });
      setDone(true);
      await refreshSummary(festival?.id);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  function share() {
    const text = lang === 'te'
      ? `🙏 నేను ${festival?.name?.[lang] || 'ఉత్సవానికి'} వస్తున్నాను! మీరు కూడా వస్తారా?`
      : `🙏 I'm attending ${festival?.name?.[lang] || 'the festival'}! Will you join too?`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  return (
    <>
      <Header title={c.title} showBack />
      <div className="page">
        {!done ? (
          <>
            <Reveal as="div" className="hero" style={{ minHeight: 140 }}>
              <PartyPopper size={22} color="var(--color-turmeric)" />
              <h1 style={{ fontSize: 'var(--fs-lg)', marginTop: 8 }}>{c.heading}</h1>
              <div className="dates" style={{ marginTop: 4 }}>{c.sub}</div>
            </Reveal>

            {summary && summary.guests > 0 && (
              <Reveal as="div" delay={40} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={18} color="var(--color-marigold-text)" />
                <span><AnimatedCount value={summary.guests} /> {c.totalLabel}</span>
              </Reveal>
            )}

            <Reveal as="form" delay={80} className="card card-pad" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--color-ink-soft)' }}>{c.name}</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ minHeight: 44, padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 'var(--fs-base)', fontFamily: 'var(--font-body)' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--color-ink-soft)' }}>{c.phone}</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ minHeight: 44, padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 'var(--fs-base)', fontFamily: 'var(--font-body)' }}
                />
              </label>
              <div>
                <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--color-ink-soft)' }}>{c.guests}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
                  <button type="button" className="icon-btn-header" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-vermillion)' }} onClick={() => setGuests((g) => Math.max(1, g - 1))} aria-label="Fewer">
                    <Minus size={16} />
                  </button>
                  <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, minWidth: 28, textAlign: 'center' }}>{guests}</span>
                  <button type="button" className="icon-btn-header" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-vermillion)' }} onClick={() => setGuests((g) => Math.min(20, g + 1))} aria-label="More">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              {error && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--fs-sm)' }}>{error}</div>}
              <button className="btn btn-primary btn-block" disabled={saving}>
                {saving ? c.submitting : c.submit}
              </button>
            </Reveal>
          </>
        ) : (
          <Reveal as="div" className="card card-pad" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={40} color="var(--color-leaf)" />
            <h1 style={{ fontSize: 'var(--fs-lg)' }}>{c.successTitle}</h1>
            <p style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--fs-sm)' }}>{c.successSub}</p>
            {summary && (
              <div style={{ margin: '4px 0' }}>
                <AnimatedCount value={summary.guests} /> {c.totalLabel}
              </div>
            )}
            <button className="btn btn-outline btn-block" onClick={share}><Share2 size={15} /> {c.share}</button>
            <Link to="/" className="btn btn-primary btn-block">{lang === 'te' ? 'హోమ్‌కి వెళ్ళండి' : 'Back to Home'}</Link>
          </Reveal>
        )}
      </div>
    </>
  );
}

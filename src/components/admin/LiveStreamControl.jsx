import { useEffect, useState } from 'react';
import { Radio, Copy, Youtube } from 'lucide-react';
import { getLiveStatus, setLiveStatus } from '../../services/livestream';
import { useToast } from './Toast';
import Reveal from '../Reveal';

/**
 * Admin control for the villager Home page's live-session card. Paste
 * the festival's YouTube Live link once, then Go Live / End Stream just
 * toggles whether villagers see the card — the actual broadcasting
 * happens in YouTube Studio/app, same as any normal YouTube Live.
 */
export default function LiveStreamControl({ festivalId }) {
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLiveStatus(festivalId).then((s) => { setStatus(s); setUrl(s.roomUrl || ''); });
  }, [festivalId]);

  async function toggle(next) {
    if (next && !url.trim()) {
      toast('Paste your YouTube Live link first', 'error');
      return;
    }
    setSaving(true);
    try {
      const saved = await setLiveStatus(festivalId, { active: next, roomUrl: url.trim() });
      setStatus(saved);
      toast(next ? "You're live — villagers now see the live card on Home" : 'Stream ended');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function saveUrlOnly() {
    setSaving(true);
    try {
      const saved = await setLiveStatus(festivalId, { active: status?.active || false, roomUrl: url.trim() });
      setStatus(saved);
      toast('Link saved');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!status) return null;

  return (
    <Reveal as="div" className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="icon-badge"><Radio size={18} /></div>
        <strong style={{ flex: 1 }}>Live Session</strong>
        {status.active && <span className="chip chip-danger"><span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%' }} /> ON AIR</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=… or /live/…"
          className="admin-input"
          style={{ flex: 1, minHeight: 40, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 'var(--fs-sm)' }}
        />
        <button type="button" className="icon-btn" onClick={saveUrlOnly} disabled={saving} aria-label="Save link"><Copy size={15} /></button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {!status.active ? (
          <button className="btn btn-primary btn-block" disabled={saving} onClick={() => toggle(true)}>
            Go Live
          </button>
        ) : (
          <button className="btn btn-block" style={{ background: 'var(--color-danger)', color: '#fff' }} disabled={saving} onClick={() => toggle(false)}>
            End Stream
          </button>
        )}
      </div>
      <div className="meta" style={{ fontSize: 'var(--fs-xs)', display: 'flex', alignItems: 'center', gap: 5 }}>
        <Youtube size={13} /> Broadcast from the YouTube app/Studio as usual — this just controls the card villagers see on Home.
      </div>
    </Reveal>
  );
}

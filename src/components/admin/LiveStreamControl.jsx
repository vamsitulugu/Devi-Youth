import { useEffect, useRef, useState } from 'react';
import { Room, Track, createLocalTracks } from 'livekit-client';
import { Radio, Video, Square } from 'lucide-react';
import { getLiveStatus, setLiveStatus } from '../../services/livestream';
import { fetchLiveKitToken, randomIdentity } from '../../services/livekit';
import { useToast } from './Toast';
import Reveal from '../Reveal';

/**
 * Broadcaster control. Enter your LiveKit project's WSS URL and a room
 * name once (saved), then "Go Live" turns this device's camera/mic on
 * and publishes them into that room — every villager on Home connects
 * as a subscriber via LiveStream.jsx. "End Stream" stops publishing
 * and flips the flag villagers watch off.
 */
export default function LiveStreamControl({ festivalId }) {
  const toast = useToast();
  const videoRef = useRef(null);
  const roomRef = useRef(null);
  const tracksRef = useRef([]);
  const [status, setStatus] = useState(null);
  const [wsUrl, setWsUrl] = useState('');
  const [roomName, setRoomName] = useState('');
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getLiveStatus(festivalId).then((s) => {
      setStatus(s);
      setWsUrl(s.wsUrl || '');
      setRoomName(s.roomName || 'festival-live');
      setLive(Boolean(s.active));
    });
  }, [festivalId]);

  useEffect(() => () => {
    tracksRef.current.forEach((t) => t.stop());
    roomRef.current?.disconnect();
  }, []);

  async function saveConfig() {
    setBusy(true);
    try {
      const saved = await setLiveStatus(festivalId, { active: live, wsUrl: wsUrl.trim(), roomName: roomName.trim() });
      setStatus(saved);
      toast('Live stream settings saved');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function goLive() {
    if (!wsUrl.trim() || !roomName.trim()) {
      toast('Enter your LiveKit URL and a room name first', 'error');
      return;
    }
    setBusy(true);
    try {
      const identity = randomIdentity('host');
      const token = await fetchLiveKitToken({ room: roomName.trim(), identity, name: 'Broadcaster', canPublish: true });
      const room = new Room();
      roomRef.current = room;
      await room.connect(wsUrl.trim(), token);
      const tracks = await createLocalTracks({ audio: true, video: true });
      tracksRef.current = tracks;
      for (const track of tracks) {
        await room.localParticipant.publishTrack(track);
        if (track.kind === Track.Kind.Video && videoRef.current) track.attach(videoRef.current);
      }
      const saved = await setLiveStatus(festivalId, { active: true, wsUrl: wsUrl.trim(), roomName: roomName.trim() });
      setStatus(saved);
      setLive(true);
      toast("You're live!");
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function endStream() {
    setBusy(true);
    try {
      tracksRef.current.forEach((t) => t.stop());
      tracksRef.current = [];
      roomRef.current?.disconnect();
      roomRef.current = null;
      const saved = await setLiveStatus(festivalId, { active: false, wsUrl: wsUrl.trim(), roomName: roomName.trim() });
      setStatus(saved);
      setLive(false);
      toast('Stream ended');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (!status) return null;

  return (
    <Reveal as="div" className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="icon-badge"><Radio size={18} /></div>
        <strong style={{ flex: 1 }}>Live Stream</strong>
        {live && <span className="chip chip-danger"><span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%' }} /> ON AIR</span>}
      </div>

      {!live ? (
        <>
          <input
            value={wsUrl}
            onChange={(e) => setWsUrl(e.target.value)}
            placeholder="wss://your-project.livekit.cloud"
            className="admin-input"
            style={{ minHeight: 40, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 'var(--fs-sm)' }}
          />
          <input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="festival-live"
            className="admin-input"
            style={{ minHeight: 40, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', fontSize: 'var(--fs-sm)' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={saveConfig} disabled={busy}>Save</button>
            <button type="button" className="btn btn-primary btn-block" onClick={goLive} disabled={busy}>
              <Video size={16} /> Go Live
            </button>
          </div>
        </>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: 'var(--radius-md)', background: '#000', aspectRatio: '4/3', objectFit: 'cover' }} />
          <button type="button" className="btn btn-block" style={{ background: 'var(--color-danger)', color: '#fff' }} onClick={endStream} disabled={busy}>
            <Square size={15} /> End Stream
          </button>
        </>
      )}
      <div className="meta" style={{ fontSize: 'var(--fs-xs)' }}>
        One-time setup: create a free LiveKit Cloud project, paste its WSS URL above. Camera/mic runs from this device the whole time you're live.
      </div>
    </Reveal>
  );
}

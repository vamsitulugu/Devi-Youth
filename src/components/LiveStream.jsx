import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { Users, Send } from 'lucide-react';
import { fetchLiveKitToken, randomIdentity } from '../services/livekit';

const COPY = {
  en: { live: 'Live Now', connecting: 'Connecting…', chatPlaceholder: 'Say something…', send: 'Send' },
  te: { live: 'ప్రత్యక్ష ప్రసారం', connecting: 'కనెక్ట్ అవుతోంది…', chatPlaceholder: 'ఏదైనా చెప్పండి…', send: 'పంపండి' },
};

/**
 * Real in-app live video — this is your own broadcast, not a link to
 * another site. Connects to your LiveKit room as a view-only
 * subscriber and renders the broadcaster's camera into a plain
 * <video> element this component owns, plus a lightweight text chat
 * over LiveKit's data channel (no extra backend for chat).
 */
export default function LiveStream({ active, roomName, wsUrl, lang = 'en' }) {
  const c = COPY[lang] || COPY.en;
  const videoRef = useRef(null);
  const roomRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [count, setCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    if (!active || !roomName || !wsUrl) return;
    let cancelled = false;
    const room = new Room();
    roomRef.current = room;

    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === Track.Kind.Video && videoRef.current) track.attach(videoRef.current);
    });
    room.on(RoomEvent.ParticipantConnected, () => setCount(room.numParticipants));
    room.on(RoomEvent.ParticipantDisconnected, () => setCount(room.numParticipants));
    room.on(RoomEvent.DataReceived, (payload) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        setMessages((m) => [...m.slice(-49), msg]);
      } catch { /* ignore malformed payloads */ }
    });

    (async () => {
      try {
        const identity = randomIdentity('viewer');
        const token = await fetchLiveKitToken({ room: roomName, identity, name: 'Viewer', canPublish: false });
        if (cancelled) return;
        await room.connect(wsUrl, token);
        if (cancelled) { room.disconnect(); return; }
        setConnected(true);
        setCount(room.numParticipants);
      } catch (err) {
        console.warn('Live stream connect failed:', err.message);
      }
    })();

    return () => {
      cancelled = true;
      room.disconnect();
      roomRef.current = null;
    };
  }, [active, roomName, wsUrl]);

  function sendMessage(e) {
    e.preventDefault();
    if (!chatInput.trim() || !roomRef.current) return;
    const msg = { text: chatInput.trim(), from: 'Viewer', at: Date.now() };
    roomRef.current.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(msg)), { reliable: true });
    setMessages((m) => [...m.slice(-49), msg]);
    setChatInput('');
  }

  if (!active || !roomName || !wsUrl) return null;

  return (
    <div className="card livestream-card">
      <div className="livestream-badge">
        <span className="live-dot" style={{ width: 8, height: 8, borderRadius: '50%' }} />
        {c.live}{count > 0 && <><Users size={12} style={{ marginLeft: 4 }} /> {count}</>}
      </div>
      <div className="livestream-frame livestream-frame-tall">
        <video ref={videoRef} autoPlay playsInline />
        {!connected && <div className="livestream-connecting">{c.connecting}</div>}
      </div>
      <div className="livestream-chat">
        <div className="livestream-chat-log">
          {messages.map((m, i) => (
            <div key={i} className="livestream-chat-msg"><b>{m.from}:</b> {m.text}</div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="livestream-chat-form">
          <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={c.chatPlaceholder} />
          <button type="submit" aria-label={c.send}><Send size={15} /></button>
        </form>
      </div>
    </div>
  );
}

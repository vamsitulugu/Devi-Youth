import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { Users, Send, X, Maximize, Minimize, Radio, ChevronRight, Smile } from 'lucide-react';
import { fetchLiveKitToken, randomIdentity } from '../services/livekit';

const REACTIONS = ['❤️', '🙏', '🎉', '👏', '😍', '🔥'];
const NAME_KEY = 'gc_viewer_chat_name';

const COPY = {
  en: {
    live: 'Live Now', tap: 'Tap to watch', connecting: 'Connecting…', chatPlaceholder: 'Say something…',
    nameTitle: 'Join the chat', namePlaceholder: 'Your name', nameCta: 'Continue',
  },
  te: {
    live: 'ప్రత్యక్ష ప్రసారం', tap: 'చూడటానికి నొక్కండి', connecting: 'కనెక్ట్ అవుతోంది…', chatPlaceholder: 'ఏదైనా చెప్పండి…',
    nameTitle: 'చాట్‌లో చేరండి', namePlaceholder: 'మీ పేరు', nameCta: 'కొనసాగించండి',
  },
};

let emojiSeq = 0;
const AVATAR_COLORS = ['#C22B1F', '#C77A00', '#2F6B3E', '#1E6FA6', '#7A4FB5'];
function colorFor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

/**
 * Villager-facing live stream. A small horizontal teaser card sits on
 * Home (cheap — a static 16:9 preview, never opens a video connection
 * by itself); tapping it opens the real thing full-screen: your
 * broadcast video correctly framed to the orientation the broadcaster
 * chose, a live viewer count, a fullscreen toggle, emoji reactions that
 * float over the video, and real text chat with named/colored senders.
 */
export default function LiveStream({ active, roomName, wsUrl, orientation = 'landscape', lang = 'en' }) {
  const c = COPY[lang] || COPY.en;
  const [open, setOpen] = useState(false);

  if (!active || !roomName || !wsUrl) return null;

  return (
    <>
      <div className="live-teaser" onClick={() => setOpen(true)} role="button" tabIndex={0}>
        <div className="live-teaser-thumb">
          <Radio size={22} />
          <span className="live-teaser-thumb-dot" />
        </div>
        <div className="live-teaser-body">
          <div className="live-teaser-title">
            <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%' }} /> {c.live}
          </div>
          <div className="live-teaser-sub">{c.tap}</div>
        </div>
        <ChevronRight size={20} className="live-teaser-chevron" />
      </div>
      {open && <LiveModal roomName={roomName} wsUrl={wsUrl} orientation={orientation} lang={lang} onClose={() => setOpen(false)} />}
    </>
  );
}

function LiveModal({ roomName, wsUrl, orientation, lang, onClose }) {
  const c = COPY[lang] || COPY.en;
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const roomRef = useRef(null);
  const chatLogRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [count, setCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [floaters, setFloaters] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [viewerName, setViewerName] = useState(() => {
    try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; }
  });
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
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
        if (msg.type === 'reaction') spawnFloater(msg.emoji);
        else setMessages((m) => [...m.slice(-49), msg]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName, wsUrl]);

  useEffect(() => {
    if (chatLogRef.current) chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  function spawnFloater(emoji) {
    const id = ++emojiSeq;
    const left = 8 + Math.random() * 74;
    setFloaters((f) => [...f.slice(-15), { id, emoji, left }]);
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 2700);
  }

  function sendReaction(emoji) {
    spawnFloater(emoji);
    setShowReactions(false);
    roomRef.current?.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify({ type: 'reaction', emoji })),
      { reliable: true }
    );
  }

  function confirmName(e) {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    try { localStorage.setItem(NAME_KEY, name); } catch { /* private mode */ }
    setViewerName(name);
  }

  function sendMessage(e) {
    e.preventDefault();
    if (!chatInput.trim() || !roomRef.current || !viewerName) return;
    const msg = { type: 'chat', text: chatInput.trim(), from: viewerName, at: Date.now() };
    roomRef.current.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(msg)), { reliable: true });
    setMessages((m) => [...m.slice(-49), msg]);
    setChatInput('');
  }

  function toggleFullscreen() {
    if (!wrapRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapRef.current.requestFullscreen?.();
  }

  const isPortrait = orientation === 'portrait';

  return (
    <div className="live-modal-backdrop">
      <div className="live-modal-topbar">
        <span className="live-modal-badge">
          <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%' }} /> {c.live}
        </span>
        {count > 0 && <span className="live-modal-count"><Users size={13} /> {count}</span>}
        <div className="live-modal-topbar-actions">
          <button className="live-modal-icon-btn" onClick={toggleFullscreen} aria-label="Fullscreen">
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <button className="live-modal-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
      </div>

      <div className={`live-modal-video-wrap${isPortrait ? ' portrait' : ''}`} ref={wrapRef}>
        <video ref={videoRef} autoPlay playsInline />
        {!connected && <div className="live-modal-connecting">{c.connecting}</div>}
        <div className="live-modal-reactions-float">
          {floaters.map((f) => (
            <span key={f.id} className="live-emoji-float" style={{ left: `${f.left}%` }}>{f.emoji}</span>
          ))}
        </div>
      </div>

      <div className="live-modal-lower">
        <div className="live-modal-chat">
          <div className="live-modal-chat-log" ref={chatLogRef}>
            {messages.map((m, i) => (
              <div key={i} className="live-modal-chat-msg">
                <span className="live-modal-chat-avatar" style={{ background: colorFor(m.from) }}>{m.from[0]?.toUpperCase()}</span>
                <span><b style={{ color: colorFor(m.from) }}>{m.from}</b> {m.text}</span>
              </div>
            ))}
          </div>

          {viewerName ? (
            <form onSubmit={sendMessage} className="live-modal-chat-form">
              <button type="button" className="live-modal-emoji-toggle" onClick={() => setShowReactions((s) => !s)} aria-label="Reactions">
                <Smile size={18} />
              </button>
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={c.chatPlaceholder} />
              <button type="submit" aria-label="Send"><Send size={16} /></button>
            </form>
          ) : (
            <form onSubmit={confirmName} className="live-modal-name-form">
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={c.namePlaceholder} autoFocus />
              <button type="submit">{c.nameCta}</button>
            </form>
          )}

          {showReactions && (
            <div className="live-modal-reactions-bar">
              {REACTIONS.map((e) => (
                <button key={e} type="button" className="live-modal-reaction-btn" onClick={() => sendReaction(e)}>{e}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

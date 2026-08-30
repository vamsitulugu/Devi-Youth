import { useEffect, useRef, useState } from 'react';
import { RotateCw, Loader2 } from 'lucide-react';

const TRIGGER_DISTANCE = 72; // px of downward pull needed to arm a reload
const MAX_PULL = 110; // visual cap so the indicator doesn't run away

// Wraps the scrollable page content and reloads the whole app when the
// person pulls down from the very top of the page — the familiar
// "pull to refresh" gesture. Only activates when the page is already
// scrolled to the top (window.scrollY === 0), so it never fights with
// normal scrolling through a long list further down the page.
//
// The indicator floats over the content (like native apps) instead of
// pushing it down — the page itself never moves during the gesture.
export default function PullToRefresh({ children }) {
  const [pull, setPull] = useState(0);
  const [ready, setReady] = useState(false);
  const [reloading, setReloading] = useState(false);
  const startYRef = useRef(null);

  useEffect(() => {
    function onTouchStart(e) {
      if (window.scrollY > 0 || reloading) {
        startYRef.current = null;
        return;
      }
      startYRef.current = e.touches[0].clientY;
    }

    function onTouchMove(e) {
      if (startYRef.current === null) return;
      // If the page has scrolled away from the top mid-gesture, bail out.
      if (window.scrollY > 0) {
        startYRef.current = null;
        setPull(0);
        setReady(false);
        return;
      }
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0) {
        setPull(0);
        setReady(false);
        return;
      }
      setPull(Math.min(delta, MAX_PULL));
      setReady(delta >= TRIGGER_DISTANCE);
    }

    function onTouchEnd() {
      if (ready) {
        setReloading(true);
        setPull(TRIGGER_DISTANCE);
        window.location.reload();
        return;
      }
      startYRef.current = null;
      setPull(0);
      setReady(false);
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, reloading]);

  const visible = pull > 0 || reloading;

  return (
    <div style={{ position: 'relative' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: 36,
          height: 36,
          marginLeft: -18,
          marginTop: -18,
          borderRadius: '50%',
          background: 'var(--color-surface, #fff)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-vermillion)',
          opacity: visible ? Math.min(pull / TRIGGER_DISTANCE, 1) : 0,
          transform: `translateY(${visible ? Math.min(pull, TRIGGER_DISTANCE) : 0}px)`,
          transition: pull === 0 && !reloading ? 'opacity 0.15s ease, transform 0.15s ease' : 'none',
          pointerEvents: 'none',
          zIndex: 30,
        }}
      >
        {reloading ? (
          <Loader2 size={18} className="spin" />
        ) : (
          <RotateCw size={18} style={{ transform: `rotate(${pull * 3}deg)` }} />
        )}
      </div>
      {children}
    </div>
  );
}
import { useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';

const TRIGGER_DISTANCE = 72; // px of downward pull needed to arm a reload
const MAX_PULL = 110; // visual cap so the indicator doesn't run away

// Wraps the scrollable page content and reloads the whole app when the
// person pulls down from the very top of the page — the familiar
// "pull to refresh" gesture. Only activates when the page is already
// scrolled to the top (window.scrollY === 0), so it never fights with
// normal scrolling through a long list further down the page.
export default function PullToRefresh({ children }) {
  const [pull, setPull] = useState(0);
  const [ready, setReady] = useState(false);
  const startYRef = useRef(null);

  useEffect(() => {
    function onTouchStart(e) {
      if (window.scrollY > 0) {
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
  }, [ready]);

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          height: pull,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          transition: pull === 0 ? 'height 0.15s ease' : 'none',
          color: 'var(--color-vermillion)',
        }}
      >
        {pull > 0 && (
          <RotateCw
            size={20}
            style={{
              transform: `rotate(${pull * 3}deg)`,
              opacity: Math.min(pull / TRIGGER_DISTANCE, 1),
            }}
          />
        )}
      </div>
      {children}
    </>
  );
}

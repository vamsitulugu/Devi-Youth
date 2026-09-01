import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 68;
const MAX_PULL = 96;

/**
 * Wraps the whole routed area (see App.jsx). On mobile there's no
 * separate scroll container — the window itself scrolls — so this only
 * arms when the page is already scrolled to the top, then tracks touch
 * drag distance with a rubber-band curve. Crossing the threshold and
 * releasing reloads the app (simplest correct behavior for a generic
 * wrapper that sits above every route and can't know each page's own
 * data-loading function). Also doubles as the app's page-transition:
 * keying the inner content on the route path re-triggers a short
 * fade/rise on every navigation, consistent everywhere for free.
 */
export default function PullToRefresh({ children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const armed = useRef(false);
  const { pathname } = useLocation();

  function onTouchStart(e) {
    if (refreshing || window.scrollY > 0) { armed.current = false; return; }
    armed.current = true;
    startY.current = e.touches[0].clientY;
  }

  function onTouchMove(e) {
    if (!armed.current || startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) { setPull(0); return; }
    setPull(Math.min(MAX_PULL, delta * 0.5));
  }

  function onTouchEnd() {
    if (!armed.current) return;
    armed.current = false;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD);
      setTimeout(() => window.location.reload(), 350);
    } else {
      setPull(0);
    }
    startY.current = null;
  }

  const progress = Math.min(1, pull / THRESHOLD);

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="ptr-indicator" style={{ height: pull, opacity: pull > 4 ? 1 : 0 }}>
        <RefreshCw
          size={20}
          className={refreshing ? 'ptr-spin' : ''}
          style={{ transform: refreshing ? undefined : `rotate(${progress * 220}deg)`, color: 'var(--color-vermillion)' }}
        />
      </div>
      <div key={pathname} className="page-fade" style={{ transform: `translateY(${pull}px)` }}>
        {children}
      </div>
    </div>
  );
}

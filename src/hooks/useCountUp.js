import { useEffect, useRef, useState } from 'react';

/** Counts a number up from 0 the first time it's rendered — used for
 * money/stat figures so they animate in instead of appearing static. */
export function useCountUp(target, ms = 1100) {
  const [v, setV] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (!target) { setV(0); return undefined; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); return undefined; }
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / ms);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, ms]);
  return v;
}

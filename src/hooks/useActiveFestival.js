import { useEffect, useState, useCallback } from 'react';
import { listFestivals } from '../services/adminApi';

// If the network stalls, don't leave every admin screen spinning forever —
// surface an error after a few seconds so committee members can retry
// instead of staring at a blank skeleton indefinitely.
function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out. Check your connection and try again.')), ms)),
  ]);
}

// Admin screens work against one "current" festival at a time — defaults
// to the active one, but committee/admin can switch via Settings to edit
// an older year's data (e.g. entering a lottery result after the fact).
export function useActiveFestival() {
  const [festivals, setFestivals] = useState([]);
  const [festivalId, setFestivalId] = useState(() => localStorage.getItem('gc_admin_festival') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await withTimeout(listFestivals());
      setFestivals(list);
      setError(null);
      setFestivalId((current) => {
        if (current && list.some((f) => f.id === current)) return current;
        const active = list.find((f) => f.is_active) || list[0];
        return active?.id || null;
      });
    } catch (e) {
      // Never leave the caller stuck waiting on a festivalId that will
      // never arrive — surface the error and resolve to "no festival".
      setError(e);
      setFestivals([]);
      setFestivalId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const selectFestival = useCallback((id) => {
    setFestivalId(id);
    localStorage.setItem('gc_admin_festival', id);
  }, []);

  const festival = festivals.find((f) => f.id === festivalId) || null;

  return { festivals, festival, festivalId, selectFestival, loading, error, reload };
}

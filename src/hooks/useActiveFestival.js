import { useEffect, useState, useCallback } from 'react';
import { listFestivals } from '../services/adminApi';

// Admin screens work against one "current" festival at a time — defaults
// to the active one, but committee/admin can switch via Settings to edit
// an older year's data (e.g. entering a lottery result after the fact).
export function useActiveFestival() {
  const [festivals, setFestivals] = useState([]);
  const [festivalId, setFestivalId] = useState(() => localStorage.getItem('gc_admin_festival') || null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listFestivals();
      setFestivals(list);
      setFestivalId((current) => {
        if (current && list.some((f) => f.id === current)) return current;
        const active = list.find((f) => f.is_active) || list[0];
        return active?.id || null;
      });
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

  return { festivals, festival, festivalId, selectFestival, loading, reload };
}

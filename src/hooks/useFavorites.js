import { useCallback, useSyncExternalStore } from 'react';

/**
 * Saved photos / favorites — persisted to localStorage, shared across
 * every component instance so a heart tapped in the Gallery is already
 * filled when the same photo appears on Home.
 *
 *   const { isFav, toggle, ids } = useFavorites();
 */

const KEY = 'gc_favorites';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

let ids = load();
let snapshot = [...ids];
const listeners = new Set();

function emit() {
  snapshot = [...ids];
  listeners.forEach((l) => l());
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useFavorites() {
  const list = useSyncExternalStore(subscribe, () => snapshot, () => snapshot);

  const toggle = useCallback((id) => {
    if (!id) return;
    const key = String(id);
    if (ids.has(key)) ids.delete(key);
    else ids.add(key);
    try { localStorage.setItem(KEY, JSON.stringify([...ids])); } catch { /* private mode */ }
    emit();
  }, []);

  const isFav = useCallback((id) => ids.has(String(id)), [list]);

  return { ids: list, isFav, toggle, count: list.length };
}

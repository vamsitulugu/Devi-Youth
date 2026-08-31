import { useSyncExternalStore } from 'react';

const KEY = 'gc_rsvp_local_v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

let cache = load();
const listeners = new Set();
function emit() { cache = load(); listeners.forEach((l) => l()); }
function persist(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* private mode */ }
  emit();
}

/**
 * RSVP / headcount — same "Supabase if configured, else localStorage"
 * fallback pattern as services/api.js, so it works out of the box on
 * sample data and upgrades to real storage once Supabase is wired.
 * Run supabase/13_rsvp.sql before pointing this at a live project.
 */
export async function submitRsvp({ name, phone, guests, festivalId }) {
  let supabase, isSupabaseConfigured;
  try { ({ supabase, isSupabaseConfigured } = await import('../lib/supabaseClient')); } catch { isSupabaseConfigured = false; }
  const row = { name: name.trim(), phone: phone?.trim() || null, guests: Math.max(1, Number(guests) || 1) };

  if (isSupabaseConfigured && festivalId) {
    const { data, error } = await supabase.from('rsvps').insert({ ...row, festival_id: festivalId }).select().single();
    if (error) throw error;
    return data;
  }
  const list = load();
  const withId = { ...row, id: `local_${Date.now()}`, created_at: new Date().toISOString() };
  list.push(withId);
  persist(list);
  return withId;
}

export async function getRsvpSummary(festivalId) {
  let supabase, isSupabaseConfigured;
  try { ({ supabase, isSupabaseConfigured } = await import('../lib/supabaseClient')); } catch { isSupabaseConfigured = false; }
  if (isSupabaseConfigured && festivalId) {
    const { data, error } = await supabase.from('rsvps').select('guests').eq('festival_id', festivalId);
    if (error) throw error;
    return { count: data.length, guests: data.reduce((s, r) => s + Number(r.guests || 1), 0) };
  }
  const list = load();
  return { count: list.length, guests: list.reduce((s, r) => s + Number(r.guests || 1), 0) };
}

export async function listRsvps(festivalId) {
  let supabase, isSupabaseConfigured;
  try { ({ supabase, isSupabaseConfigured } = await import('../lib/supabaseClient')); } catch { isSupabaseConfigured = false; }
  if (isSupabaseConfigured && festivalId) {
    const { data, error } = await supabase.from('rsvps').select('*').eq('festival_id', festivalId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
  return load().slice().reverse();
}

export async function deleteRsvp(id) {
  let supabase, isSupabaseConfigured;
  try { ({ supabase, isSupabaseConfigured } = await import('../lib/supabaseClient')); } catch { isSupabaseConfigured = false; }
  if (isSupabaseConfigured && !String(id).startsWith('local_')) {
    const { error } = await supabase.from('rsvps').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  persist(load().filter((r) => r.id !== id));
}

/** Live local count for components that just want the number — updates
 * instantly after a local submit even without Supabase configured. */
export function useLocalRsvpCount() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => cache,
    () => cache,
  ).reduce((s, r) => s + Number(r.guests || 1), 0);
}

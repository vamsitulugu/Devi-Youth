/** Live-stream status + config: which LiveKit room the villager Home
 * page should join, and whether it's currently "on air". Same
 * Supabase-or-localStorage fallback pattern as every other service in
 * this app — works on sample data, upgrades to real persistence once
 * Supabase is configured and 15_livekit.sql has been run. */

const LOCAL_KEY = 'gc_live_status_v2';

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null') || { active: false, roomName: '', wsUrl: '' }; }
  catch { return { active: false, roomName: '', wsUrl: '' }; }
}
function saveLocal(status) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(status)); } catch { /* private mode */ }
}

async function backend() {
  try {
    const { supabase, isSupabaseConfigured } = await import('../lib/supabaseClient');
    return { supabase, isSupabaseConfigured };
  } catch {
    return { isSupabaseConfigured: false };
  }
}

export async function getLiveStatus(festivalId) {
  const { supabase, isSupabaseConfigured } = await backend();
  if (isSupabaseConfigured && festivalId) {
    const { data, error } = await supabase
      .from('festivals')
      .select('live_active, live_room_name, live_ws_url')
      .eq('id', festivalId)
      .maybeSingle();
    if (error) throw error;
    return { active: Boolean(data?.live_active), roomName: data?.live_room_name || '', wsUrl: data?.live_ws_url || '' };
  }
  return loadLocal();
}

export async function setLiveStatus(festivalId, { active, roomName, wsUrl }) {
  const { supabase, isSupabaseConfigured } = await backend();
  const status = { active: Boolean(active), roomName: roomName || '', wsUrl: wsUrl || '' };
  if (isSupabaseConfigured && festivalId) {
    const { error } = await supabase
      .from('festivals')
      .update({ live_active: status.active, live_room_name: status.roomName, live_ws_url: status.wsUrl })
      .eq('id', festivalId);
    if (error) throw error;
    return status;
  }
  saveLocal(status);
  return status;
}

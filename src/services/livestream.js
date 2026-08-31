/** Live-stream status: which Daily.co room to embed, and whether it's
 * currently "on air" per the admin toggle. Same Supabase-or-localStorage
 * fallback pattern as every other service in this app — works on sample
 * data with zero setup, upgrades to real persistence once Supabase is
 * configured and 14_live_stream.sql has been run.
 */

const LOCAL_KEY = 'gc_live_status_v1';

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null') || { active: false, roomUrl: '' }; }
  catch { return { active: false, roomUrl: '' }; }
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
      .select('live_active, live_room_url')
      .eq('id', festivalId)
      .maybeSingle();
    if (error) throw error;
    return { active: Boolean(data?.live_active), roomUrl: data?.live_room_url || '' };
  }
  return loadLocal();
}

export async function setLiveStatus(festivalId, { active, roomUrl }) {
  const { supabase, isSupabaseConfigured } = await backend();
  const status = { active: Boolean(active), roomUrl: roomUrl || '' };
  if (isSupabaseConfigured && festivalId) {
    const { error } = await supabase
      .from('festivals')
      .update({ live_active: status.active, live_room_url: status.roomUrl })
      .eq('id', festivalId);
    if (error) throw error;
    return status;
  }
  saveLocal(status);
  return status;
}

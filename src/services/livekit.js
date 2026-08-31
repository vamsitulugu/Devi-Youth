import { supabase } from '../lib/supabaseClient';

/** Asks our Supabase Edge Function to mint a short-lived LiveKit access
 * token. The LiveKit API secret never reaches the browser — only this
 * server-side function holds it (see supabase/functions/livekit-token). */
export async function fetchLiveKitToken({ room, identity, name, canPublish }) {
  const { data, error } = await supabase.functions.invoke('livekit-token', {
    body: { room, identity, name, canPublish },
  });
  if (error) throw new Error(error.message || 'Could not get a live-stream token.');
  if (data?.error) throw new Error(data.error);
  return data.token;
}

export function randomIdentity(prefix = 'viewer') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

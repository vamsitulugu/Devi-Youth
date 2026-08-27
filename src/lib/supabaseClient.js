import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// During Phase 1 (foundation + public UI) the app runs entirely on
// sample data, so it's fine for these to be undefined in local dev.
// From Phase 2 onward, set them in .env (see .env.example).
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const isSupabaseConfigured = Boolean(supabase);

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!isSupabaseConfigured || !userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data || null);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data?.session?.user || null;
      setUser(sessionUser);
      if (sessionUser) await loadProfile(sessionUser.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user || null;
      setUser(sessionUser);
      if (sessionUser) {
        await loadProfile(sessionUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => sub?.subscription?.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email, password, expectedRole) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Supabase is not configured yet. Add your keys to .env first.' } };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };

    if (expectedRole) {
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
      if ((prof?.role || 'villager') !== expectedRole) {
        await supabase.auth.signOut();
        return { error: { message: `That account isn't set up as ${expectedRole}. Pick the correct role and try again.` } };
      }
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  }, []);

  const role = profile?.role || (user ? 'villager' : null);
  const isAdmin = role === 'admin';
  const isCommitteeOrAdmin = role === 'admin' || role === 'committee';

  const value = {
    user,
    profile,
    role,
    isAdmin,
    isCommitteeOrAdmin,
    loading,
    signIn,
    signOut,
    refreshProfile: () => user && loadProfile(user.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

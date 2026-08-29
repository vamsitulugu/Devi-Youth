import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // True for the brief window between "Supabase confirmed the
  // password" and "we've checked the selected role actually matches".
  // Rendering must wait on this too, or the previously-logged-in
  // admin's page flashes for a frame before the role mismatch signs
  // them back out — see signIn() below.
  const [verifyingRole, setVerifyingRole] = useState(false);
  // Flips true when we were logged in and got silently logged out
  // without the person choosing to (their token expired / was
  // revoked). ProtectedRoute shows a clear "please log in again"
  // message instead of just bouncing them to a blank login screen.
  const [sessionExpired, setSessionExpired] = useState(false);
  const wasSignedInRef = useRef(false);
  const manualSignOutRef = useRef(false);

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
      wasSignedInRef.current = Boolean(sessionUser);
      if (sessionUser) await loadProfile(sessionUser.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      const sessionUser = session?.user || null;

      if (event === 'SIGNED_OUT' && wasSignedInRef.current && !manualSignOutRef.current) {
        // Not a click on "Log Out" — the token expired or was revoked
        // elsewhere. Surface that plainly instead of a silent bounce.
        setSessionExpired(true);
      }
      manualSignOutRef.current = false;

      setUser(sessionUser);
      wasSignedInRef.current = Boolean(sessionUser);
      if (sessionUser) {
        setSessionExpired(false);
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
    // Set before signInWithPassword: the moment Supabase accepts the
    // password it fires onAuthStateChange and `user` flips to
    // truthy — ProtectedRoute must see verifyingRole=true at that
    // exact instant, so it keeps showing the loading state instead of
    // the page underneath, in case we have to undo this below.
    setVerifyingRole(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setVerifyingRole(false);
      return { error };
    }

    if (expectedRole) {
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
      if ((prof?.role || 'villager') !== expectedRole) {
        await supabase.auth.signOut();
        setVerifyingRole(false);
        return { error: { message: `That account isn't set up as ${expectedRole}. Pick the correct role and try again.` } };
      }
    }
    setVerifyingRole(false);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    manualSignOutRef.current = true;
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
    verifyingRole,
    sessionExpired,
    clearSessionExpired: () => setSessionExpired(false),
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

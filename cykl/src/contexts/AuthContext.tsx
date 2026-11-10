import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { getProfile } from '../services/profile.service';
import * as authService from '../services/auth.service';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: (p: Profile) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    }).catch(() => setInitializing(false));
    // Dentro do callback apenas atualizamos estado (chamar o Supabase aqui pode travar).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  const refreshProfile = useCallback(async () => {
    if (!userId) { setProfile(null); return; }
    try { setProfile(await getProfile(userId)); } catch { setProfile(null); }
  }, [userId]);

  useEffect(() => { void refreshProfile(); }, [refreshProfile]);

  const value = useMemo<AuthState>(() => ({
    session, user: session?.user ?? null, profile, initializing,
    signIn: authService.signInWithPassword,
    signUp: authService.signUpWithPassword,
    signOut: authService.signOut,
    refreshProfile, setProfile,
  }), [session, profile, initializing, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

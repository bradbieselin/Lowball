import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../lib/supabase';
import { setForceSignOut } from '../services/api';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Track whether the auth state listener has fired at least once.
  // Once it has, it becomes the sole source of truth and getSession
  // results are ignored to avoid race conditions.
  const listenerFiredRef = useRef(false);

  // Register the force-sign-out callback so the API layer can clear auth state
  // when a token refresh fails, without needing React context.
  const forceSignOut = useCallback(async () => {
    // Clear the persisted Supabase session, not just React state
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setSession(null);
  }, []);

  useEffect(() => {
    setForceSignOut(forceSignOut);
  }, [forceSignOut]);

  useEffect(() => {
    // Subscribe to auth state changes first — this is the source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      listenerFiredRef.current = true;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Use getSession only as a fallback for the initial state, in case the
    // listener hasn't fired yet by the time the promise resolves.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!listenerFiredRef.current) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const signInWithApple = async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS.');
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token returned from Apple.');
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;
      // onAuthStateChange listener picks up the new session automatically
    } catch (err: any) {
      // User cancelled — do nothing
      if (err.code === 'ERR_REQUEST_CANCELED') return;
      throw new Error(err.message || 'Apple Sign-In failed. Please try again.');
    }
  };

  return { user, session, loading, signIn, signUp, signOut, resetPassword, signInWithApple };
}

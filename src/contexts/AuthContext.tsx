import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { initializePurchases, logOutPurchases } from '../services/purchases';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  // Initialize RevenueCat when user is authenticated, log out when they sign out
  useEffect(() => {
    if (auth.user?.id) {
      initializePurchases(auth.user.id).catch((err) =>
        console.warn('RevenueCat init failed:', err)
      );
    } else {
      logOutPurchases().catch((err) =>
        console.warn('RevenueCat logout failed:', err)
      );
    }
  }, [auth.user?.id]);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}

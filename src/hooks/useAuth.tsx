import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: string | null;
  profile: any | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mencegah double fetch saat refresh manual
  const isInitialFetchDone = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
  try {
    const cachedRole = localStorage.getItem(`role_${userId}`);
    if (cachedRole) {
      setRole(cachedRole);
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Profile Fetch Error:", error);
      if (!cachedRole) setRole('user');
      return;
    }

    if (data) {
      setProfile(data);
      setRole(data.role);
      localStorage.setItem(`role_${userId}`, data.role);
    }
  } catch (err) {
    console.error("Unexpected error fetching profile:", err);
  }
}, []);


  useEffect(() => {
  let mounted = true;

  const initAuth = async () => {
    console.log("🔐 [Auth] initAuth");

    const { data } = await supabase.auth.getSession();
    if (!mounted) return;

    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
      fetchProfile(data.session.user.id); // async tapi ga ganggu loading
    } else {
      setSession(null);
      setUser(null);
      setProfile(null);
      setRole(null);
    }

    setIsLoading(false); // ✅ SATU-SATUNYA DI SINI
  };

  initAuth();

  const { data: { subscription } } =
    supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;

      console.log("🔁 [Auth] Event:", event);

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        fetchProfile(currentSession.user.id);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setRole(null);
      }

      setIsLoading(false); // ✅ BOLEH
    });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);

  const signOut = async () => {
    console.log('👋 [AUTH] SIGN OUT: Starting cleanup...');
    setIsLoading(true);
    
    // 1. Clear local first (Sync)
    localStorage.clear();
    setSession(null);
    setUser(null);
    setRole(null);
    setProfile(null);

    try {
      // 2. Clear remote (Async) - don't wait too long
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject('TIMEOUT'), 2000))
      ]);
      console.log('✅ [AUTH] Remote sign out successful');
    } catch (err) {
      console.warn('⚠️ [AUTH] Remote sign out failed or timed out, but local session is cleared');
    } finally {
      setIsLoading(false);
      console.log('🚀 [AUTH] Redirecting to home...');
      window.location.href = '/'; 
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, role, profile, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

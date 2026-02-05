import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: { email: string; id: string } | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<boolean>;
  isEncarregado: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEncarregado, setIsEncarregado] = useState(false);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionChange(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSessionChange(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSessionChange = async (session: Session | null) => {
    try {
      if (session?.user) {
        // Try to check if user is admin
        const { data: adminData, error } = await supabase
          .from('usuarios_admin')
          .select('*')
          .eq('email', session.user.email)
          .maybeSingle();

        if (error) {
          console.error('Error checking admin status:', error);
          // Continue anyway, just not as admin
        }

        setUser({
          email: session.user.email || '',
          id: session.user.id,
        });
        setIsEncarregado(!!adminData && !error);
      } else {
        setUser(null);
        setIsEncarregado(false);
      }
    } catch (error) {
      console.error('Session error:', error);
      setUser(null);
      setIsEncarregado(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe = false): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (error || !data.user) {
        console.error('Login error:', error);
        setIsLoading(false);
        return false;
      }

      // Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('usuarios_admin')
        .select('*')
        .eq('email', data.user.email)
        .maybeSingle();

      if (adminError) {
        console.error('Error checking admin:', adminError);
      }

      setUser({
        email: data.user.email || '',
        id: data.user.id,
      });
      setIsEncarregado(!!adminData && !adminError);
      
      // Store rememberMe preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('rememberMe');
    setUser(null);
    setIsEncarregado(false);
  };

  const changePassword = async (newPassword: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Password change error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Password change error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, changePassword, isEncarregado }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

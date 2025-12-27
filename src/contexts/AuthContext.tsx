import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User, UserRole } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, role: UserRole) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If table doesn't exist (404), log helpful message
        if (error.code === 'PGRST116' || error.message?.includes('404')) {
          console.error(
            'Users table not found. Please run SUPABASE_AUTH_SCHEMA.sql in your Supabase SQL Editor.'
          );
        } else {
          console.error('Error fetching user profile:', error);
        }
        return null;
      }
      return data as User;
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (currentSession?.user) {
      setSupabaseUser(currentSession.user);
      setSession(currentSession);
      
      const userProfile = await fetchUserProfile(currentSession.user.id);
      
      // Check email confirmation (except for admin)
      if (userProfile && !userProfile.email_confirmed && userProfile.role !== 'admin') {
        // Don't set user if email not confirmed (non-admin)
        setUser(null);
        setSupabaseUser(null);
        setSession(null);
        setLoading(false);
        return;
      }
      
      setUser(userProfile);
    } else {
      setUser(null);
      setSupabaseUser(null);
      setSession(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Initial session check
    refreshUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        setSession(session);
        
        const userProfile = await fetchUserProfile(session.user.id);
        setUser(userProfile);
      } else {
        setUser(null);
        setSupabaseUser(null);
        setSession(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        const userProfile = await fetchUserProfile(data.user.id);
        
        // Check email confirmation (admin is always allowed)
        if (userProfile && !userProfile.email_confirmed && userProfile.role !== 'admin') {
          return {
            error: {
              message: 'Your email has not been confirmed by an administrator. Please contact support.',
            },
          };
        }
        
        setUser(userProfile);
        setSupabaseUser(data.user);
        setSession(data.session);
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole
  ) => {
    try {
      // Sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role,
          },
        },
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        // The trigger should create the profile automatically
        // Wait for the trigger to complete and then fetch the profile
        // Retry a few times in case the trigger takes a moment
        let userProfile: User | null = null;
        let retries = 0;
        const maxRetries = 5;
        
        while (!userProfile && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500));
          userProfile = await fetchUserProfile(data.user.id);
          retries++;
        }

        if (userProfile) {
          setUser(userProfile);
          setSupabaseUser(data.user);
          if (data.session) {
            setSession(data.session);
          }
        } else {
          // If profile still doesn't exist, the trigger might have failed
          // This shouldn't happen if the trigger is set up correctly
          console.warn('User profile not found after signup. Trigger may have failed.');
          // Still set the auth user so they can at least be logged in
          setSupabaseUser(data.user);
          if (data.session) {
            setSession(data.session);
          }
        }
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
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


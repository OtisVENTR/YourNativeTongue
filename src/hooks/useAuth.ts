/**
 * useAuth Hook
 * 
 * Provides authentication state and methods for the application.
 * Handles user session management, sign in, sign up, and sign out.
 * Also manages organization membership data.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Organization, UserRole } from '../types';

interface AuthState {
  user: User | null;
  session: Session | null;
  organization: Organization | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
}

interface AuthMethods {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshOrganization: () => Promise<void>;
}

export function useAuth(): AuthState & AuthMethods {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserOrg = async (userId: string) => {
    console.log('fetchUserOrg called for user:', userId);
    try {
      // Get user's organization membership
      // Use maybeSingle() instead of single() to avoid errors when user has no org
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, role, organizations(*)')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('fetchUserOrg result:', { membership, membershipError });

      if (membershipError) {
        console.error('Error fetching organization membership:', membershipError);
        setOrganization(null);
        setRole(null);
        return;
      }

      if (membership && membership.organizations) {
        console.log('Setting organization:', membership.organizations);
        setOrganization(membership.organizations as Organization);
        setRole(membership.role as UserRole);
      } else {
        console.log('No organization found for user');
        setOrganization(null);
        setRole(null);
      }
    } catch (err) {
      console.error('Error in fetchUserOrg:', err);
      setOrganization(null);
      setRole(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserOrg(session.user.id);
      } else {
        setOrganization(null);
        setRole(null);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      // Immediately update user state
      setSession(session);
      const newUser = session?.user ?? null;
      setUser(newUser);
      
      // Fetch org data in background, but don't block loading state
      if (newUser) {
        fetchUserOrg(newUser.id).finally(() => {
          console.log('Setting loading to false after fetchUserOrg completes');
          setLoading(false);
        });
      } else {
        setOrganization(null);
        setRole(null);
        setLoading(false);
      }
      
      setError(null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        return { error };
      }
      
      // The onAuthStateChange listener will handle fetching org data and setting loading to false
      // No need to do it here - just return success
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign in failed');
      setError(error.message);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        return { error };
      }
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign up failed');
      setError(error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
        return { error };
      }
      setUser(null);
      setSession(null);
      setOrganization(null);
      setRole(null);
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign out failed');
      setError(error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const refreshOrganization = async () => {
    // Get the current user to avoid closure issues
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      await fetchUserOrg(currentUser.id);
    }
  };

  return {
    user,
    session,
    organization,
    role,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refreshOrganization,
  };
}


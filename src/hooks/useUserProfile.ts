/**
 * useUserProfile Hook
 * 
 * Provides functionality to fetch and update user profile data from the users table.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/database.types';

type UserProfile = Tables<'users'>;

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: { full_name?: string | null; organization?: string | null }) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

export function useUserProfile(userId: string | undefined): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        // If user record doesn't exist, create it
        if (fetchError.code === 'PGRST116') {
          // Get user email from auth
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          if (authUser?.email) {
            // Create user record
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: authUser.email,
                plan_type: 'free',
                minutes_included: 0,
                minutes_used_current_period: 0,
              })
              .select()
              .single();

            if (createError) {
              throw createError;
            }

            setProfile(newUser);
            return;
          }
        }
        throw fetchError;
      }

      setProfile(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const updateProfile = async (updates: { full_name?: string | null; organization?: string | null }) => {
    if (!userId) {
      return { error: new Error('User not authenticated') };
    }

    try {
      setError(null);
      const { data, error: updateError } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setProfile(data);
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update profile');
      setError(error.message);
      return { error };
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile: fetchProfile,
  };
}


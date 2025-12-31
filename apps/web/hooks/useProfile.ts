/**
 * useProfile - Hook para carregar profile do usuário
 */

'use client';

import { useEffect, useState } from 'react';
import { getRepositories } from '@/lib/repositories';
import { Profile } from '@/types/database';

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        setIsLoading(true);
        setError(null);
        const repositories = getRepositories();
        // userId é garantidamente string aqui (após guard)
        const userProfile = await repositories.profile.getProfile(userId as string);
        
        if (!cancelled) {
          setProfile(userProfile);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Erro desconhecido'));
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { profile, isLoading, error };
}





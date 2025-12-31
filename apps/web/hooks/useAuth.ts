/**
 * useAuth - Hook de compatibilidade
 * 
 * Wrapper sobre AuthSessionContext para manter compatibilidade
 * com código que ainda usa o hook antigo.
 * 
 * @deprecated Migrar para usar useAuthSession diretamente
 */

'use client';

import { useAuthSession } from '@/contexts/AuthSessionContext';
import { useProfile } from '@/contexts/ProfileContext';
import { getRepositories } from '@/lib/repositories';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useAuth() {
  const { session, user, sessionLoading } = useAuthSession();
  const { profile, isLoading: profileLoading } = useProfile();
  const router = useRouter();

  const signIn = useCallback(async (email: string, password: string) => {
    const repositories = getRepositories();
    await repositories.auth.signIn(email, password);
    // onAuthStateChange vai atualizar o estado automaticamente
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const repositories = getRepositories();
    await repositories.auth.signUp(email, password, {
      full_name: fullName,
    });
    // onAuthStateChange vai atualizar o estado automaticamente
  }, []);

  const signOut = useCallback(async () => {
    const repositories = getRepositories();
    await repositories.auth.signOut();
    router.push('/login');
    router.refresh();
  }, [router]);

  const resetPassword = useCallback(async (email: string) => {
    // TODO: Implementar reset password quando necessário
    throw new Error('Reset password não implementado');
  }, []);

  const refreshProfile = useCallback(async () => {
    // Profile é atualizado automaticamente via useProfile
    // Esta função existe apenas para compatibilidade
  }, []);

  return {
    user,
    profile,
    loading: sessionLoading || profileLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile,
  };
}

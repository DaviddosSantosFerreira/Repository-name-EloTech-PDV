'use client';

/**
 * PROFILE CONTEXT - Gerenciamento de Profile
 * 
 * REFATORAÇÃO FASE 2 - TAREFA 1: Separação de Contextos
 * 
 * Responsabilidades:
 * 1. Gerenciar estado de profile
 * 2. Carregar profile do usuário autenticado
 * 3. Expor profile para componentes filhos
 * 
 * DEPENDÊNCIA: ⬇️ Depende de AuthSessionContext (user.id)
 * 
 * REGRAS CRÍTICAS:
 * - Consome AuthSessionContext
 * - Profile carregado automaticamente quando user muda
 * - Profile pode ser null (usuário sem profile ainda)
 */

import { createContext, useContext } from 'react';
import { useAuthSession } from './AuthSessionContext';
import { useProfile as useProfileHook } from '@/hooks/useProfile';
import { Profile } from '@/types/database';

interface ProfileContextType {
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthSession();
  const { profile, isLoading, error } = useProfileHook(user?.id || null);

  return (
    <ProfileContext.Provider value={{ profile, isLoading, error }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile deve ser usado dentro de um ProfileProvider');
  }
  return context;
}

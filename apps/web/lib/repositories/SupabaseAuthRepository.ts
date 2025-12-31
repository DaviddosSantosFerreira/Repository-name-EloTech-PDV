/**
 * SUPABASE AUTH REPOSITORY - Implementação Supabase de AuthRepository
 * 
 * REFATORAÇÃO FASE 3 - TAREFA 1: Repository Pattern
 * 
 * Implementação concreta do AuthRepository usando Supabase.
 * Usa factory function (não classe) para compatibilidade.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { AuthRepository } from './AuthRepository';

/**
 * Factory function: Cria implementação de AuthRepository
 */
export function createSupabaseAuthRepository(
  supabase: SupabaseClient<Database>
): AuthRepository {
  return {
    async getSession(): Promise<Session | null> {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }
      return session;
    },

    async signIn(email: string, password: string): Promise<User> {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Usuário não retornado após login');
      }

      return data.user;
    },

    async signUp(
      email: string,
      password: string,
      metadata?: Record<string, any>
    ): Promise<User> {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Usuário não retornado após registro');
      }

      return data.user;
    },

    async signOut(): Promise<void> {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    },

    onAuthStateChange(
      callback: (event: AuthChangeEvent, session: Session | null) => void
    ): () => void {
      const { data } = supabase.auth.onAuthStateChange(callback);
      return () => {
        data.subscription.unsubscribe();
      };
    },
  };
}

/**
 * Alias para compatibilidade (se algum código ainda usar como classe)
 * @deprecated Use createSupabaseAuthRepository() diretamente
 */
export const SupabaseAuthRepository = createSupabaseAuthRepository;

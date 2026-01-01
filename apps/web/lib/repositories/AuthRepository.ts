/**
 * AUTH REPOSITORY - Interface de Repositório de Autenticação
 * 
 * REFATORAÇÃO FASE 3 - TAREFA 1: Repository Pattern
 * 
 * Define contrato para operações de autenticação.
 * Implementações concretas: SupabaseAuthRepository
 */

import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface AuthRepository {
  /**
   * Obter sessão atual
   */
  getSession(): Promise<Session | null>;

  /**
   * Fazer login
   */
  signIn(email: string, password: string): Promise<User>;

  /**
   * Criar conta
   */
  signUp(email: string, password: string, metadata?: Record<string, any>): Promise<User>;

  /**
   * Fazer logout
   */
  signOut(): Promise<void>;

  /**
   * Escutar mudanças de autenticação
   * @returns Função para cancelar subscription
   */
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ): () => void;
}











/**
 * PROFILE REPOSITORY - Interface de Repositório de Profile
 * 
 * REFATORAÇÃO FASE 3 - TAREFA 1: Repository Pattern
 * 
 * Define contrato para operações de profile.
 * Implementações concretas: SupabaseProfileRepository
 */

import { Profile } from '@/types/database';

export type InsertProfile = {
  id: string;
  email: string;
  full_name?: string | null;
  role?: 'admin' | 'gerente' | 'vendedor';
  active?: boolean;
};

export interface ProfileRepository {
  /**
   * Obter profile por ID de usuário
   */
  getProfile(userId: string): Promise<Profile | null>;

  /**
   * Atualizar profile
   */
  updateProfile(userId: string, data: Partial<Profile>): Promise<Profile>;

  /**
   * Criar profile
   */
  createProfile(data: InsertProfile): Promise<Profile>;
}











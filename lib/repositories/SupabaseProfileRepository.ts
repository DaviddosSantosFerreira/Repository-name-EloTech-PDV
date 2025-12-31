/**
 * SUPABASE PROFILE REPOSITORY - Implementação Supabase de ProfileRepository
 * 
 * REFATORAÇÃO FASE 3 - TAREFA 1: Repository Pattern
 * 
 * Implementação concreta do ProfileRepository usando Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { Profile } from '@/types/database';
import { ProfileRepository, InsertProfile } from './ProfileRepository';

type InsertProfileType = Database['public']['Tables']['profiles']['Insert'];
type UpdateProfileType = Database['public']['Tables']['profiles']['Update'];

export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Se não encontrado, retornar null (não é erro crítico)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  async updateProfile(userId: string, data: Partial<Profile>): Promise<Profile> {
    const { data: updatedProfile, error } = await this.supabase
      .from('profiles')
      // @ts-expect-error - Supabase type inference issue with Database types
      .update(data as any)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!updatedProfile) {
      throw new Error('Profile não encontrado após atualização');
    }

    return updatedProfile;
  }

  async createProfile(data: InsertProfile): Promise<Profile> {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .insert(data as any)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!profile) {
      throw new Error('Profile não retornado após criação');
    }

    return profile;
  }
}








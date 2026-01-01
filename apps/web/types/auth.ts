// types/auth.ts
// Tipos relacionados à autenticação e perfis de usuário

import type { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'vendedor' | 'gerente'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  active: boolean
  created_at: string
  updated_at: string
}

// User agora vem exclusivamente de @supabase/supabase-js
// Re-exportar para facilitar imports
export type { User };

export interface AuthSession {
  user: User
  profile?: Profile
}

export interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
}





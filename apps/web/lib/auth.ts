// lib/auth.ts
// Funções de autenticação usando Supabase Auth
import { getBrowserClient } from './supabase/client'
import type { Profile } from '@/types/auth'

/**
 * Fazer login com email e senha
 */
export async function signIn(email: string, password: string) {
  try {
    const supabase = getBrowserClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { data: null, error }
    }

    // Buscar profile do usuário
    const profile = await getProfile(data.user.id)
    
    return { data: { user: data.user, profile }, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Registrar novo usuário
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string
) {
  try {
    const supabase = getBrowserClient()
    
    // Criar usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      return { data: null, error }
    }

    // O profile será criado automaticamente pelo trigger no banco
    // Mas precisamos aguardar um pouco para garantir
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const profile = data.user ? await getProfile(data.user.id) : null
    
    return { data: { user: data.user, profile }, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Fazer logout
 */
export async function signOut() {
  try {
    const supabase = getBrowserClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Erro ao fazer logout:', error)
    throw error
  }
}

/**
 * Recuperar senha (enviar email de reset)
 */
export async function resetPassword(email: string) {
  try {
    const supabase = getBrowserClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      return { error }
    }

    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

/**
 * Buscar profile do usuário
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const supabase = getBrowserClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return data as Profile
  } catch (error) {
    console.error('Erro ao buscar profile:', error)
    return null
  }
}

/**
 * Buscar usuário atual da sessão
 */
export async function getCurrentUser() {
  try {
    const supabase = getBrowserClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { user: null, profile: null }
    }

    const profile = await getProfile(user.id)

    return { user, profile }
  } catch (error) {
    console.error('Erro ao buscar usuário atual:', error)
    return { user: null, profile: null }
  }
}

/**
 * Verificar se há sessão ativa
 */
export async function getSession() {
  try {
    const supabase = getBrowserClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return null
    }

    return session
  } catch (error) {
    console.error('Erro ao verificar sessão:', error)
    return null
  }
}




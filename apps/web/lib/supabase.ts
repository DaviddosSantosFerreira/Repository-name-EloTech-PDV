// lib/supabase.ts
// Cliente Supabase para Server Components e Server Actions
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Buscar variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Criar cliente do Supabase (singleton) apenas se as variáveis estiverem definidas
// Isso evita erros durante a importação do módulo
// IMPORTANTE: Este cliente é para uso em Server Components
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true, // Persistir sessão para autenticação
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

// Função auxiliar para verificar se o Supabase está configurado
export function isSupabaseConfigured(): boolean {
  return !!supabase
}

// Testar conexão
export async function testConnection() {
  try {
    if (!supabase) {
      console.error('❌ Supabase não está configurado')
      return false
    }

    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1)
    
    if (error) throw error
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!')
    return true
  } catch (error) {
    console.error('❌ Erro ao conectar com Supabase:', error)
    return false
  }
}
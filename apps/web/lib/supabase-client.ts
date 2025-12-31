import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

export function createClient() {
  // No client-side, process.env.NEXT_PUBLIC_* está disponível diretamente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variáveis de ambiente do Supabase não configuradas!');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ configurado' : '❌ faltando');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ configurado' : '❌ faltando');
    throw new Error('Variáveis de ambiente do Supabase não configuradas');
  }

  // Verificar se não são valores placeholder
  if (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
    console.error('❌ Variáveis de ambiente do Supabase contêm valores placeholder!');
    throw new Error('Variáveis de ambiente do Supabase contêm valores placeholder');
  }

  try {
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Erro ao criar cliente Supabase:', error);
    throw error;
  }
}

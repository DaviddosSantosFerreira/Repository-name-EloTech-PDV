import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

/**
 * Cria um cliente Supabase para uso no browser (Client Components)
 * 
 * IMPORTANTE: Este cliente deve ser usado apenas em Client Components.
 * Para Server Components, use lib/supabase/server.ts
 */
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Variáveis de ambiente do Supabase não configuradas. ' +
      'Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  if (supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
    throw new Error('Variáveis de ambiente do Supabase contêm valores placeholder');
  }

  return createSupabaseBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}


'use client';

/**
 * CLIENT SUPABASE - Apenas para Browser (Client Components)
 * 
 * CORREÇÃO CRÍTICA: Separado de server para evitar erro de next/headers
 * 
 * IMPORTANTE:
 * - Use APENAS em Client Components ('use client')
 * - Para Server Components, use lib/supabase/server.ts
 * - NUNCA importe next/headers aqui
 */

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

// Singleton para browser
let browserClient: SupabaseClient<Database> | null = null;

/**
 * Valida variáveis de ambiente do Supabase
 */
function validateEnv(): { url: string; key: string } {
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

  return { url: supabaseUrl, key: supabaseAnonKey };
}

/**
 * Factory: Cria ou retorna instância única do cliente BROWSER
 * 
 * IMPORTANTE: Use apenas em Client Components
 * Singleton pattern para garantir uma única instância no browser
 */
export function getBrowserClient(): SupabaseClient<Database> {
  // Se já existe, retornar
  if (browserClient) {
    return browserClient;
  }

  // Criar nova instância
  const { url, key } = validateEnv();
  browserClient = createBrowserClient<Database>(url, key);
  
  return browserClient;
}

/**
 * Função de compatibilidade: createClient()
 * 
 * Alias para getBrowserClient() para manter compatibilidade
 */
export function createClient(): SupabaseClient<Database> {
  return getBrowserClient();
}

/**
 * Cleanup: Limpa instância do cliente browser
 * 
 * IMPORTANTE: Chamar em unmount ou quando necessário
 */
export function cleanupClient(): void {
  browserClient = null;
}

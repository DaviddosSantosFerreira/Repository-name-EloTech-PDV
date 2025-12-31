/**
 * SERVER SUPABASE - Apenas para Server Components e Server Actions
 * 
 * CORREÇÃO CRÍTICA: Separado de client para evitar erro de next/headers
 * 
 * IMPORTANTE:
 * - Use APENAS em Server Components e Server Actions
 * - Para Client Components, use lib/supabase/client.ts
 * - NUNCA importe este arquivo em componentes com 'use client'
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

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
 * Factory: Cria cliente SERVER isolado por requisição
 * 
 * IMPORTANTE: Use apenas em Server Components e Server Actions
 * Cada requisição tem sua própria instância com cookies isolados
 */
export async function getServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  const { url, key } = validateEnv();

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Cookie pode não ser setado em Server Components
            // Não é erro crítico
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Cookie pode não ser removido em Server Components
            // Não é erro crítico
          }
        },
      },
    }
  );
}

/**
 * Função de compatibilidade: createClient()
 * 
 * Alias para getServerClient() para manter compatibilidade
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  return getServerClient();
}

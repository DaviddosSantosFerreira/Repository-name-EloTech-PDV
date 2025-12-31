/**
 * REPOSITORIES FACTORY - Factory de Repositórios
 * 
 * REFATORAÇÃO FASE 3 - TAREFA 1: Repository Pattern
 * 
 * Factory para criar instâncias de repositórios.
 * Centraliza a criação e injeção de dependências.
 */

import { getBrowserClient } from '@/lib/supabase/client';
import { createSupabaseAuthRepository } from './SupabaseAuthRepository';
import { SupabaseProfileRepository } from './SupabaseProfileRepository';
import { SupabaseProductRepository } from './SupabaseProductRepository';
import { SupabaseSaleRepository } from './SupabaseSaleRepository';
import { CachedProductRepository } from './cached/ProductRepositoryCache';
import type { AuthRepository } from './AuthRepository';
import type { ProfileRepository } from './ProfileRepository';
import type { ProductRepository } from './ProductRepository';
import type { SaleRepository } from './SaleRepository';

export interface Repositories {
  auth: AuthRepository;
  profile: ProfileRepository;
  product: ProductRepository;
  sale: SaleRepository;
}

/**
 * Factory: Cria instâncias de repositórios
 * 
 * IMPORTANTE: Em ambiente browser, usa getBrowserClient().
 * Em ambiente server, deve usar getServerClient().
 */
export function createRepositories(): Repositories {
  const supabase = getBrowserClient();

  // Criar repositórios base
  const baseProductRepo = new SupabaseProductRepository(supabase);

  return {
    auth: createSupabaseAuthRepository(supabase),
    profile: new SupabaseProfileRepository(supabase),
    // ProductRepository com cache
    product: new CachedProductRepository(baseProductRepo),
    sale: new SupabaseSaleRepository(supabase),
  };
}

/**
 * Singleton de repositórios (para uso em Client Components)
 * 
 * IMPORTANTE: Criar uma instância por requisição/componente.
 * Não compartilhar entre diferentes usuários.
 */
let repositoriesInstance: Repositories | null = null;

export function getRepositories(): Repositories {
  if (!repositoriesInstance) {
    repositoriesInstance = createRepositories();
  }
  return repositoriesInstance;
}

/**
 * Resetar instância (útil para testes ou cleanup)
 */
export function resetRepositories(): void {
  repositoriesInstance = null;
}


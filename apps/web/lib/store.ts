/**
 * STORE - Compatibilidade com código legado
 * 
 * ⚠️ LEGADO: Este arquivo será migrado para React Query
 * 
 * Wrapper síncrono sobre os repositórios assíncronos
 * Mantém cache local para permitir acesso síncrono
 * 
 * IMPORTANTE: Não cria repositórios automaticamente.
 * Não executa setInterval no client.
 * Cache deve ser atualizado manualmente pelos componentes.
 */

import type { Product, Sale } from '@/types/database';

// Cache local (inicialmente vazio)
let productsCache: Product[] = [];
let salesCache: Sale[] = [];
let lastProductsUpdate = 0;
let lastSalesUpdate = 0;
const CACHE_TTL = 30000; // 30 segundos

/**
 * Atualizar cache de produtos
 * Deve ser chamado pelos componentes que precisam dos dados
 */
export async function refreshProductsCache() {
  // Lazy import para evitar criar repositórios no módulo
  const { getRepositories } = await import('./repositories');
  try {
    const repositories = getRepositories();
    productsCache = await repositories.product.getProducts(true);
    lastProductsUpdate = Date.now();
  } catch (error) {
    console.error('Erro ao atualizar cache de produtos:', error);
  }
}

/**
 * Atualizar cache de vendas
 * Deve ser chamado pelos componentes que precisam dos dados
 */
export async function refreshSalesCache() {
  // Lazy import para evitar criar repositórios no módulo
  const { getRepositories } = await import('./repositories');
  try {
    const repositories = getRepositories();
    salesCache = await repositories.sale.getSales(1000);
    lastSalesUpdate = Date.now();
  } catch (error) {
    console.error('Erro ao atualizar cache de vendas:', error);
  }
}

/**
 * Product Store - Interface síncrona
 */
export const productStore = {
  getAll(): Product[] {
    // Retornar cache atual (pode estar desatualizado)
    return productsCache;
  },

  async refresh(): Promise<void> {
    await refreshProductsCache();
  },

  getById(id: string): Product | undefined {
    return productsCache.find(p => p.id === id);
  },

  getByCode(code: string): Product | undefined {
    return productsCache.find(p => p.code === code);
  },
};

/**
 * Sale Store - Interface síncrona
 */
export const saleStore = {
  getAll(): Sale[] {
    return salesCache;
  },

  async refresh(): Promise<void> {
    await refreshSalesCache();
  },

  getToday(): Sale[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return salesCache.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= today;
    });
  },

  getById(id: string): Sale | undefined {
    return salesCache.find(s => s.id === id);
  },
};

/**
 * Função para atualizar caches periodicamente
 * Deve ser chamada pelos componentes, não executada automaticamente
 */
export async function refreshStores() {
  await Promise.all([
    refreshProductsCache(),
    refreshSalesCache(),
  ]);
}


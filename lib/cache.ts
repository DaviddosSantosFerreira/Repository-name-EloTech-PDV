/**
 * CACHE - Sistema de Cache de Queries
 * 
 * REFATORAÇÃO FASE 3 - TAREFA 3: Otimizações de Performance
 * 
 * Cache simples em memória para queries frequentes.
 * TTL (Time To Live) configurável por query.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const queryCache = new Map<string, CacheEntry<any>>();

/**
 * Cachear resultado de query
 * 
 * @param key - Chave única para a query
 * @param fetcher - Função que retorna os dados
 * @param ttl - Tempo de vida em milissegundos (padrão: 1 minuto)
 * @returns Dados cacheados ou resultado da query
 */
export async function cacheQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60000 // 1 minuto
): Promise<T> {
  const cached = queryCache.get(key);
  
  // Verificar se cache é válido
  if (cached && Date.now() - cached.timestamp < ttl) {
    return Promise.resolve(cached.data);
  }

  // Buscar dados e cachear
  try {
    const data = await fetcher();
    queryCache.set(key, {
      data,
      timestamp: Date.now(),
    });
    return data;
  } catch (error) {
    // Se erro, retornar cache antigo se disponível (stale-while-revalidate)
    if (cached) {
      console.warn(`Erro ao buscar dados para ${key}, usando cache antigo:`, error);
      return cached.data;
    }
    throw error;
  }
}

/**
 * Invalidar cache por chave
 */
export function invalidateCache(key: string): void {
  queryCache.delete(key);
}

/**
 * Invalidar cache por padrão (regex)
 */
export function invalidateCachePattern(pattern: RegExp): void {
  for (const key of queryCache.keys()) {
    if (pattern.test(key)) {
      queryCache.delete(key);
    }
  }
}

/**
 * Limpar todo o cache
 */
export function clearCache(): void {
  queryCache.clear();
}

/**
 * Obter estatísticas do cache
 */
export function getCacheStats() {
  return {
    size: queryCache.size,
    keys: Array.from(queryCache.keys()),
  };
}










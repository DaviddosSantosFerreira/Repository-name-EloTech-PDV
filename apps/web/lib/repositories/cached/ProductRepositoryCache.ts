/**
 * PRODUCT REPOSITORY CACHE - Cache para ProductRepository
 * 
 * REFATORAÇÃO FASE 3 - TAREFA 3: Otimizações de Performance
 * 
 * Wrapper que adiciona cache ao ProductRepository.
 */

import { ProductRepository, InsertProduct } from '../ProductRepository';
import { Product } from '@/types/database';
import { cacheQuery, invalidateCache, invalidateCachePattern } from '@/lib/cache';

export class CachedProductRepository implements ProductRepository {
  constructor(private repository: ProductRepository) {}

  async getProducts(activeOnly: boolean = true): Promise<Product[]> {
    const key = `products:${activeOnly ? 'active' : 'all'}`;
    return cacheQuery(
      key,
      () => this.repository.getProducts(activeOnly),
      60000 // 1 minuto
    );
  }

  async getProduct(id: string): Promise<Product | null> {
    const key = `product:${id}`;
    return cacheQuery(
      key,
      () => this.repository.getProduct(id),
      300000 // 5 minutos (produtos individuais mudam menos)
    );
  }

  async searchProducts(query: string): Promise<Product[]> {
    // Não cachear buscas (são muito variáveis)
    return this.repository.searchProducts(query);
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    const product = await this.repository.createProduct(data);
    // Invalidar cache de listas
    invalidateCachePattern(/^products:/);
    return product;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const product = await this.repository.updateProduct(id, data);
    // Invalidar cache do produto específico e listas
    invalidateCache(`product:${id}`);
    invalidateCachePattern(/^products:/);
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.repository.deleteProduct(id);
    // Invalidar cache do produto específico e listas
    invalidateCache(`product:${id}`);
    invalidateCachePattern(/^products:/);
  }
}











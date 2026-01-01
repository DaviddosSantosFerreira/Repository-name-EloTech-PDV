/**
 * PRODUCT REPOSITORY - Interface de Repositório de Produtos
 * 
 * REFATORAÇÃO FASE 3 - TAREFA 1: Repository Pattern
 * 
 * Define contrato para operações de produtos.
 * Implementações concretas: SupabaseProductRepository
 */

import { Product } from '@/types/database';

export type InsertProduct = {
  code: string;
  name: string;
  description?: string | null;
  price: number;
  stock?: number;
  min_stock?: number;
  category?: string | null;
  image_url?: string | null;
  active?: boolean;
};

export interface ProductRepository {
  /**
   * Obter todos os produtos
   * @param activeOnly - Se true, retorna apenas produtos ativos
   */
  getProducts(activeOnly?: boolean): Promise<Product[]>;

  /**
   * Obter produto por ID
   */
  getProduct(id: string): Promise<Product | null>;

  /**
   * Buscar produtos por nome ou código
   */
  searchProducts(query: string): Promise<Product[]>;

  /**
   * Criar produto
   */
  createProduct(data: InsertProduct): Promise<Product>;

  /**
   * Atualizar produto
   */
  updateProduct(id: string, data: Partial<Product>): Promise<Product>;

  /**
   * Deletar produto
   */
  deleteProduct(id: string): Promise<void>;
}











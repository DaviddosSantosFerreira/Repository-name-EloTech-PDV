/**
 * SALE REPOSITORY - Interface de Repositório de Vendas
 * 
 * REFATORAÇÃO FASE 3 - TAREFA 1: Repository Pattern
 * 
 * Define contrato para operações de vendas.
 * Implementações concretas: SupabaseSaleRepository
 */

import { Sale, SaleItem, SaleStatus } from '@/types/database';

export type InsertSale = {
  sale_number: string;
  total: number;
  payment_method: 'cash' | 'card' | 'pix';
  status?: SaleStatus;
  notes?: string | null;
  user_id?: string | null;
};

export type InsertSaleItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export interface SaleRepository {
  /**
   * Obter vendas
   * @param limit - Limite de resultados (padrão: 100)
   */
  getSales(limit?: number): Promise<Sale[]>;

  /**
   * Obter venda por ID (com itens)
   */
  getSale(id: string): Promise<Sale & { sale_items: SaleItem[] } | null>;

  /**
   * Criar venda com itens
   * @returns Venda criada com itens
   */
  createSale(data: InsertSale, items: InsertSaleItem[]): Promise<Sale & { sale_items: SaleItem[] }>;

  /**
   * Atualizar status da venda
   */
  updateSaleStatus(id: string, status: SaleStatus): Promise<Sale>;
}










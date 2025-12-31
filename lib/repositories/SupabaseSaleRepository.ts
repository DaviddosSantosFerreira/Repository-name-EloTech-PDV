/**
 * SUPABASE SALE REPOSITORY - Implementação Supabase de SaleRepository
 * 
 * REFATORAÇÃO FASE 3 - TAREFA 1: Repository Pattern
 * 
 * Implementação concreta do SaleRepository usando Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { Sale, SaleItem, SaleStatus } from '@/types/database';
import { SaleRepository, InsertSale, InsertSaleItem } from './SaleRepository';

type InsertSaleType = Database['public']['Tables']['sales']['Insert'];
type UpdateSaleType = Database['public']['Tables']['sales']['Update'];
type InsertSaleItemType = Database['public']['Tables']['sale_items']['Insert'];
type UpdateProductType = Database['public']['Tables']['products']['Update'];

export class SupabaseSaleRepository implements SaleRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getSales(limit: number = 100): Promise<Sale[]> {
    const { data, error } = await this.supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  }

  async getSale(id: string): Promise<(Sale & { sale_items: SaleItem[] }) | null> {
    const { data, error } = await this.supabase
      .from('sales')
      .select(`
        *,
        sale_items (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      // Se não encontrado, retornar null
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      ...(data as Sale),
      sale_items: ((data as any).sale_items || []) as SaleItem[],
    };
  }

  async createSale(
    data: InsertSale,
    items: InsertSaleItem[]
  ): Promise<Sale & { sale_items: SaleItem[] }> {
    // 1. Criar a venda
    const { data: saleData, error: saleError } = await this.supabase
      .from('sales')
      .insert(data as any)
      .select()
      .single();

    if (saleError) {
      throw saleError;
    }

    if (!saleData || !('id' in saleData)) {
      throw new Error('Falha ao criar venda');
    }

    const saleId = (saleData as any).id;

    // 2. Criar os itens da venda
    const itemsWithSaleId = items.map((item) => ({
      ...item,
      sale_id: saleId,
    }));

    const { data: itemsData, error: itemsError } = await this.supabase
      .from('sale_items')
      .insert(itemsWithSaleId as any)
      .select();

    if (itemsError) {
      throw itemsError;
    }

    // 3. Atualizar estoque dos produtos
    for (const item of items) {
      try {
        // Buscar produto atual
        const { data: product, error: productError } = await this.supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (productError || !product) {
          console.error('Erro ao buscar produto para atualizar estoque:', productError);
          continue;
        }

        // Atualizar estoque
        const productStock = (product as any).stock || 0;
        const newStock = Math.max(0, productStock - item.quantity);
        
        const { error: stockError } = await this.supabase
          .from('products')
          // @ts-expect-error - Supabase type inference issue with Database types
          .update({ stock: newStock } as any)
          .eq('id', item.product_id);

        if (stockError) {
          console.error('Erro ao atualizar estoque:', stockError);
          // Não lançar erro aqui para não bloquear a venda
        }
      } catch (error) {
        console.error('Erro ao atualizar estoque do produto:', error);
        // Continuar com outros produtos
      }
    }

    return {
      ...(saleData as any),
      sale_items: itemsData || [],
    };
  }

  async updateSaleStatus(id: string, status: SaleStatus): Promise<Sale> {
    const { data: sale, error } = await this.supabase
      .from('sales')
      // @ts-expect-error - Supabase type inference issue with Database types
      .update({ status } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!sale) {
      throw new Error('Venda não encontrada após atualização');
    }

    return sale;
  }
}








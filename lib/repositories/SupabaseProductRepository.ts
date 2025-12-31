/**
 * SUPABASE PRODUCT REPOSITORY - Implementação Supabase de ProductRepository
 * 
 * REFATORAÇÃO FASE 3 - TAREFA 1: Repository Pattern
 * 
 * Implementação concreta do ProductRepository usando Supabase.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { Product } from '@/types/database';
import { ProductRepository, InsertProduct } from './ProductRepository';

type ProductRow = Database['public']['Tables']['products']['Row'];
type InsertProductType = Database['public']['Tables']['products']['Insert'];
type UpdateProductType = Database['public']['Tables']['products']['Update'];

export class SupabaseProductRepository implements ProductRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getProducts(activeOnly: boolean = true): Promise<Product[]> {
    let query = this.supabase
      .from('products')
      .select('*')
      .order('name');

    if (activeOnly) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  }

  async getProduct(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Se não encontrado, retornar null
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
      .order('name');

    if (error) {
      throw error;
    }

    return data || [];
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    const { data: product, error } = await this.supabase
      .from('products')
      .insert({
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        stock: data.stock ?? 0,
        min_stock: data.min_stock ?? 0,
        category: data.category ?? null,
        image_url: data.image_url ?? null,
        active: data.active ?? true,
      } as any)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!product) {
      throw new Error('Produto não retornado após criação');
    }

    return product;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const { data: product, error } = await this.supabase
      .from('products')
      // @ts-expect-error - Supabase type inference issue with Database types
      .update(data as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!product) {
      throw new Error('Produto não encontrado após atualização');
    }

    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}




/**
 * SUPABASE STORE - Wrapper de Compatibilidade
 * 
 * REFATORAÇÃO FASE 3 - TAREFA 1: Repository Pattern
 * 
 * Este arquivo mantém compatibilidade com código existente,
 * mas agora usa os repositórios por baixo.
 * 
 * @deprecated Migrar para usar repositórios diretamente
 */

import { getRepositories } from './repositories';
import type { Product, Sale, SaleItem } from '@/types/database';
import type { InsertProduct, InsertSale, InsertSaleItem } from '@/types/db-types';

// ============================================
// FUNÇÕES PARA PRODUTOS (COMPATIBILIDADE)
// ============================================

export async function getProducts(activeOnly: boolean = true) {
  try {
    const repositories = getRepositories();
    const products = await repositories.product.getProducts(activeOnly);
    return { data: products, error: null };
  } catch (error: any) {
    console.error('Erro ao buscar produtos:', error);
    return { data: null, error };
  }
}

export async function getProductById(id: string) {
  try {
    const repositories = getRepositories();
    const product = await repositories.product.getProduct(id);
    return { data: product, error: null };
  } catch (error: any) {
    console.error('Erro ao buscar produto:', error);
    return { data: null, error };
  }
}

export async function createProduct(product: InsertProduct) {
  try {
    const repositories = getRepositories();
    const created = await repositories.product.createProduct(product);
    return { data: created, error: null };
  } catch (error: any) {
    console.error('Erro ao criar produto:', error);
    return { data: null, error };
  }
}

export async function updateProduct(id: string, product: Partial<Product>) {
  try {
    const repositories = getRepositories();
    const updated = await repositories.product.updateProduct(id, product);
    return { data: updated, error: null };
  } catch (error: any) {
    console.error('Erro ao atualizar produto:', error);
    return { data: null, error };
  }
}

export async function deleteProduct(id: string) {
  try {
    const repositories = getRepositories();
    await repositories.product.deleteProduct(id);
    return { error: null };
  } catch (error: any) {
    console.error('Erro ao deletar produto:', error);
    return { error };
  }
}

export async function searchProducts(searchTerm: string) {
  try {
    const repositories = getRepositories();
    const products = await repositories.product.searchProducts(searchTerm);
    return { data: products, error: null };
  } catch (error: any) {
    console.error('Erro ao buscar produtos:', error);
    return { data: null, error };
  }
}

// ============================================
// FUNÇÕES PARA VENDAS (COMPATIBILIDADE)
// ============================================

export async function getSales(limit: number = 100) {
  try {
    const repositories = getRepositories();
    const sales = await repositories.sale.getSales(limit);
    return { data: sales, error: null };
  } catch (error: any) {
    console.error('Erro ao buscar vendas:', error);
    return { data: null, error };
  }
}

export async function getSaleById(id: string) {
  try {
    const repositories = getRepositories();
    const sale = await repositories.sale.getSale(id);
    return { data: sale, error: null };
  } catch (error: any) {
    console.error('Erro ao buscar venda:', error);
    return { data: null, error };
  }
}

export async function createSale(sale: InsertSale, items: InsertSaleItem[]) {
  try {
    const repositories = getRepositories();
    const created = await repositories.sale.createSale(sale, items);
    return { data: created, error: null };
  } catch (error: any) {
    console.error('Erro ao criar venda:', error);
    return { data: null, error };
  }
}

// ============================================
// FUNÇÕES PARA DASHBOARD (COMPATIBILIDADE)
// ============================================

export async function getDashboardStats() {
  try {
    const repositories = getRepositories();
    const productRepo = repositories.product;
    const saleRepo = repositories.sale;

    // Total de vendas do dia
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allSales = await saleRepo.getSales(1000); // Buscar muitas vendas para calcular stats
    const todaySales = allSales.filter((sale: Sale) => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= today;
    });

    const totalSales = todaySales.reduce((sum: number, sale: Sale) => sum + Number(sale.total || 0), 0);
    const salesCount = todaySales.length;

    // Total de produtos
    const allProducts = await productRepo.getProducts(true);
    const productsCount = allProducts.length;

    // Produtos com estoque baixo
    const lowStockCount = allProducts.filter(
      (product: Product) => product.stock <= product.min_stock
    ).length;

    return {
      data: {
        totalSales,
        salesCount,
        productsCount,
        lowStockCount,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    return { data: null, error };
  }
}

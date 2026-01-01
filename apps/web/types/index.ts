/**
 * Types - Tipos compartilhados do sistema
 */

export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockProducts: number;
}

// Re-exportar tipos do database
export type {
  Product,
  Sale,
  SaleItem,
  Profile,
  Role,
  PaymentMethod,
  SaleStatus,
} from './database';









/**
 * Database Types - Exports de tipos Insert/Update do Database
 * 
 * Centraliza exports de tipos para uso em repositórios e store legado
 */

import { Database } from './database';

export type InsertProduct = Database['public']['Tables']['products']['Insert'];
export type InsertSale = Database['public']['Tables']['sales']['Insert'];
export type InsertSaleItem = Database['public']['Tables']['sale_items']['Insert'];
export type InsertProfile = Database['public']['Tables']['profiles']['Insert'];

export type UpdateProduct = Database['public']['Tables']['products']['Update'];
export type UpdateSale = Database['public']['Tables']['sales']['Update'];
export type UpdateSaleItem = Database['public']['Tables']['sale_items']['Update'];
export type UpdateProfile = Database['public']['Tables']['profiles']['Update'];




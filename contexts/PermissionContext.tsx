'use client';

/**
 * PERMISSION CONTEXT - LÓGICA DE PERMISSÕES
 * 
 * REFATORAÇÃO FASE 2 - TAREFA 1: Separação de Contextos
 * 
 * Responsabilidades:
 * 1. Lógica de permissões
 * 2. isAdmin, isGerente, isVendedor
 * 3. hasPermission(permission)
 * 
 * DEPENDÊNCIA: ⬇️ Depende de ProfileContext (profile.role)
 * 
 * REGRAS CRÍTICAS:
 * - Consome ProfileContext
 * - Lógica de permissões isolada
 * - Extensível para RBAC futuro
 */

import { createContext, useContext, useMemo, useCallback } from 'react';
import { useProfile } from './ProfileContext';

interface PermissionContextType {
  isAdmin: boolean;
  isGerente: boolean;
  isVendedor: boolean;
  hasPermission: (permission: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

/**
 * Mapa de permissões por role
 * 
 * FUTURO: Pode ser expandido para RBAC completo
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'products:create',
    'products:read',
    'products:update',
    'products:delete',
    'sales:create',
    'sales:read',
    'sales:update',
    'sales:delete',
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'reports:read',
  ],
  gerente: [
    'products:create',
    'products:read',
    'products:update',
    'sales:create',
    'sales:read',
    'users:read',
    'reports:read',
  ],
  vendedor: [
    'products:read',
    'sales:create',
    'sales:read',
  ],
};

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile();

  const role = profile?.role || null;

  // Helpers de role
  const isAdmin = role === 'admin';
  const isGerente = role === 'gerente';
  const isVendedor = role === 'vendedor';

  /**
   * Verificar se usuário tem permissão específica
   * 
   * FUTURO: Pode ser expandido para verificar permissões granulares
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!role) {
      return false;
    }

    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  }, [role]);

  const value = useMemo(() => ({
    isAdmin,
    isGerente,
    isVendedor,
    hasPermission,
  }), [isAdmin, isGerente, isVendedor, hasPermission]);

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermission() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermission deve ser usado dentro de um PermissionProvider');
  }
  return context;
}


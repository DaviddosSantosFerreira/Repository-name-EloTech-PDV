'use client';

/**
 * PAGE ERROR BOUNDARY - Wrapper para páginas
 * 
 * REFATORAÇÃO FASE 2 - TAREFA 2: Error Boundaries
 * 
 * Wrapper simplificado para adicionar ErrorBoundary em páginas
 */

import { ErrorBoundary } from './ErrorBoundary';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
}

export function PageErrorBoundary({ children }: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}











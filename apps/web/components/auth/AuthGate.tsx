'use client';

/**
 * AUTH GATE - APENAS LOADING STATE
 * 
 * REFATORAÇÃO FASE 2 - Atualizado para novos contextos
 * 
 * Responsabilidades:
 * 1. Mostrar loading durante verificação inicial (sessionLoading === true)
 * 2. Renderizar children quando pronto
 * 
 * REGRAS CRÍTICAS:
 * - NÃO redireciona (middleware faz isso)
 * - NÃO decide navegação
 * - Apenas gerencia UI de loading
 */

import { useAuthSession } from '@/contexts/AuthSessionContext';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { sessionLoading } = useAuthSession();

  /**
   * Loading durante verificação inicial
   * 
   * Renderiza APENAS enquanto sessionLoading === true.
   * Após sessionLoading === false, nunca mais renderiza este estado.
   */
  if (sessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Inicializando sessão...</p>
        </div>
      </div>
    );
  }

  /**
   * Renderizar children quando verificação concluída
   * 
   * Middleware já garantiu que usuário tem acesso à rota.
   */
  return <>{children}</>;
}

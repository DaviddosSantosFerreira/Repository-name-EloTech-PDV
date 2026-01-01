'use client';

/**
 * ERROR FALLBACK - UI de Erro Amigável
 * 
 * REFATORAÇÃO FASE 2 - TAREFA 2: Error Boundaries
 * 
 * Responsabilidades:
 * 1. Exibir UI amigável de erro
 * 2. Botão "Tentar Novamente"
 * 3. Não mostrar stack trace para usuário final
 */

import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  showDetails?: boolean;
}

export function ErrorFallback({ error, resetError, showDetails = false }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Algo deu errado</h1>
          <p className="text-muted-foreground">
            Ocorreu um erro inesperado. Por favor, tente novamente.
          </p>
        </div>

        {(isDevelopment || showDetails) && (
          <div className="rounded-md bg-muted p-4 text-left">
            <p className="text-sm font-mono text-destructive">
              {error.message || 'Erro desconhecido'}
            </p>
            {isDevelopment && error.stack && (
              <details className="mt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Stack trace
                </summary>
                <pre className="mt-2 text-xs overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={resetError} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Voltar ao Início
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Se o problema persistir, entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
}











'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const publicRoutes = ['/login', '/register'];

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirectedRef = useRef(false);
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // Aguardar verificação inicial
    if (authLoading) {
      return;
    }

    // Evitar múltiplos redirecionamentos
    if (hasRedirectedRef.current) {
      return;
    }

    // Rota protegida sem usuário
    if (requireAuth && !isPublicRoute && !user) {
      hasRedirectedRef.current = true;
      router.replace('/login');
      return;
    }

    // Rota pública com usuário autenticado
    if (!requireAuth && isPublicRoute && user) {
      hasRedirectedRef.current = true;
      router.replace('/');
      return;
    }
  }, [user, authLoading, pathname, requireAuth, isPublicRoute, router]);

  // Resetar flag quando mudar de rota
  useEffect(() => {
    hasRedirectedRef.current = false;
  }, [pathname]);

  // Loading durante verificação inicial
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Não renderizar se redirecionamento está pendente
  if (requireAuth && !isPublicRoute && !user) {
    return null;
  }

  if (!requireAuth && isPublicRoute && user) {
    return null;
  }

  return <>{children}</>;
}

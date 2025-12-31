'use client';

/**
 * AUTH SESSION CONTEXT - Gerenciamento de Sessão de Autenticação
 * 
 * CORREÇÃO: updateSession idempotente para evitar AUTH_SUCCESS duplicado
 * 
 * Responsabilidades:
 * 1. Gerenciar estado de sessão (session, sessionLoading)
 * 2. Escutar mudanças de autenticação via onAuthStateChange
 * 3. Expor updateSession para atualização manual
 * 4. Garantir que AUTH_SUCCESS ocorre apenas uma vez por login
 * 
 * REGRAS CRÍTICAS:
 * - updateSession deve ser idempotente
 * - Se já estiver autenticado com o mesmo usuário, não despachar AUTH_SUCCESS novamente
 * - Não remover update manual após signIn
 * - Não remover onAuthStateChange
 * - Não alterar reducer (apenas evitar dispatch duplicado)
 */

import React, { createContext, useContext, useEffect, useReducer, useRef, useCallback, useMemo } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { getBrowserClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Estado da sessão
 */
type SessionState =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'authenticated'; user: User; session: Session }
  | { type: 'unauthenticated' }
  | { type: 'error'; error: Error };

/**
 * Ações do reducer
 */
type SessionAction =
  | { type: 'SESSION_LOADING' }
  | { type: 'AUTH_SUCCESS'; user: User; session: Session }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_ERROR'; error: Error }
  | { type: 'INIT_COMPLETE' };

/**
 * Reducer: Gerencia transições de estado
 */
function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SESSION_LOADING':
      if (state.type === 'idle') {
        return { type: 'loading' };
      }
      return state;

    case 'AUTH_SUCCESS':
      // Transição para authenticated
      return {
        type: 'authenticated',
        user: action.user,
        session: action.session,
      };

    case 'AUTH_LOGOUT':
      // Transição para unauthenticated
      return { type: 'unauthenticated' };

    case 'AUTH_ERROR':
      // Transição para error
      return { type: 'error', error: action.error };

    case 'INIT_COMPLETE':
      // 🔥 GARANTIA ABSOLUTA: Nunca fica em loading
      // Se já está authenticated, mantém. Senão, vai para unauthenticated
      return state.type === 'authenticated'
        ? state
        : { type: 'unauthenticated' };

    default:
      return state;
  }
}

/**
 * Interface do contexto
 */
interface AuthSessionContextType {
  session: Session | null;
  user: User | null;
  sessionLoading: boolean;
  updateSession: (newSession: Session | null) => void;
}

const AuthSessionContext = createContext<AuthSessionContextType | undefined>(undefined);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, { type: 'idle' });
  
  // Ref para rastrear o ID do usuário atual (atualizada síncronamente)
  // Isso permite verificar se updateSession está sendo chamado para o mesmo usuário
  const currentUserIdRef = useRef<string | null>(null);
  
  // Refs para controle de ciclo de vida
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  
  // Ref para acessar o state atual sem causar re-renders
  const stateRef = useRef<SessionState>({ type: 'idle' });
  
  // Atualizar stateRef sempre que state mudar (síncrono)
  stateRef.current = state;

  // Obter cliente Supabase singleton (browser)
  const supabase = getBrowserClient();

  /**
   * Sincronizar ref com state (fallback de segurança)
   * 
   * Garante que currentUserIdRef esteja sempre sincronizado com o state,
   * mesmo se houver mudanças de state que não passem pelo updateSession.
   * A atualização principal acontece síncronamente no updateSession.
   */
  useEffect(() => {
    if (state.type === 'authenticated') {
      currentUserIdRef.current = state.user.id;
    } else {
      currentUserIdRef.current = null;
    }
  }, [state]);

  /**
   * updateSession: Atualização manual de sessão (IDEMPOTENTE)
   * 
   * CORREÇÃO CRÍTICA: Verifica se já está autenticado com o mesmo usuário
   * antes de despachar AUTH_SUCCESS. Isso evita dispatch duplicado quando:
   * 1. updateSession é chamado manualmente após signIn
   * 2. onAuthStateChange dispara SIGNED_IN logo em seguida
   * 
   * ARQUITETURA:
   * - Usa stateRef para ler state atual sem causar re-criação da função
   * - Atualiza currentUserIdRef SÍNCRONAMENTE antes do dispatch
   * - Função estável que não depende de state no closure
   * 
   * REGRA: Se já estiver autenticado E newSession.user.id === usuário atual
   * → NÃO despachar AUTH_SUCCESS novamente
   */
  const updateSession = useCallback((newSession: Session | null) => {
    if (!mountedRef.current) return;

    const currentState = stateRef.current;

    // Se não há sessão, fazer logout
    if (!newSession?.user) {
      // Só despachar logout se não estiver já desautenticado
      if (currentState.type !== 'unauthenticated' && currentState.type !== 'idle') {
        // Atualizar ref síncronamente antes do dispatch
        currentUserIdRef.current = null;
        dispatch({ type: 'AUTH_LOGOUT' });
      }
      return;
    }

    // CORREÇÃO: Verificar se já está autenticado com o mesmo usuário
    // Lê do state atual via ref para evitar race conditions
    const isSameUser = 
      (currentState.type === 'authenticated' && currentState.user.id === newSession.user.id) ||
      (currentUserIdRef.current === newSession.user.id);

    if (isSameUser) {
      logger.debug('updateSession ignorado (mesmo usuário)', {
        userId: newSession.user.id,
        previousState: currentState.type,
      });
      return;
    }

    // ATUALIZAR REF SÍNCRONAMENTE ANTES DO DISPATCH
    // Isso garante que chamadas subsequentes vejam o valor atualizado imediatamente
    currentUserIdRef.current = newSession.user.id;

    // Despachar AUTH_SUCCESS apenas se for um usuário diferente ou primeiro login
    dispatch({
      type: 'AUTH_SUCCESS',
      user: newSession.user,
      session: newSession,
    });
  }, []); // Função estável - não depende de state

  /**
   * INICIALIZAÇÃO ÚNICA
   * 
   * Executa apenas uma vez quando o componente monta.
   * 
   * ARQUITETURA:
   * - Não depende de updateSession para evitar re-execuções
   * - Usa ref estável para updateSession (não recria a função)
   * - Garante inicialização única mesmo com re-renders
   */
  useEffect(() => {
    // Prevenir múltiplas inicializações
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    mountedRef.current = true;

    /**
     * Fase 1: Restaurar sessão atual
     * 
     * CORREÇÃO PERICIAL: Garante INIT_COMPLETE no finally
     * Nunca fica preso em loading, sempre finaliza a inicialização
     */
    const initialize = async () => {
      dispatch({ type: 'SESSION_LOADING' });

      try {
        const { getRepositories } = await import('@/lib/repositories');
        const repositories = getRepositories();
        const session = await repositories.auth.getSession();

        if (!mountedRef.current) return;

        if (session?.user) {
          // Atualizar ref síncronamente antes do dispatch
          currentUserIdRef.current = session.user.id;
          dispatch({
            type: 'AUTH_SUCCESS',
            user: session.user,
            session,
          });
        } else {
          currentUserIdRef.current = null;
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error) {
        if (!mountedRef.current) return;
        
        currentUserIdRef.current = null;
        dispatch({
          type: 'AUTH_ERROR',
          error: error instanceof Error ? error : new Error('Erro desconhecido'),
        });
      } finally {
        // 🔥 GARANTIA ABSOLUTA: Sempre finaliza a inicialização
        if (mountedRef.current) {
          dispatch({ type: 'INIT_COMPLETE' });
        }
      }
    };

    /**
     * Fase 2: Configurar listener de mudanças
     * 
     * IMPORTANTE: onAuthStateChange pode disparar SIGNED_IN
     * após updateSession manual. A correção idempotente em updateSession
     * garante que não haverá AUTH_SUCCESS duplicado.
     */
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, newSession: Session | null) => {
          if (!mountedRef.current) return;

          // Ignorar INITIAL_SESSION - já tratado no initialize()
          if (event === 'INITIAL_SESSION') {
            return;
          }

          // Log apenas para eventos reais (não INITIAL_SESSION)
          if (event !== 'TOKEN_REFRESHED') {
            logger.debug('Auth state changed', {
              event,
              userId: newSession?.user?.id,
            });
          }

          // Atualizar estado quando houver mudança real
          // A função updateSession é idempotente, então não haverá duplicação
          updateSession(newSession);
        }
      );
      subscriptionRef.current = data.subscription;
    } catch (error) {
      console.error('Erro ao configurar listener:', error);
    }

    // Iniciar processo
    initialize();

    // Cleanup
    return () => {
      mountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez - supabase é singleton, updateSession é estável

  // Derivar valores do estado
  const session = state.type === 'authenticated' ? state.session : null;
  const user = state.type === 'authenticated' ? state.user : null;
  // sessionLoading apenas durante idle ou loading (não inclui error)
  const sessionLoading = state.type === 'idle' || state.type === 'loading';

  const value = useMemo(() => ({
    session,
    user,
    sessionLoading,
    updateSession,
  }), [session, user, sessionLoading, updateSession]);

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

/**
 * Hook para usar o contexto de sessão
 */
export function useAuthSession(): AuthSessionContextType {
  const context = useContext(AuthSessionContext);
  if (context === undefined) {
    throw new Error('useAuthSession deve ser usado dentro de um AuthSessionProvider');
  }
  return context;
}

'use client';

/**
 * ERROR BOUNDARY - Captura de Erros React
 * 
 * REFATORAÇÃO FASE 2 - TAREFA 2: Error Boundaries
 * 
 * Responsabilidades:
 * 1. Capturar erros em children
 * 2. Renderizar fallback UI
 * 3. Logar erros (console ou Sentry se disponível)
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Logar erro estruturado
    logger.error(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Chamar callback personalizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Integrar com Sentry/LogRocket quando disponível
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { react: errorInfo } });
    // }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Resetar se resetKeys mudaram
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys![index]
      );

      if (hasResetKeyChanged) {
        this.resetError();
      }
    }

    // Resetar se resetOnPropsChange está habilitado
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetError();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetError = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    // Resetar após um pequeno delay para evitar loops
    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
      });
    }, 100);
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Renderizar fallback customizado ou padrão
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}


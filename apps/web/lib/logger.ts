/**
 * LOGGER - Sistema de Logs Estruturados
 * 
 * REFATORAÇÃO FASE 2 - TAREFA 3: Observabilidade Básica
 * 
 * Responsabilidades:
 * 1. Logs estruturados (JSON)
 * 2. Níveis: debug, info, warn, error
 * 3. Context automático (timestamp, user, trace)
 * 4. Não logar informações sensíveis
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  timestamp: string;
  level: LogLevel;
  message: string;
  userId?: string;
  traceId?: string;
  metadata?: Record<string, any>;
}

/**
 * Gerar trace ID único
 */
function generateTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Obter trace ID atual (do contexto ou gerar novo)
 */
let currentTraceId: string | null = null;

function getTraceId(): string {
  if (!currentTraceId) {
    currentTraceId = generateTraceId();
  }
  return currentTraceId;
}

/**
 * Resetar trace ID (útil para novas requisições)
 */
export function resetTraceId(): void {
  currentTraceId = generateTraceId();
}

/**
 * Filtrar informações sensíveis dos logs
 */
function sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
  if (!metadata) {
    return undefined;
  }

  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];
  const sanitized = { ...metadata };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Formatar log para console
 */
function formatLog(context: LogContext): void {
  const { level, message, timestamp, userId, traceId, metadata } = context;
  
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  const logData: any = {
    traceId,
    ...(userId && { userId }),
    ...(metadata && { metadata: sanitizeMetadata(metadata) }),
  };

  switch (level) {
    case 'debug':
      console.debug(logMessage, logData);
      break;
    case 'info':
      console.info(logMessage, logData);
      break;
    case 'warn':
      console.warn(logMessage, logData);
      break;
    case 'error':
      console.error(logMessage, logData);
      break;
  }

  // TODO: Enviar para serviço de logging (Sentry, LogRocket, etc.) em produção
  // if (process.env.NODE_ENV === 'production') {
  //   sendToLoggingService(context);
  // }
}

/**
 * Logger principal
 */
export const logger = {
  debug: (message: string, metadata?: Record<string, any>) => {
    formatLog({
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      traceId: getTraceId(),
      metadata: sanitizeMetadata(metadata),
    });
  },

  info: (message: string, metadata?: Record<string, any>) => {
    formatLog({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      traceId: getTraceId(),
      metadata: sanitizeMetadata(metadata),
    });
  },

  warn: (message: string, metadata?: Record<string, any>) => {
    formatLog({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      traceId: getTraceId(),
      metadata: sanitizeMetadata(metadata),
    });
  },

  error: (error: Error | string, metadata?: Record<string, any>) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    formatLog({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: errorMessage,
      traceId: getTraceId(),
      metadata: {
        ...sanitizeMetadata(metadata),
        ...(errorStack && { stack: errorStack }),
      },
    });
  },

  /**
   * Log com contexto de usuário
   */
  withUser: (userId: string) => ({
    debug: (message: string, metadata?: Record<string, any>) => {
      formatLog({
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        userId,
        traceId: getTraceId(),
        metadata: sanitizeMetadata(metadata),
      });
    },
    info: (message: string, metadata?: Record<string, any>) => {
      formatLog({
        timestamp: new Date().toISOString(),
        level: 'info',
        message,
        userId,
        traceId: getTraceId(),
        metadata: sanitizeMetadata(metadata),
      });
    },
    warn: (message: string, metadata?: Record<string, any>) => {
      formatLog({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message,
        userId,
        traceId: getTraceId(),
        metadata: sanitizeMetadata(metadata),
      });
    },
    error: (error: Error | string, metadata?: Record<string, any>) => {
      const errorMessage = error instanceof Error ? error.message : error;
      const errorStack = error instanceof Error ? error.stack : undefined;

      formatLog({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: errorMessage,
        userId,
        traceId: getTraceId(),
        metadata: {
          ...sanitizeMetadata(metadata),
          ...(errorStack && { stack: errorStack }),
        },
      });
    },
  }),
};











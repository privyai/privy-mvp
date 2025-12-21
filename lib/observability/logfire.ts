/**
 * Logfire Observability Helpers for Privy AI Coach
 * 
 * Provides span wrappers for:
 * - LLM calls (tokens, latency, streaming)
 * - API requests (auth, rate limits)
 * - Database operations
 */

import * as logfire from 'logfire';

// Re-export logfire for convenience
export { logfire };

// Log levels
export const Level = logfire.Level;

/**
 * Create a span for LLM chat completion
 */
export async function withLLMSpan<T>(
    operation: string,
    attributes: {
        model: string;
        chatId?: string;
        userId?: string;
        mode?: string;
    },
    fn: () => Promise<T>
): Promise<T> {
    return logfire.span(
        `llm.${operation}`,
        {
            'llm.model': attributes.model,
            'llm.chat_id': attributes.chatId,
            'llm.user_id': attributes.userId,
            'llm.mode': attributes.mode,
        },
        { level: Level.Info },
        async (span) => {
            const startTime = Date.now();
            try {
                const result = await fn();
                span.setAttribute('llm.duration_ms', Date.now() - startTime);
                span.setAttribute('llm.success', true);
                span.end();
                return result;
            } catch (error) {
                span.setAttribute('llm.success', false);
                span.setAttribute('llm.error', error instanceof Error ? error.message : String(error));
                span.end();
                throw error;
            }
        }
    );
}

/**
 * Create a span for API requests
 */
export async function withAPISpan<T>(
    operation: string,
    attributes: {
        method: string;
        path: string;
        userId?: string;
        chatId?: string;
    },
    fn: () => Promise<T>
): Promise<T> {
    return logfire.span(
        `api.${operation}`,
        {
            'http.method': attributes.method,
            'http.path': attributes.path,
            'user.id': attributes.userId,
            'chat.id': attributes.chatId,
        },
        { level: Level.Info },
        async (span) => {
            const startTime = Date.now();
            try {
                const result = await fn();
                span.setAttribute('api.duration_ms', Date.now() - startTime);
                span.setAttribute('api.success', true);
                span.end();
                return result;
            } catch (error) {
                span.setAttribute('api.success', false);
                span.setAttribute('api.error', error instanceof Error ? error.message : String(error));
                span.end();
                throw error;
            }
        }
    );
}

/**
 * Create a span for database operations
 */
export async function withDBSpan<T>(
    operation: string,
    attributes: {
        table: string;
        queryType: 'select' | 'insert' | 'update' | 'delete';
    },
    fn: () => Promise<T>
): Promise<T> {
    return logfire.span(
        `db.${operation}`,
        {
            'db.table': attributes.table,
            'db.query_type': attributes.queryType,
        },
        { level: Level.Debug },
        async (span) => {
            const startTime = Date.now();
            try {
                const result = await fn();
                span.setAttribute('db.duration_ms', Date.now() - startTime);
                span.setAttribute('db.success', true);
                span.end();
                return result;
            } catch (error) {
                span.setAttribute('db.success', false);
                span.setAttribute('db.error', error instanceof Error ? error.message : String(error));
                span.end();
                throw error;
            }
        }
    );
}

/**
 * Log LLM token usage
 */
export function logTokenUsage(attributes: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    chatId?: string;
}) {
    logfire.info('llm.token_usage', {
        'llm.model': attributes.model,
        'llm.tokens.prompt': attributes.promptTokens,
        'llm.tokens.completion': attributes.completionTokens,
        'llm.tokens.total': attributes.totalTokens,
        'llm.chat_id': attributes.chatId,
    });
}

/**
 * Log rate limit check
 */
export function logRateLimitCheck(attributes: {
    userId: string;
    messageCount: number;
    limit: number;
    allowed: boolean;
}) {
    if (attributes.allowed) {
        logfire.debug('api.rate_limit_check', {
            'user.id': attributes.userId,
            'rate_limit.count': String(attributes.messageCount),
            'rate_limit.limit': String(attributes.limit),
            'rate_limit.allowed': attributes.allowed,
        });
    } else {
        logfire.info('api.rate_limit_exceeded', {
            'user.id': attributes.userId,
            'rate_limit.count': String(attributes.messageCount),
            'rate_limit.limit': String(attributes.limit),
            'rate_limit.allowed': attributes.allowed,
        });
    }
}

/**
 * Log errors with context
 */
export function logError(operation: string, error: Error, context?: Record<string, unknown>) {
    logfire.error(`error.${operation}`, {
        'error.message': error.message,
        'error.name': error.name,
        'error.stack': error.stack,
        ...context,
    });
}

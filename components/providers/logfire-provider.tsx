'use client';

import { useEffect, useRef } from 'react';
import * as logfire from '@pydantic/logfire-browser';

/**
 * LogfireProvider - Client-side error and trace tracking
 *
 * Initializes Logfire browser SDK and captures:
 * - Unhandled errors
 * - Unhandled promise rejections
 * - Page views
 * - Custom spans/logs
 */
export function LogfireProvider({ children }: { children: React.ReactNode }) {
    const initialized = useRef(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (initialized.current) return;

        try {
            // Build the trace URL pointing to our proxy
            const url = new URL(window.location.href);
            url.pathname = '/client-traces';

            // Initialize Logfire browser SDK
            logfire.configure({
                traceUrl: url.toString(),
                serviceName: 'privy-browser',
                serviceVersion: '1.0.0',
                // Enable debug logging in development
                diagLogLevel: process.env.NODE_ENV === 'development'
                    ? logfire.DiagLogLevel.ALL
                    : logfire.DiagLogLevel.NONE,
            });

            initialized.current = true;

            // Log successful initialization
            logfire.info('Browser observability initialized', {
                'browser.user_agent': navigator.userAgent,
                'browser.url': window.location.href,
            });

            // Capture unhandled errors
            const handleError = (event: ErrorEvent) => {
                logfire.error('Unhandled browser error', {
                    'error.message': event.message,
                    'error.filename': event.filename,
                    'error.lineno': event.lineno,
                    'error.colno': event.colno,
                    'error.stack': event.error?.stack,
                    'browser.url': window.location.href,
                });
            };

            // Capture unhandled promise rejections
            const handleRejection = (event: PromiseRejectionEvent) => {
                logfire.error('Unhandled promise rejection', {
                    'error.reason': String(event.reason),
                    'error.stack': event.reason?.stack,
                    'browser.url': window.location.href,
                });
            };

            window.addEventListener('error', handleError);
            window.addEventListener('unhandledrejection', handleRejection);

            // Track page views
            const trackPageView = (path: string) => {
                logfire.info('Page view', {
                    'page.path': path,
                    'page.url': window.location.href,
                    'page.referrer': document.referrer,
                });
            };

            // Track initial page view
            trackPageView(window.location.pathname);

            // Track navigation (back/forward)
            const handlePopState = () => {
                trackPageView(window.location.pathname);
            };
            window.addEventListener('popstate', handlePopState);

            // Track client-side navigation via MutationObserver
            let lastPath = window.location.pathname;
            const observer = new MutationObserver(() => {
                const currentPath = window.location.pathname;
                if (currentPath !== lastPath) {
                    lastPath = currentPath;
                    trackPageView(currentPath);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });

            return () => {
                window.removeEventListener('error', handleError);
                window.removeEventListener('unhandledrejection', handleRejection);
                window.removeEventListener('popstate', handlePopState);
                observer.disconnect();
            };
        } catch (error) {
            console.error('Failed to initialize Logfire browser SDK:', error);
        }
    }, []);

    return <>{children}</>;
}

// Export logfire for use in other components
export { logfire };

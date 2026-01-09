import mixpanel from 'mixpanel-browser';

// Types for type-safe event tracking
export type MixpanelEventName =
    | 'Page View'
    | 'Chat Started'
    | 'Message Sent'
    | 'Sign Up'
    | 'Login'
    | 'Logout'
    | 'Upgrade Clicked'
    | 'Payment Completed'
    | string; // Allow custom events

export type MixpanelEventProperties = {
    domain?: string;
    path?: string;
    [key: string]: unknown;
};

class MixpanelService {
    private initialized = false;

    init() {
        if (this.initialized) return;

        const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

        if (!token) {
            console.warn('Mixpanel token not found. Analytics will not be tracked.');
            return;
        }

        try {
            mixpanel.init(token, {
                debug: process.env.NEXT_PUBLIC_MIXPANEL_DEBUG === 'true',
                track_pageview: false, // We'll handle this manually for better control
                persistence: 'localStorage',
                ignore_dnt: false, // Respect Do Not Track
                autocapture: true, // Enable click, form submission tracking
                record_sessions_percent: 100, // As specified in your Mixpanel config
            });

            this.initialized = true;

            // Add domain to all events to differentiate between websites
            this.registerSuperProperties({
                domain: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
                environment: process.env.NODE_ENV,
            });
        } catch (error) {
            console.error('Failed to initialize Mixpanel:', error);
        }
    }

    /**
     * Track a custom event
     */
    trackEvent(eventName: MixpanelEventName, properties?: MixpanelEventProperties) {
        if (!this.initialized) return;

        try {
            mixpanel.track(eventName, {
                ...properties,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Failed to track event:', error);
        }
    }

    /**
     * Track page view
     */
    trackPageView(path?: string) {
        if (!this.initialized) return;

        const pagePath = path || (typeof window !== 'undefined' ? window.location.pathname : '');

        this.trackEvent('Page View', {
            path: pagePath,
            url: typeof window !== 'undefined' ? window.location.href : '',
            referrer: typeof window !== 'undefined' ? document.referrer : '',
        });
    }

    /**
     * Identify a user
     */
    identify(userId: string) {
        if (!this.initialized) return;

        try {
            mixpanel.identify(userId);
        } catch (error) {
            console.error('Failed to identify user:', error);
        }
    }

    /**
     * Set user properties
     */
    setUserProperties(properties: Record<string, unknown>) {
        if (!this.initialized) return;

        try {
            mixpanel.people.set(properties);
        } catch (error) {
            console.error('Failed to set user properties:', error);
        }
    }

    /**
     * Register super properties (sent with every event)
     */
    registerSuperProperties(properties: Record<string, unknown>) {
        if (!this.initialized) return;

        try {
            mixpanel.register(properties);
        } catch (error) {
            console.error('Failed to register super properties:', error);
        }
    }

    /**
     * Reset user identity (e.g., on logout)
     */
    reset() {
        if (!this.initialized) return;

        try {
            mixpanel.reset();

            // Re-register domain after reset
            this.registerSuperProperties({
                domain: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
                environment: process.env.NODE_ENV,
            });
        } catch (error) {
            console.error('Failed to reset Mixpanel:', error);
        }
    }

    /**
     * Get the Mixpanel instance for advanced usage
     */
    getInstance() {
        return this.initialized ? mixpanel : null;
    }
}

// Export singleton instance
export const mixpanelService = new MixpanelService();

// Convenience exports
export const trackEvent = (eventName: MixpanelEventName, properties?: MixpanelEventProperties) =>
    mixpanelService.trackEvent(eventName, properties);

export const trackPageView = (path?: string) =>
    mixpanelService.trackPageView(path);

export const identifyUser = (userId: string) =>
    mixpanelService.identify(userId);

export const setUserProperties = (properties: Record<string, unknown>) =>
    mixpanelService.setUserProperties(properties);

export const resetMixpanel = () =>
    mixpanelService.reset();

'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { mixpanelService, trackPageView } from '@/lib/analytics/mixpanel';

function MixpanelTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize Mixpanel only on client
    useEffect(() => {
        mixpanelService.init();
        setIsInitialized(true);
    }, []);

    // Track page views on route change (only after init)
    useEffect(() => {
        if (isInitialized && pathname) {
            const url = searchParams?.toString()
                ? `${pathname}?${searchParams.toString()}`
                : pathname;

            trackPageView(url);
        }
    }, [pathname, searchParams, isInitialized]);

    return null;
}

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            {mounted && (
                <Suspense fallback={null}>
                    <MixpanelTracker />
                </Suspense>
            )}
            {children}
        </>
    );
}

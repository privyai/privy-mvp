'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { mixpanelService, trackPageView } from '@/lib/analytics/mixpanel';

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize Mixpanel
    useEffect(() => {
        mixpanelService.init();
    }, []);

    // Track page views on route change
    useEffect(() => {
        if (pathname) {
            const url = searchParams.toString()
                ? `${pathname}?${searchParams.toString()}`
                : pathname;

            trackPageView(url);
        }
    }, [pathname, searchParams]);

    return <>{children}</>;
}

"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Auth layout provides SessionProvider for legacy login/register pages.
 * These pages still use next-auth's useSession hook.
 * New users should go through token-based auth at /chat instead.
 */
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <SessionProvider>{children}</SessionProvider>;
}

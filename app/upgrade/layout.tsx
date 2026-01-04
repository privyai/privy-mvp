import { TokenProvider } from "@/components/token-provider";

export default function UpgradeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <TokenProvider>{children}</TokenProvider>;
}

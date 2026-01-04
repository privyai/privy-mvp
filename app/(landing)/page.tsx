import { MoveRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ChatPreview } from "@/components/chat-preview";
import { PrivacyFlowDiagram } from "@/components/privacy-flow-diagram";
import { InfiniteGrid } from "@/components/ui/infinite-grid";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <span className="font-semibold text-lg">Privy</span>
          </Link>
          <div className="flex items-center gap-4">
            <a href="#privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Privacy
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              How it works
            </a>
            <Link href="/chat">
              <InteractiveHoverButton text="Start chatting" className="w-40 h-9 text-sm" />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section - Two Column Layout with Infinite Grid Background */}
      <InfiniteGrid className="flex flex-1 items-center px-4 py-16 lg:py-20">
        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column: Text Content */}
          <div className="flex flex-col justify-center space-y-8">
            <div className="inline-block">
              <Badge className="text-sm" variant="outline">
                Radically private • Built for founders &amp; leaders
              </Badge>
            </div>

            <h1 className="font-bold text-4xl tracking-tight md:text-5xl lg:text-6xl">
              Finally, a place leaders can talk freely.
            </h1>

            <p className="max-w-xl text-muted-foreground text-lg leading-relaxed md:text-xl">
              Privy is a{" "}
              <span className="font-semibold text-foreground">
                private AI mental performance coach
              </span>{" "}
              for high-stakes decision-makers. Think out loud, get clarity, and
              stay sharp{" "}
              <span className="font-semibold text-foreground">
                without exposure, judgment, or consequences.
              </span>
            </p>

            <div className="flex flex-col gap-4 pt-2 sm:flex-row">
              <Link href="/chat">
                <InteractiveHoverButton text="Start chatting" className="w-56" />
              </Link>
              <a href="#how-it-works">
                <Button className="text-base" size="lg" variant="outline">
                  How it works
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap gap-6 pt-4 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                No name required
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                No chat history stored by default
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                Burn sessions anytime
              </div>
            </div>
          </div>

          {/* Right Column: Chat Preview */}
          <div className="flex items-center justify-center lg:justify-end">
            <ChatPreview />
          </div>
        </div>
      </InfiniteGrid>

      {/* Privacy Section - Zero Trust Architecture */}
      <section className="border-t bg-muted/50 px-4 py-20" id="privacy">
        <PrivacyFlowDiagram />
      </section>

      {/* Features Section */}
      <section className="border-t px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 text-center">
            <Badge variant="outline" className="text-sm">Mental Performance</Badge>
          </div>
          <h2 className="mb-4 text-center font-bold text-3xl md:text-4xl">
            Not therapy. Coaching for leaders.
          </h2>
          <p className="mb-16 text-center text-lg text-muted-foreground">
            Designed to be minimal, private, and calm.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl">
                💭
              </div>
              <h3 className="font-semibold text-xl">Decision clarity</h3>
              <p className="text-muted-foreground">
                Break down complex tradeoffs, simulate outcomes, and move from
                noise to action.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl">
                🧠
              </div>
              <h3 className="font-semibold text-xl">Emotional regulation</h3>
              <p className="text-muted-foreground">
                Process pressure privately so it doesn't leak into meetings,
                decisions, or relationships.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl">
                ⚡
              </div>
              <h3 className="font-semibold text-xl">Always on</h3>
              <p className="text-muted-foreground">
                Late night, early morning, between meetings — Privy is available
                when it matters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three Modes Section */}
      <section className="border-t px-4 py-20" id="how-it-works">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div className="mb-4">
              <Badge variant="outline" className="text-sm">Coaching Modes</Badge>
            </div>
            <h2 className="mb-4 font-bold text-3xl md:text-4xl">
              Three modes. One purpose: better performance.
            </h2>
            <p className="text-lg text-muted-foreground">
              Each mode changes the coaching approach — not the UI. Calm,
              structured, direct.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-2 font-semibold text-xl">Vent</h3>
              <p className="text-muted-foreground">
                Unload emotional weight safely. Then extract the signal.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-2 font-semibold text-xl">Decision Lab</h3>
              <p className="text-muted-foreground">
                Map tradeoffs, constraints, risks, and next steps.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-2 font-semibold text-xl">Reframe & Reset</h3>
              <p className="text-muted-foreground">
                Shift perspective, regain composure, re-enter execution mode.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="border-t px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 text-center">
            <Badge variant="outline" className="text-sm">Pricing</Badge>
          </div>
          <h2 className="mb-12 text-center font-bold text-3xl md:text-4xl">
            Choose your tier
          </h2>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Free Tier */}
            <div className="rounded-lg border bg-card p-8">
              <div className="mb-6">
                <h3 className="mb-2 font-bold text-2xl">Free</h3>
                <p className="text-muted-foreground">
                  Start anonymously, no commitments.
                </p>
              </div>

              <ul className="mb-8 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>Ephemeral sessions (memory only)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>No database writes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>30 messages per day</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>Session auto-deletes on timeout</span>
                </li>
              </ul>

              <Link href="/chat">
                <Button className="w-full" variant="outline">
                  Start for free
                </Button>
              </Link>
            </div>

            {/* Premium Tier */}
            <div className="relative rounded-lg border-2 border-primary bg-card p-8">
              <div className="-top-4 -translate-x-1/2 absolute left-1/2">
                <Badge>Most Popular</Badge>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="font-bold text-2xl">Premium</h3>
                  <span className="text-2xl font-bold">$30</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground">
                  Sustained coaching with memory.
                </p>
              </div>

              <ul className="mb-8 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>Everything in Free</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>Global Memory — AI remembers context</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>Unlimited messages & chats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>Auto-vanish data retention controls</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>Pay with card or crypto</span>
                </li>
              </ul>

              <Link href="/upgrade">
                <Button className="w-full">
                  Get Premium
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Start free, upgrade from your dashboard
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t px-4 py-20">
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          <Badge variant="outline" className="text-sm">Get Started</Badge>
          <h2 className="font-bold text-4xl tracking-tight md:text-5xl">
            Ready to think clearly?
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-xl">
            No signup required. Start your first session anonymously and see how
            Privy can help you make better decisions under pressure.
          </p>
          <div className="pt-4">
            <Link href="/chat">
              <InteractiveHoverButton text="Start chatting" className="w-56" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

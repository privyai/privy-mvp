import { MoveRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatPreview } from "@/components/chat-preview";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section - Two Column Layout */}
      <section className="flex flex-1 items-center px-4 py-16 lg:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-2 lg:gap-16">
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
                <Button className="gap-2 text-base" size="lg">
                  Start anonymously <MoveRight className="h-5 w-5" />
                </Button>
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
      </section>

      {/* Features Section */}
      <section className="border-t px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center font-bold text-3xl md:text-4xl">
            Not therapy. Mental performance coaching for leaders.
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

      {/* Privacy Section */}
      <section className="border-t bg-muted/50 px-4 py-20">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <h2 className="font-bold text-3xl md:text-4xl">
            Privacy is the product.
          </h2>
          <p className="mb-8 text-muted-foreground text-xl">
            Privy is built around a single principle:{" "}
            <span className="font-semibold text-foreground">
              nothing leaks.
            </span>
          </p>

          <div className="mx-auto grid max-w-2xl gap-4 text-left md:grid-cols-2">
            <div className="flex items-start gap-3">
              <span className="mt-1 text-green-500">✓</span>
              <div>
                <p className="font-medium">No identity required</p>
                <p className="text-muted-foreground text-sm">to start.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 text-green-500">✓</span>
              <div>
                <p className="font-medium">
                  No chat history stored by default.
                </p>
                <p className="text-muted-foreground text-sm">
                  Free tier is ephemeral.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 text-green-500">✓</span>
              <div>
                <p className="font-medium">Minimal logging</p>
                <p className="text-muted-foreground text-sm">(errors only).</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 text-green-500">✓</span>
              <div>
                <p className="font-medium">Burn sessions anytime,</p>
                <p className="text-muted-foreground text-sm">one click.</p>
              </div>
            </div>
          </div>

          <p className="mx-auto mt-8 max-w-2xl border-t pt-6 text-muted-foreground text-sm">
            Privy is not a medical service and does not provide therapy or
            crisis support. If you're in immediate danger, contact local
            emergency services.
          </p>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="border-t px-4 py-20">
        <div className="mx-auto max-w-5xl">
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
                <Badge>Coming Soon</Badge>
              </div>

              <div className="mb-6">
                <h3 className="mb-2 font-bold text-2xl">Premium</h3>
                <p className="text-muted-foreground">
                  For sustained coaching with context.
                </p>
              </div>

              <ul className="mb-8 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>Everything in Free</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>End-to-end encrypted storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>Context persists across sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>Crypto-shredding on demand</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>Unlimited messages</span>
                </li>
              </ul>

              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t px-4 py-20">
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          <Badge>Get started</Badge>
          <h2 className="font-bold text-4xl tracking-tight md:text-5xl">
            Ready to think clearly?
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-xl">
            No signup required. Start your first session anonymously and see how
            Privy can help you make better decisions under pressure.
          </p>
          <div className="pt-4">
            <Link href="/chat">
              <Button className="gap-2 text-base" size="lg">
                Start your first session <MoveRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

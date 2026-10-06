import Link from "next/link";
import {
  ShieldCheck,
  LinkIcon,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PaymentFlowVisual } from "@/components/marketing/payment-flow-visual";
import { AgentDashboardMock } from "@/components/marketing/agent-dashboard-mock";
import { FeaturesSection } from "@/components/marketing/features-section";
import { buttonVariants } from "@/components/ui/button";

const steps = [
  {
    icon: LinkIcon,
    title: "Connect your wallet",
    description:
      "Link the wallet you already use. Autopayze reads balances and activity — it never touches funds without a rule you set.",
  },
  {
    icon: SlidersHorizontal,
    title: "Set a payment rule",
    description:
      "Tell the agent who gets paid, how much, and when. It structures the intent and asks before anything is signed.",
  },
  {
    icon: Zap,
    title: "The agent handles the rest",
    description:
      "Autopayze executes on time, every time, and logs every transaction so you can audit it whenever you want.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
              Crypto payments that run themselves.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Autopayze schedules, sends and tracks crypto payments from your
              wallet, so recurring transfers and airdrops stop depending on you
              remembering to do them.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                Get started
              </Link>
              <Link
                href="#how-it-works"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                See how it works
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-success" />
              Your keys stay in your wallet. Autopayze only executes rules you approve.
            </p>
          </div>

          <div className="flex justify-center md:justify-end">
            <PaymentFlowVisual />
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
            <div className="mx-auto mb-14 max-w-xl text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
                Simple steps
              </p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                How it works
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                No complexity, no watching dashboards. Set a rule once and let
                Autopayze run it.
              </p>
            </div>

            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                <AgentDashboardMock />
              </div>

              <div className="relative flex flex-col gap-0">
                <div
                  className="absolute left-[19px] top-10 bottom-10 w-px bg-border"
                  aria-hidden="true"
                />
                {steps.map((step, i) => (
                  <div
                    key={step.title}
                    className={`relative flex gap-5 ${i < steps.length - 1 ? "pb-10" : ""}`}
                  >
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                      <step.icon className="h-4 w-4 text-primary" strokeWidth={2} />
                    </div>
                    <div className="pt-1.5">
                      <h3 className="font-display text-base font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <FeaturesSection />

        {/* CTA */}
        <section className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                Set your first payment rule in a few minutes.
              </h2>
              <p className="mt-2 text-muted-foreground">No card required to try it.</p>
            </div>
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Get started
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

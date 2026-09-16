import Link from "next/link";
import {
  Bot,
  Gift,
  Repeat,
  Wallet as WalletIcon,
  ShieldCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PaymentFlowVisual } from "@/components/marketing/payment-flow-visual";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  {
    number: "01",
    title: "Connect your wallet",
    description:
      "Link the wallet you already use. Autopayze reads balances and activity — it never touches funds without a rule you set.",
  },
  {
    number: "02",
    title: "Set a payment rule",
    description:
      "Pick who gets paid, how much, and when: a fixed schedule, a balance threshold, or a one-off transfer.",
  },
  {
    number: "03",
    title: "The agent handles the rest",
    description:
      "Autopayze executes on time, every time, and logs every transaction so you can review it later.",
  },
];

const features = [
  {
    icon: WalletIcon,
    title: "Wallet",
    description:
      "See balances across chains in one place, with activity that updates as it happens.",
  },
  {
    icon: Repeat,
    title: "Scheduled payments",
    description:
      "Set payroll, rent, or recurring transfers once. Autopayze sends them on time without a reminder from you.",
  },
  {
    icon: Gift,
    title: "Airdrops",
    description:
      "Distribute tokens to a list of addresses in one batch, with a clear record of who received what.",
  },
  {
    icon: Bot,
    title: "AI agent",
    description:
      "Tell the agent the outcome you want. It plans the transactions and asks before anything irreversible happens.",
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
              wallet, so recurring transfers and airdrops stop depending on
              you remembering to do them.
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

        {/* How it works — a real sequence, so numbering earns its place */}
        <section id="how-it-works" className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Three steps, then it runs on its own.
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number}>
                  <span className="font-display text-sm font-semibold text-primary">
                    {step.number}
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Everything a wallet needs to run without you watching it.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="p-5">
                <feature.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 text-sm font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                Set your first payment rule in a few minutes.
              </h2>
              <p className="mt-2 text-muted-foreground">
                No card required to try it.
              </p>
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

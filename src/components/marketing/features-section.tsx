"use client";

import { Wallet, Repeat, Gift, Bot } from "lucide-react";
import { FeatureCard } from "./feature-card";

const features = [
  {
    icon: <Wallet className="h-7 w-7 text-white drop-shadow-md" strokeWidth={1.5} />,
    title: "Wallet",
    description:
      "See balances across chains in one place, with activity that updates as it happens.",
    gradient: "from-[#6C63FF] via-[#9B8FFF] to-[#C4BEFF]",
    overlayGradient: "from-[#3730a3]/90 via-[#4338ca]/60 to-transparent",
    number: "01",
    label: "Wallet Overview",
  },
  {
    icon: <Repeat className="h-7 w-7 text-white drop-shadow-md" strokeWidth={1.5} />,
    title: "Scheduled Payments",
    description:
      "Set payroll, rent, or recurring transfers once. Autopayze sends them on time without a reminder from you.",
    gradient: "from-[#F472B6] via-[#FB7185] to-[#FECDD3]",
    overlayGradient: "from-[#9d174d]/85 via-[#be185d]/55 to-transparent",
    number: "02",
    label: "Auto Scheduling",
  },
  {
    icon: <Gift className="h-7 w-7 text-white drop-shadow-md" strokeWidth={1.5} />,
    title: "Airdrops",
    description:
      "Distribute tokens to a list of addresses in one batch, with a clear record of who received what.",
    gradient: "from-[#00C8FF] via-[#0066FF] to-[#1A103C]",
    overlayGradient: "from-[#0c1445]/90 via-[#1e3a8a]/60 to-transparent",
    number: "03",
    label: "Token Distribution",
  },
  {
    icon: <Bot className="h-7 w-7 text-white drop-shadow-md" strokeWidth={1.5} />,
    title: "AI Agent",
    description:
      "Tell the agent the outcome you want. It plans the transactions and asks before anything irreversible happens.",
    gradient: "from-[#3B46F6] via-[#8033FF] to-[#C077FF]",
    overlayGradient: "from-[#1e1b4b]/90 via-[#4c1d95]/60 to-transparent",
    number: "04",
    label: "AI Automation",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
      <div className="mx-auto mb-14 max-w-xl text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
          Everything you need
        </p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Everything a wallet needs to run without you watching it.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            gradient={feature.gradient}
            overlayGradient={feature.overlayGradient}
            number={feature.number}
            label={feature.label}
          />
        ))}
      </div>
    </section>
  );
}

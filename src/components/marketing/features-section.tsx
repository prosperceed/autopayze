"use client";

import { Wallet, Repeat, Gift, Bot } from "lucide-react";
import { FeatureCard } from "./feature-card";

const features = [
	{
		icon: (
			<Wallet className="h-7 w-7 text-white drop-shadow-md" strokeWidth={1.5} />
		),
		title: "Wallet",
		description:
			"See balances across chains in one place, with activity that updates as it happens.",
		gradient: "from-slate-950 via-slate-800 to-slate-500",
		overlayGradient: "from-slate-950/95 via-slate-900/70 to-transparent",
	},
	{
		icon: (
			<Repeat className="h-7 w-7 text-white drop-shadow-md" strokeWidth={1.5} />
		),
		title: "Scheduled Payments",
		description:
			"Set payroll, rent, or recurring transfers once. Autopayze sends them on time without a reminder from you.",
		gradient: "from-stone-950 via-stone-700 to-stone-400",
		overlayGradient: "from-stone-950/95 via-stone-900/70 to-transparent",
	},
	{
		icon: (
			<Gift className="h-7 w-7 text-white drop-shadow-md" strokeWidth={1.5} />
		),
		title: "Airdrops",
		description:
			"Distribute tokens to a list of addresses in one batch, with a clear record of who received what.",
		gradient: "from-zinc-950 via-zinc-700 to-zinc-400",
		overlayGradient: "from-zinc-950/95 via-zinc-900/70 to-transparent",
	},
	{
		icon: (
			<Bot className="h-7 w-7 text-white drop-shadow-md" strokeWidth={1.5} />
		),
		title: "AI Agent",
		description:
			"Tell the agent the outcome you want. It plans the transactions and asks before anything irreversible happens.",
		gradient: "from-neutral-950 via-neutral-800 to-neutral-500",
		overlayGradient: "from-neutral-950/95 via-neutral-900/70 to-transparent",
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

				<p className="mt-4 text-sm text-muted-foreground">
					Autopayze leverages Stellar’s low fees and fast finality to make
					deterministic, scheduled, and batch token operations reliable and
					cost‑efficient. Designed with Stellar primitives in mind — timebounds,
					sequence management, claimable balances and anchor-friendly flows.
				</p>
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
					/>
				))}
			</div>
		</section>
	);
}

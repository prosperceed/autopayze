import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
	Activity as ActivityIcon,
	ExternalLink,
	Zap,
	Calendar,
	Gift,
} from "lucide-react";
import Link from "next/link";

interface Transaction {
	id: string;
	created_at: string;
	action_type: "payment" | "schedule_payment" | "airdrop";
	amount: string | null;
	asset: string | null;
	recipient: string | null;
	status: string;
	tx_hash: string | null;
	summary: string | null;
	wallet_network: string | null;
}

const ACTION_META = {
	payment: {
		icon: Zap,
		label: "Payment",
		style: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
	},
	schedule_payment: {
		icon: Calendar,
		label: "Schedule",
		style: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
	},
	airdrop: {
		icon: Gift,
		label: "Airdrop",
		style: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
	},
};

function short(address: string) {
	return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function explorerUrl(txHash: string, network: string | null) {
	const net = network === "stellar-mainnet" ? "public" : "testnet";
	return `https://stellar.expert/explorer/${net}/tx/${txHash}`;
}

export default async function ActivitiesPage() {
	const user = await requireUser();

	const supabase = await createClient();
	const { data, error } = await supabase
		.from("agent_transactions")
		.select(
			"id, created_at, action_type, amount, asset, recipient, status, tx_hash, summary, wallet_network",
		)
		.eq("user_id", user.id)
		.order("created_at", { ascending: false })
		.limit(100);

	const transactions = (data ?? []) as Transaction[];

	return (
		<div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
						Activity
					</h1>
					<p className="mt-1 text-xs sm:text-sm text-muted-foreground">
						All agent actions and transaction records for your account.
					</p>
				</div>
				{!error && transactions.length > 0 && (
					<span className="text-xs text-muted-foreground self-end pb-1">
						{transactions.length} record{transactions.length !== 1 ? "s" : ""}
					</span>
				)}
			</div>

			<Card>
				<CardHeader className="p-3 sm:p-5">
					<CardTitle className="text-sm sm:text-base flex items-center gap-2">
						<ActivityIcon className="h-4 w-4 text-muted-foreground" />
						Transaction log
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3 sm:p-5 pt-0">
					{error && (
						<p className="text-xs sm:text-sm text-destructive mb-4">
							Failed to load transactions: {error.message}
						</p>
					)}

					{!error && transactions.length === 0 && (
						<EmptyState
							icon={ActivityIcon}
							title="No activity yet"
							description="Connect a wallet and use the AI agent to send or schedule a payment."
							action={
								<Link
									href="/agent"
									className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
								>
									Open agent
								</Link>
							}
						/>
					)}

					{!error && transactions.length > 0 && (
						<div className="space-y-2">
							{/* Desktop column headers */}
							<div className="hidden sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 pb-2 border-b border-border/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
								<span>Type</span>
								<span>Summary</span>
								<span className="text-right">Amount</span>
								<span className="text-right">Date</span>
								<span className="text-right">Status</span>
								<span className="text-right">Tx</span>
							</div>

							{transactions.map((tx) => {
								const meta =
									ACTION_META[tx.action_type as keyof typeof ACTION_META] ??
									ACTION_META.payment;
								const Icon = meta.icon;

								return (
									<div
										key={tx.id}
										className="flex flex-col sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 sm:gap-3 rounded-lg border border-border/50 bg-muted/20 p-3 hover:bg-muted/30 transition-colors"
									>
										{/* Action type icon */}
										<div className="flex items-center gap-2 sm:block">
											<span
												className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.style}`}
											>
												<Icon className="h-3.5 w-3.5" aria-hidden="true" />
											</span>
											<span
												className={`sm:hidden text-[10px] font-semibold ${meta.style} rounded-full px-2 py-0.5 uppercase tracking-wide`}
											>
												{meta.label}
											</span>
										</div>

										{/* Summary + recipient */}
										<div className="min-w-0">
											{tx.summary ? (
												<p className="text-xs text-foreground line-clamp-1">
													{tx.summary}
												</p>
											) : (
												<p className="text-xs text-muted-foreground">
													{meta.label}
													{tx.recipient ? ` → ${short(tx.recipient)}` : ""}
												</p>
											)}
										</div>

										{/* Amount */}
										<div className="flex items-center justify-between sm:justify-end gap-2">
											<span className="text-xs sm:hidden font-medium text-muted-foreground">
												Amount
											</span>
											<span className="font-semibold tabular-nums text-sm text-foreground whitespace-nowrap">
												{tx.amount ? `${tx.amount} ${tx.asset ?? "XLM"}` : "—"}
											</span>
										</div>

										{/* Date */}
										<div className="flex items-center justify-between sm:justify-end gap-2">
											<span className="text-xs sm:hidden font-medium text-muted-foreground">
												Date
											</span>
											<span className="text-xs text-muted-foreground whitespace-nowrap">
												{new Date(tx.created_at).toLocaleDateString([], {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}
											</span>
										</div>

										{/* Status */}
										<div className="flex items-center justify-between sm:justify-end gap-2">
											<span className="text-xs sm:hidden font-medium text-muted-foreground">
												Status
											</span>
											<StatusBadge status={tx.status} />
										</div>

										{/* Tx link */}
										<div className="flex items-center justify-end">
											{tx.tx_hash ? (
												<a
													href={explorerUrl(tx.tx_hash, tx.wallet_network)}
													target="_blank"
													rel="noopener noreferrer"
													aria-label="View on Stellar Expert"
													className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
												>
													<ExternalLink className="h-3.5 w-3.5" />
												</a>
											) : (
												<span className="text-xs text-muted-foreground pr-2">
													—
												</span>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

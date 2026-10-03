"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Smartphone } from "lucide-react";

function WalletCallbackInner() {
	const params = useSearchParams();
	const [status, setStatus] = useState<"loading" | "success" | "error">(
		"loading",
	);
	const [message, setMessage] = useState("");
	const [address, setAddress] = useState("");

	const token = useMemo(() => params.get("token"), [params]);
	const pubkey = useMemo(() => params.get("pubkey"), [params]);
	const hasMissingParams = !token || !pubkey;
	const isValidPubkey = !!pubkey && /^G[A-Z2-7]{55}$/.test(pubkey);

	useEffect(() => {
		let active = true;

		if (hasMissingParams) {
			if (active) {
				setStatus("error");
				setMessage("Missing token or public key in the callback URL.");
			}
			return () => {
				active = false;
			};
		}

		if (!isValidPubkey) {
			if (active) {
				setStatus("error");
				setMessage(
					"The address returned by Freighter is not a valid Stellar public key.",
				);
			}
			return () => {
				active = false;
			};
		}

		setAddress(pubkey);

		async function completeConnection() {
			try {
				const res = await fetch("/api/wallet/session", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ token, address: pubkey }),
				});

				if (!res.ok) {
					const json = await res.json().catch(() => ({}));
					throw new Error(
						(json as { error?: string })?.error ?? "Session update failed",
					);
				}
				if (!active) return;
				setStatus("success");
				setMessage(
					"Wallet connected! You can close this tab and return to Autopayze.",
				);
			} catch (err) {
				if (!active) return;
				setStatus("error");
				setMessage(
					err instanceof Error
						? err.message
						: "Could not complete wallet connection. Please try again.",
				);
			}
		}

		void completeConnection();
		return () => {
			active = false;
		};
	}, [hasMissingParams, isValidPubkey, pubkey, token]);

	return (
		<div className="w-full max-w-sm space-y-5">
			<div className="flex justify-center">
				<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
					<Smartphone className="h-7 w-7 text-primary" />
				</div>
			</div>

			<div className="text-center">
				<h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
					Autopayze Wallet Connection
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Connecting your Freighter mobile wallet
				</p>
			</div>

			<div className="rounded-xl border border-border bg-card p-5">
				{status === "loading" && (
					<div className="flex flex-col items-center gap-3">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<p className="text-sm text-muted-foreground">
							Completing connection…
						</p>
					</div>
				)}

				{status === "success" && (
					<div className="flex flex-col items-center gap-3">
						<CheckCircle2 className="h-8 w-8 text-emerald-500" />
						<p className="text-sm font-medium text-foreground">
							Wallet connected!
						</p>
						{address && (
							<p className="font-mono text-xs text-muted-foreground break-all">
								{address.slice(0, 8)}…{address.slice(-8)}
							</p>
						)}
						<p className="text-sm text-muted-foreground text-center">
							{message}
						</p>
					</div>
				)}

				{status === "error" && (
					<div className="flex flex-col items-center gap-3">
						<XCircle className="h-8 w-8 text-destructive" />
						<p className="text-sm font-medium text-foreground">
							Connection failed
						</p>
						<p className="text-sm text-muted-foreground text-center">
							{message}
						</p>
						<Link
							href="/"
							className="mt-2 text-sm font-medium text-primary underline hover:text-primary/80"
						>
							Return to Autopayze
						</Link>
					</div>
				)}
			</div>

			{status === "success" && (
				<Link
					href="/dashboard"
					className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
				>
					Back to dashboard
				</Link>
			)}
		</div>
	);
}

export default function WalletCallbackPage() {
	return (
		<div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-6">
			<Suspense
				fallback={
					<div className="flex flex-col items-center gap-3">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<p className="text-sm text-muted-foreground">Loading…</p>
					</div>
				}
			>
				<WalletCallbackInner />
			</Suspense>
		</div>
	);
}

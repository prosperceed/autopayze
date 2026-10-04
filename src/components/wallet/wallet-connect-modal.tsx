"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Sparkles,
  Smartphone,
  ExternalLink,
  X,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Loader2,
  MonitorSmartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/providers/wallet-provider";

type Tab = "freighter" | "mobile" | "demo" | "manual";

export function WalletConnectModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    connect,
    connectManual,
    connectTestnetDemo,
    connectMobileFreighter,
    isFreighterAvailable,
    isMobile,
    isConnecting,
    error,
  } = useWallet();

  // Compute the best default tab. Start with "demo" (safe fallback), then
  // update once the provider resolves isMobile / isFreighterAvailable — which
  // may happen after the first render because Freighter injects itself async.
  const [activeTab, setActiveTab] = useState<Tab>("demo");
  useEffect(() => {
    // Only auto-select if the user hasn't manually switched tabs yet.
    setActiveTab((current) => {
      // If the user already made a deliberate choice, respect it.
      if (current !== "demo") return current;
      if (isMobile) return "mobile";
      if (isFreighterAvailable) return "freighter";
      return "demo";
    });
  }, [isMobile, isFreighterAvailable]);
  const [addressInput, setAddressInput] = useState("");
  const [secretInput, setSecretInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  if (!open) return null;

  async function handleFreighterConnect() {
    setLocalError(null);
    try {
      await connect();
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Freighter connection failed.");
    }
  }

  async function handleMobileFreighterConnect() {
    setLocalError(null);
    try {
      await connectMobileFreighter();
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Mobile Freighter connection failed.");
    }
  }

  async function handleDemoConnect() {
    setLocalError(null);
    try {
      await connectTestnetDemo();
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to create demo testnet wallet.");
    }
  }

  async function handleManualConnect(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    try {
      await connectManual(addressInput, secretInput || undefined);
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Invalid address.");
    }
  }

  const tabs: { id: Tab; label: string; mobileOnly?: boolean }[] = [
    { id: "mobile",   label: "Freighter Mobile" },
    { id: "freighter",label: "Extension" },
    { id: "demo",     label: "Testnet Demo" },
    { id: "manual",   label: "Enter Address" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal — full-width sheet on mobile, card on desktop */}
      <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xl">
        {/* Drag handle — mobile only */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden" />

        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Connect Stellar Wallet</h2>
              <p className="text-xs text-muted-foreground">
                {isMobile ? "Mobile & desktop compatible" : "Desktop & mobile compatible"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab bar — scrollable on small screens */}
        <div className="mt-4 flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/30 p-1 text-xs font-medium scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-md px-3 py-2 text-center transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-4">

          {/* ── Freighter Mobile (SEP-0007 deep link) ── */}
          {activeTab === "mobile" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3.5 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-violet-500" />
                  Freighter Mobile App
                </p>
                <p>
                  Opens the <strong>Freighter mobile app</strong> via a secure deep link. Approve
                  the connection in Freighter — your public address is shared back automatically.
                </p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Tap <strong>Connect with Freighter Mobile</strong> below</li>
                  <li>Approve in the Freighter app</li>
                  <li>You&apos;ll be returned here automatically</li>
                </ol>
                <p className="text-[10px] text-muted-foreground/70">
                  Don&apos;t have Freighter?{" "}
                  <a
                    href="https://freighter.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 underline hover:text-foreground"
                  >
                    Download at freighter.app <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>

              <Button
                type="button"
                onClick={handleMobileFreighterConnect}
                disabled={isConnecting}
                className="w-full h-11 gap-2"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Waiting for Freighter…
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4" />
                    Connect with Freighter Mobile
                  </>
                )}
              </Button>

              {isConnecting && (
                <p className="text-center text-[11px] text-muted-foreground">
                  Approve the connection in the Freighter app, then return here.
                </p>
              )}
            </div>
          )}

          {/* ── Freighter Desktop Extension ── */}
          {activeTab === "freighter" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-xs text-muted-foreground">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <MonitorSmartphone className="h-4 w-4" />
                    Freighter Browser Extension
                  </span>
                  {isFreighterAvailable ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3 w-3" /> Detected
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      Not detected
                    </span>
                  )}
                </div>
                <p>Connect via the Freighter browser extension installed in Chrome, Brave, or Edge.</p>
                {!isFreighterAvailable && (
                  <a
                    href="https://www.freighter.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 underline text-primary hover:text-primary/80 text-[11px]"
                  >
                    Install Freighter extension <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Button
                type="button"
                onClick={handleFreighterConnect}
                disabled={isConnecting || !isFreighterAvailable}
                className="w-full h-11 gap-2"
              >
                {isConnecting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</>
                ) : (
                  "Connect Freighter Extension"
                )}
              </Button>
              {!isFreighterAvailable && (
                <p className="text-center text-[11px] text-muted-foreground">
                  On mobile? Use <button type="button" className="underline text-primary" onClick={() => setActiveTab("mobile")}>Freighter Mobile</button> instead.
                </p>
              )}
            </div>
          )}

          {/* ── Testnet Demo ── */}
          {activeTab === "demo" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-primary flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> Instant testnet wallet
                </p>
                <p>
                  Generates a fresh Stellar keypair, funds it with 10,000 test XLM via Friendbot,
                  and enables full agent planning and autonomous on-chain execution — no extension needed.
                </p>
                <p className="text-[10px] text-muted-foreground/70">
                  Works on any device. Ideal for trying Autopayze without a real wallet.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleDemoConnect}
                disabled={isConnecting}
                className="w-full gap-2 h-11"
              >
                {isConnecting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating & funding wallet…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate Testnet Wallet</>
                )}
              </Button>
            </div>
          )}

          {/* ── Enter Address Manually ── */}
          {activeTab === "manual" && (
            <form onSubmit={handleManualConnect} className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
                  <KeyRound className="h-3.5 w-3.5" /> Paste your public address
                </p>
                Optionally provide your secret key to enable transaction signing and automated scheduled execution.
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Stellar Public Key <span className="text-muted-foreground/60">(starts with G)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="GCVK5Z..."
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-border bg-input px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                  <span>Secret Key <span className="font-normal text-muted-foreground/60">(optional — for signing)</span></span>
                  <span className="text-[10px]">Starts with S</span>
                </label>
                <input
                  type="password"
                  placeholder="S... (stored only in your session)"
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-border bg-input px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={isConnecting || !addressInput.trim()}
                className="w-full h-10"
              >
                {isConnecting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</>
                ) : (
                  "Connect Address"
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Error */}
        {(localError || error) && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{localError || error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

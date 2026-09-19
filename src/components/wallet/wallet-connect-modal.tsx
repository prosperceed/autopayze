"use client";

import { useState } from "react";
import {
  Wallet,
  Sparkles,
  Smartphone,
  ExternalLink,
  X,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/providers/wallet-provider";

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
    isFreighterAvailable,
    isConnecting,
    error,
  } = useWallet();

  const [activeTab, setActiveTab] = useState<"freighter" | "demo" | "manual">("demo");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Connect Stellar Wallet</h2>
              <p className="text-xs text-muted-foreground">Mobile view & desktop compatible</p>
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

        {/* Tab Selection */}
        <div className="mt-4 grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted/30 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("demo")}
            className={`rounded-md py-2 text-center transition-all ${
              activeTab === "demo"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center justify-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Testnet Demo
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("freighter")}
            className={`rounded-md py-2 text-center transition-all ${
              activeTab === "freighter"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Freighter
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`rounded-md py-2 text-center transition-all ${
              activeTab === "manual"
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Enter Address
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === "demo" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground">
                <p className="font-medium text-primary mb-1 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4" /> Recommended for mobile view
                </p>
                Generates a testnet keypair, funds it with 10,000 test XLM via Stellar Friendbot, and enables full agent planning and automated on-chain execution.
              </div>
              <Button
                type="button"
                onClick={handleDemoConnect}
                disabled={isConnecting}
                className="w-full gap-2 h-11"
              >
                <Sparkles className="h-4 w-4" />
                {isConnecting ? "Creating & funding testnet wallet..." : "Generate & Connect Testnet Wallet"}
              </Button>
            </div>
          )}

          {activeTab === "freighter" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-xs text-muted-foreground">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground">Freighter Extension</span>
                  {isFreighterAvailable ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3 w-3" /> Detected
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      Not detected on mobile/browser
                    </span>
                  )}
                </div>
                Connect your official desktop Freighter browser extension.
              </div>
              <Button
                type="button"
                onClick={handleFreighterConnect}
                disabled={isConnecting}
                className="w-full h-11"
              >
                {isConnecting ? "Connecting to Freighter..." : "Connect Freighter Wallet"}
              </Button>
            </div>
          )}

          {activeTab === "manual" && (
            <form onSubmit={handleManualConnect} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Stellar Public Key (starts with G)
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
                  <span>Secret Key (Optional for signing)</span>
                  <span className="text-[10px] text-muted-foreground">Starts with S</span>
                </label>
                <input
                  type="password"
                  placeholder="S... (kept only in your browser session)"
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
                {isConnecting ? "Connecting..." : "Connect Address"}
              </Button>
            </form>
          )}
        </div>

        {/* Error Notification */}
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


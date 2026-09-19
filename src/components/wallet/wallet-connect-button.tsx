"use client";

import { useState } from "react";
import { Wallet, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/providers/wallet-provider";
import { WalletConnectModal } from "./wallet-connect-modal";

export function WalletConnectButton({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { isConnected, connection, disconnect } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);

  const formattedAddress = connection?.address
    ? `${connection.address.slice(0, 4)}...${connection.address.slice(-4)}`
    : "";

  return (
    <>
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {isConnected ? (
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono">{formattedAddress}</span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase">
              {connection?.walletType === "TestnetDemo" ? "Demo" : connection?.walletType ?? "Wallet"}
            </span>
            <button
              type="button"
              onClick={disconnect}
              aria-label="Disconnect wallet"
              title="Disconnect wallet"
              className="ml-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <XCircle className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <Button
            variant={variant}
            size={size}
            onClick={() => setModalOpen(true)}
            className="gap-1.5"
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Connect wallet</span>
          </Button>
        )}
      </div>

      <WalletConnectModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

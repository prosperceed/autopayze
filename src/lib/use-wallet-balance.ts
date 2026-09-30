"use client";

import { useEffect, useRef, useState } from "react";
import { getHorizonClient } from "@/lib/stellar/client";
import type { StellarNetwork } from "@/lib/stellar/client";

export type WalletBalance = {
  asset: string;
  balance: string;
  assetCode: string;
};

export type UseWalletBalanceResult = {
  balances: WalletBalance[];
  xlmBalance: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
};

const POLL_INTERVAL_MS = 30_000;

export function useWalletBalance(
  address: string | null,
  network: string | null,
): UseWalletBalanceResult {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // stable ref so the interval closure always calls the latest fetch
  const fetchRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (!address || !network) {
      setBalances([]);
      setError(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      try {
        const horizon = getHorizonClient(network as StellarNetwork);
        const account = await horizon.loadAccount(address);
        const mapped: WalletBalance[] = account.balances.map((b) => {
          const assetCode = b.asset_type === "native" ? "XLM" : (b as { asset_code: string }).asset_code;
          return {
            asset: b.asset_type === "native" ? "native" : assetCode,
            assetCode,
            balance: parseFloat(b.balance).toFixed(2),
          };
        });
        setBalances(mapped);
        setError(null);
        setLastUpdated(new Date());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch balance");
      } finally {
        setLoading(false);
      }
    };

    fetchRef.current = fetch;
    fetch();

    timerRef.current = setInterval(() => fetchRef.current(), POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [address, network]);

  const xlmBalance = balances.find((b) => b.asset === "native")?.balance ?? null;

  return {
    balances,
    xlmBalance,
    loading,
    error,
    lastUpdated,
    refresh: () => fetchRef.current(),
  };
}

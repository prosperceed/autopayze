import type { StellarNetwork } from './client';

export const SUPPORTED_STELLAR_NETWORKS = ['stellar-testnet', 'stellar-mainnet'] as const;

export type SupportedStellarNetwork = (typeof SUPPORTED_STELLAR_NETWORKS)[number];

export function getConfiguredNetwork(): SupportedStellarNetwork {
  const value = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? 'stellar-testnet';
  return SUPPORTED_STELLAR_NETWORKS.includes(value as SupportedStellarNetwork)
    ? (value as SupportedStellarNetwork)
    : 'stellar-testnet';
}

export function isExpectedNetwork(network: string | undefined): boolean {
  return network === getConfiguredNetwork();
}

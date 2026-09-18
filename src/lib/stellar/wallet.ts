import { Account, Horizon, Networks, StrKey } from '@stellar/stellar-sdk';
import { getHorizonClient, type StellarNetwork } from './client';

export type WalletConnectionState = 'disconnected' | 'connecting' | 'connected' | 'wrong-network' | 'error';

export type WalletProfile = {
  address: string;
  network: StellarNetwork;
  walletType: string;
  connectedAt: string;
};

export async function fetchAccountInfo(address: string, network: StellarNetwork) {
  if (!StrKey.isValidEd25519PublicKey(address)) {
    throw new Error('Invalid Stellar address');
  }

  const horizon = getHorizonClient(network);
  const account = await horizon.loadAccount(address);

  return {
    address,
    sequence: account.sequence,
    balances: account.balances,
    network,
  };
}

export function normalizeWalletAddress(address: string): string {
  return address.trim();
}

export function detectWalletNetwork(network: string | undefined): StellarNetwork | null {
  if (!network) return null;
  const normalized = network.trim().toLowerCase();
  if (normalized === 'testnet' || normalized === 'stellar-testnet') return 'stellar-testnet';
  if (normalized === 'public' || normalized === 'mainnet' || normalized === 'stellar-mainnet') return 'stellar-mainnet';
  return null;
}

export function isWalletAddressValid(address: string): boolean {
  return StrKey.isValidEd25519PublicKey(address.trim());
}

export function getWalletWarning(network: string | undefined, expected: StellarNetwork): string | null {
  return network && network !== expected ? 'Wallet is connected to the wrong network.' : null;
}

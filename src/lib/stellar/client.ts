import { Horizon, Networks } from '@stellar/stellar-sdk';

export type StellarNetwork = 'stellar-testnet' | 'stellar-mainnet';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export function getNetworkConfig(network: StellarNetwork) {
  const passphrases: Record<StellarNetwork, string> = {
    'stellar-testnet': Networks.TESTNET,
    'stellar-mainnet': Networks.PUBLIC,
  };

  return {
    networkPassphrase: passphrases[network],
    horizonUrl: requireEnv('NEXT_PUBLIC_STELLAR_HORIZON_URL'),
    rpcUrl: requireEnv('NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL'),
  };
}

export function getHorizonClient(network: StellarNetwork) {
  const { horizonUrl } = getNetworkConfig(network);
  return new Horizon.Server(horizonUrl, { allowHttp: false, appName: 'Autopayze' });
}

export const DEFAULT_STELLAR_NETWORK: StellarNetwork = 'stellar-testnet';

import { Horizon, Networks } from '@stellar/stellar-sdk';

export type StellarNetwork = 'stellar-testnet' | 'stellar-mainnet';

export function getNetworkConfig(network: StellarNetwork) {
  const config = {
    'stellar-testnet': {
      networkPassphrase: Networks.TESTNET,
      horizonUrl: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ?? 'https://horizon-testnet.stellar.org',
      rpcUrl: process.env.NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org',
    },
    'stellar-mainnet': {
      networkPassphrase: Networks.PUBLIC,
      horizonUrl: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ?? 'https://horizon.stellar.org',
      rpcUrl: process.env.NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL ?? 'https://soroban.stellar.org',
    },
  } satisfies Record<StellarNetwork, { networkPassphrase: string; horizonUrl: string; rpcUrl: string }>;

  return config[network];
}

export function getHorizonClient(network: StellarNetwork) {
  const { horizonUrl, networkPassphrase } = getNetworkConfig(network);
  return new Horizon.Server(horizonUrl, { allowHttp: false, appName: 'Autopayze' });
}

export const DEFAULT_STELLAR_NETWORK: StellarNetwork = 'stellar-testnet';

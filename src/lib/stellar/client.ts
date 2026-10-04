import { Horizon, Networks } from '@stellar/stellar-sdk';

export type StellarNetwork = 'stellar-testnet' | 'stellar-mainnet';

// Next.js only statically inlines process.env.NEXT_PUBLIC_* when the key is
// written as a literal string. Using a dynamic key like process.env[key] is
// NOT inlined and will be undefined in the browser bundle. Always read these
// variables with literal property access.
function getHorizonUrl(): string {
  const value = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL;
  if (!value) throw new Error('Missing required environment variable: NEXT_PUBLIC_STELLAR_HORIZON_URL');
  return value;
}

function getSorobanRpcUrl(): string {
  const value = process.env.NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL;
  if (!value) throw new Error('Missing required environment variable: NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL');
  return value;
}

export function getNetworkConfig(network: StellarNetwork) {
  const passphrases: Record<StellarNetwork, string> = {
    'stellar-testnet': Networks.TESTNET,
    'stellar-mainnet': Networks.PUBLIC,
  };

  // networkPassphrase is derived from the static Networks enum — no env var
  // needed. horizonUrl and rpcUrl are lazy getters so callers that only need
  // the passphrase (e.g. TransactionBuilder in tests) do not pay the env-var
  // validation cost.
  return {
    networkPassphrase: passphrases[network],
    get horizonUrl() { return getHorizonUrl(); },
    get rpcUrl() { return getSorobanRpcUrl(); },
  };
}

export function getHorizonClient(network: StellarNetwork) {
  const horizonUrl = getHorizonUrl();
  // allowHttp must be true for plain http URLs (e.g. localhost), but false is
  // correct for the public Stellar Horizon endpoints which are always HTTPS.
  const allowHttp = horizonUrl.startsWith('http://');
  return new Horizon.Server(horizonUrl, { allowHttp, appName: 'Autopayze' });
}

export const DEFAULT_STELLAR_NETWORK: StellarNetwork = 'stellar-testnet';

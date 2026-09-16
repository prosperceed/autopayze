export class StellarWalletError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'StellarWalletError';
  }
}

export const stellarErrorMap = {
  walletUnavailable: 'A supported Stellar wallet is not available in this browser.',
  userRejectedConnection: 'The wallet connection request was rejected by the user.',
  wrongNetwork: 'The connected wallet is on the wrong network for this app.',
  invalidAddress: 'The wallet returned an invalid Stellar address.',
  accountNotFound: 'No Stellar account was found for this address.',
  rpcUnavailable: 'The Stellar network RPC is temporarily unavailable.',
  timeout: 'The network request timed out.',
} as const;

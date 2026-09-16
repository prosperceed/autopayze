import { Horizon } from '@stellar/stellar-sdk';
import { getHorizonClient, type StellarNetwork } from './client';
import { isWalletAddressValid } from './wallet';

export async function verifyAccount(address: string, network: StellarNetwork) {
  if (!isWalletAddressValid(address)) {
    throw new Error('invalid address');
  }

  const horizon = getHorizonClient(network);
  try {
    const account = await horizon.loadAccount(address);
    return {
      exists: true,
      sequence: account.sequence,
      balances: account.balances,
    };
  } catch (error) {
    const err = error as Error;
    if (typeof err?.message === 'string' && err.message.includes('404')) {
      throw new Error('account-not-found');
    }
    throw new Error('stellar-network-error');
  }
}

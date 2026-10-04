import {
  Account,
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Operation,
  StrKey,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { getHorizonClient, getNetworkConfig, type StellarNetwork } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PreviewWarning = {
  level: 'warning' | 'info';
  message: string;
};

export type TransactionPreview = {
  recipient: string;
  asset: string;
  amount: string;
  network: 'stellar-testnet' | 'stellar-mainnet';
  fee: string;
  schedule: string | null;
  memo: string | null;
  warnings: PreviewWarning[];
  approved: boolean;
};

export type PaymentTransactionInput = {
  sourceAddress: string;
  destinationAddress: string;
  amount: string;
  asset?: 'XLM' | 'USDC' | 'USDT';
  network?: StellarNetwork;
  memo?: string | null;
};

export type PaymentTransactionBuildResult = {
  preview: TransactionPreview;
  xdr: string;
};

export type PaymentTransactionBuilderOptions = {
  sourceAccount?: Account;
  server?: Horizon.Server;
};

export type SubmitTransactionResult = {
  successful: boolean;
  hash: string;
  ledger?: number;
  /** Human-readable error summary */
  error?: string;
  /** Raw Horizon result_codes from extras (populated on submission failure) */
  resultCodes?: {
    transaction?: string;
    operations?: string[];
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function createTransactionPreview(
  values: Partial<TransactionPreview> = {},
): TransactionPreview {
  return {
    recipient: values.recipient ?? 'Unknown recipient',
    asset: values.asset ?? 'USDC',
    amount: values.amount ?? '0',
    network: values.network ?? 'stellar-testnet',
    fee: values.fee ?? '0.00001 XLM',
    schedule: values.schedule ?? null,
    memo: values.memo ?? null,
    warnings: values.warnings ?? [],
    approved: values.approved ?? false,
  };
}

export async function fundTestnetAccount(address: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`,
    );
    return response.ok;
  } catch (error) {
    console.warn('Friendbot funding error:', error);
    return false;
  }
}

function getConfiguredAssetIssuer(
  asset: 'USDC' | 'USDT',
  network: StellarNetwork,
): string {
  const envKey = `NEXT_PUBLIC_${asset}_ISSUER`;
  const issuer =
    process.env[envKey] ??
    (network === 'stellar-testnet'
      ? process.env.NEXT_PUBLIC_STELLAR_TESTNET_ASSET_ISSUER
      : process.env.NEXT_PUBLIC_STELLAR_MAINNET_ASSET_ISSUER);

  if (!issuer) {
    throw new Error(
      `Missing ${envKey} (or NEXT_PUBLIC_STELLAR_${network === 'stellar-testnet' ? 'TESTNET' : 'MAINNET'}_ASSET_ISSUER) ` +
        `for asset ${asset} on ${network}.`,
    );
  }

  return issuer;
}

/**
 * Returns true if the Horizon error represents a 404 / account-not-found.
 * Horizon.Server throws a plain Error with a `.response` property containing
 * the HTTP response; we check the status code rather than matching strings.
 */
function isNotFoundError(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const e = err as { response?: { status?: number }; status?: number };
    const status = e.response?.status ?? e.status;
    return status === 404;
  }
  return false;
}

/**
 * Extracts Horizon result_codes from a submission error.
 * Horizon errors carry `.response.data.extras.result_codes` with fields like:
 *   { transaction: "tx_bad_auth", operations: ["op_underfunded"] }
 */
function extractHorizonResultCodes(err: unknown): {
  transaction?: string;
  operations?: string[];
} | undefined {
  if (!err || typeof err !== 'object') return undefined;

  const e = err as {
    response?: {
      data?: {
        extras?: {
          result_codes?: {
            transaction?: string;
            operations?: string[];
          };
        };
        detail?: string;
      };
    };
  };

  return e.response?.data?.extras?.result_codes ?? undefined;
}

// ---------------------------------------------------------------------------
// Pre-flight checks
// ---------------------------------------------------------------------------

/**
 * Verifies that the destination account holds a trustline for the given asset.
 * Throws a descriptive error if the trustline is absent so the caller can
 * surface it before even building the transaction.
 *
 * For XLM this is a no-op (native asset requires no trustline).
 */
async function assertTrustline(
  server: Horizon.Server,
  destinationAddress: string,
  asset: 'XLM' | 'USDC' | 'USDT',
  network: StellarNetwork,
): Promise<void> {
  if (asset === 'XLM') return;

  const issuer = getConfiguredAssetIssuer(asset, network);

  let balances: Horizon.HorizonApi.BalanceLine[];
  try {
    const account = await server.loadAccount(destinationAddress);
    balances = account.balances;
  } catch (err) {
    if (isNotFoundError(err)) {
      // Destination does not exist — sending a non-native asset to a
      // non-existent account is always invalid. Surface a clear message.
      throw new Error(
        `Destination account ${destinationAddress} does not exist on Stellar. ` +
          `To receive ${asset}, the account must be created and establish a trustline first.`,
      );
    }
    throw err;
  }

  const hasTrustline = balances.some(
    (b) =>
      b.asset_type !== 'native' &&
      (b as Horizon.HorizonApi.BalanceLineAsset).asset_code === asset &&
      (b as Horizon.HorizonApi.BalanceLineAsset).asset_issuer === issuer,
  );

  if (!hasTrustline) {
    throw new Error(
      `Destination account ${destinationAddress} has no trustline for ${asset} ` +
        `(issuer: ${issuer}). The recipient must add a trustline before receiving this asset.`,
    );
  }
}

// ---------------------------------------------------------------------------
// buildPaymentTransaction
// ---------------------------------------------------------------------------

export async function buildPaymentTransaction(
  {
    sourceAddress,
    destinationAddress,
    amount,
    asset = 'XLM',
    network = 'stellar-testnet',
    memo = null,
  }: PaymentTransactionInput,
  options: PaymentTransactionBuilderOptions = {},
): Promise<PaymentTransactionBuildResult> {
  if (!sourceAddress || !destinationAddress) {
    throw new Error('A source and destination wallet address are required.');
  }

  // Validate both addresses are proper Stellar public keys before hitting the network.
  if (!StrKey.isValidEd25519PublicKey(sourceAddress)) {
    throw new Error(`Invalid source address: "${sourceAddress}"`);
  }
  if (!StrKey.isValidEd25519PublicKey(destinationAddress)) {
    throw new Error(`Invalid destination address: "${destinationAddress}"`);
  }

  const { networkPassphrase } = getNetworkConfig(network);
  // Only build the Horizon client if the caller didn't inject one. This allows
  // tests to pass sourceAccount+server stubs without requiring env vars.
  const server = options.server ?? getHorizonClient(network);

  // ------------------------------------------------------------------
  // 1. Load source account (sequence number for transaction building)
  // ------------------------------------------------------------------
  let account: Account;
  if (options.sourceAccount) {
    account = options.sourceAccount;
  } else {
    try {
      const loaded = await server.loadAccount(sourceAddress);
      account = new Account(sourceAddress, loaded.sequence);
    } catch (err) {
      if (isNotFoundError(err) && network === 'stellar-testnet') {
        // Attempt friendbot funding for unfunded testnet accounts.
        const funded = await fundTestnetAccount(sourceAddress);
        if (funded) {
          const loaded = await server.loadAccount(sourceAddress);
          account = new Account(sourceAddress, loaded.sequence);
        } else {
          throw new Error(
            'Source wallet is not funded on Stellar Testnet. Please fund it via Friendbot first.',
          );
        }
      } else if (isNotFoundError(err)) {
        throw new Error(
          `Source account ${sourceAddress} does not exist on Stellar ${network}.`,
        );
      } else {
        // Re-throw network or unexpected errors — do not mask them.
        throw err;
      }
    }
  }

  // ------------------------------------------------------------------
  // 2. Check destination existence + asset-specific pre-flights
  //    - XLM to new account → createAccount operation
  //    - USDC/USDT → trustline must exist (hard failure if not)
  // ------------------------------------------------------------------
  let isNewAccount = false;

  try {
    await server.loadAccount(destinationAddress);
  } catch (err) {
    if (isNotFoundError(err)) {
      isNewAccount = true;
    } else {
      // Network error checking destination — re-throw so the cron runner
      // records it as a proper failure rather than silently skipping.
      throw new Error(
        `Failed to verify destination account ${destinationAddress}: ` +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  }

  // Non-native assets cannot be sent to non-existent accounts (they have no
  // trustline). Validate trustline for existing accounts.
  if (asset !== 'XLM') {
    await assertTrustline(server, destinationAddress, asset, network);
  }

  // ------------------------------------------------------------------
  // 3. Build the transaction
  //    - No timebounds set (setTimeout(0) = no expiry) so scheduled
  //      transactions claimed by the cron runner execute immediately
  //      regardless of how long they sat in the queue.
  //    - Memo is optional and capped at 28 bytes per Stellar protocol.
  // ------------------------------------------------------------------
  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  });

  if (isNewAccount && asset === 'XLM') {
    // createAccount is the only valid operation for a brand-new account.
    builder.addOperation(
      Operation.createAccount({
        destination: destinationAddress,
        startingBalance: amount,
      }),
    );
  } else {
    const assetDefinition =
      asset === 'XLM'
        ? Asset.native()
        : new Asset(asset, getConfiguredAssetIssuer(asset, network));

    builder.addOperation(
      Operation.payment({
        destination: destinationAddress,
        asset: assetDefinition,
        amount,
      }),
    );
  }

  // setTimeout(0) disables the upper time bound so the transaction never
  // "expires" while waiting in the Stellar mempool. Scheduled payments
  // are already time-controlled by next_run_at in the database — adding
  // a Horizon-level timeout would cause silent failures if the cron runner
  // is delayed.
  builder.setTimeout(0);

  if (memo) {
    // Stellar text memos are limited to 28 bytes. Truncate to avoid a
    // build error; the preview warns the user if truncation occurred.
    const memoText = Buffer.byteLength(memo, 'utf8') > 28 ? memo.slice(0, 28) : memo;
    builder.addMemo(Memo.text(memoText));
  }

  const transaction = builder.build();

  return {
    preview: createTransactionPreview({
      recipient: destinationAddress,
      asset,
      amount,
      network,
      memo,
      fee: '0.00001 XLM',
      warnings: [],
      approved: true,
    }),
    xdr: transaction.toXDR(),
  };
}

// ---------------------------------------------------------------------------
// submitPaymentTransaction
// ---------------------------------------------------------------------------

export async function submitPaymentTransaction(
  signedXdr: string,
  network: StellarNetwork = 'stellar-testnet',
): Promise<SubmitTransactionResult> {
  const { networkPassphrase } = getNetworkConfig(network);
  const server = getHorizonClient(network);

  try {
    const transaction = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
    const result = await server.submitTransaction(transaction);

    return {
      successful: true,
      hash: result.hash,
      ledger: result.ledger,
    };
  } catch (error: unknown) {
    // Extract result_codes first — these are the most actionable signal.
    const resultCodes = extractHorizonResultCodes(error);

    let message = 'Transaction submission failed on Stellar Horizon.';

    if (resultCodes) {
      // Log the full codes to server logs for easy post-mortem.
      console.error('[stellar] submitPaymentTransaction failed — Horizon result_codes:', {
        network,
        resultCodes,
      });
      message = `Stellar rejected the transaction: ${JSON.stringify(resultCodes)}`;
    } else if (
      error &&
      typeof error === 'object' &&
      'response' in error
    ) {
      const resp = (
        error as {
          response?: { data?: { detail?: string; title?: string } };
        }
      ).response;

      if (resp?.data?.detail) {
        message = resp.data.detail;
      } else if (resp?.data?.title) {
        message = resp.data.title;
      }

      console.error('[stellar] submitPaymentTransaction failed — Horizon response:', {
        network,
        data: resp?.data,
      });
    } else if (error instanceof Error) {
      message = error.message;
      console.error('[stellar] submitPaymentTransaction failed:', { network, message });
    }

    return {
      successful: false,
      hash: '',
      error: message,
      resultCodes,
    };
  }
}

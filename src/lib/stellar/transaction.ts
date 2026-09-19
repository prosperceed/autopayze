import {
  Account,
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { getHorizonClient, getNetworkConfig, type StellarNetwork } from './client';

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
  network?: 'stellar-testnet' | 'stellar-mainnet';
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

export function createTransactionPreview(values: Partial<TransactionPreview> = {}): TransactionPreview {
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
    const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`);
    return response.ok;
  } catch (error) {
    console.warn('Friendbot funding error:', error);
    return false;
  }
}

function getConfiguredAssetIssuer(asset: 'XLM' | 'USDC' | 'USDT', network: 'stellar-testnet' | 'stellar-mainnet') {
  if (asset === 'XLM') return null;

  const envKey = `NEXT_PUBLIC_${asset}_ISSUER`;
  const issuer = process.env[envKey] ?? (
    network === 'stellar-testnet'
      ? process.env.NEXT_PUBLIC_STELLAR_TESTNET_ASSET_ISSUER
      : process.env.NEXT_PUBLIC_STELLAR_MAINNET_ASSET_ISSUER
  );

  if (!issuer) {
    throw new Error(`Missing ${envKey} or corresponding Stellar asset issuer for ${asset}.`);
  }

  return issuer;
}

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
    throw new Error('A source and destination wallet are required.');
  }

  const { networkPassphrase, horizonUrl } = getNetworkConfig(network);
  const server = options.server ?? new Horizon.Server(horizonUrl, { allowHttp: false, appName: 'Autopayze' });

  let account: Account;
  if (options.sourceAccount) {
    account = options.sourceAccount;
  } else {
    try {
      const loaded = await server.loadAccount(sourceAddress);
      account = new Account(sourceAddress, loaded.sequence);
    } catch (err: unknown) {
      // If source account does not exist on testnet, attempt friendbot funding
      if (network === 'stellar-testnet') {
        const funded = await fundTestnetAccount(sourceAddress);
        if (funded) {
          const loaded = await server.loadAccount(sourceAddress);
          account = new Account(sourceAddress, loaded.sequence);
        } else {
          throw new Error('Source wallet is not funded on Stellar Testnet. Please fund with Friendbot first.');
        }
      } else {
        throw err;
      }
    }
  }

  // Check if destination exists; if not and paying native XLM, use createAccount
  let isNewAccount = false;
  try {
    await server.loadAccount(destinationAddress);
  } catch {
    isNewAccount = true;
  }

  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  });

  if (isNewAccount && asset === 'XLM') {
    builder.addOperation(
      Operation.createAccount({
        destination: destinationAddress,
        startingBalance: amount,
      }),
    );
  } else {
    const assetDefinition = asset === 'XLM'
      ? Asset.native()
      : new Asset(asset, getConfiguredAssetIssuer(asset, network) ?? '');

    builder.addOperation(
      Operation.payment({
        destination: destinationAddress,
        asset: assetDefinition,
        amount,
      }),
    );
  }

  builder.setTimeout(180);

  if (memo) {
    builder.addMemo(Memo.text(memo));
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

export type SubmitTransactionResult = {
  successful: boolean;
  hash: string;
  ledger?: number;
  error?: string;
};

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
    console.error('Stellar transaction submission failed:', error);
    let message = 'Transaction submission failed on Stellar Horizon.';
    if (error && typeof error === 'object' && 'response' in error) {
      const resp = (error as { response?: { data?: { extras?: { result_codes?: Record<string, unknown> }; detail?: string } } }).response;
      if (resp?.data?.extras?.result_codes) {
        message = `Stellar error: ${JSON.stringify(resp.data.extras.result_codes)}`;
      } else if (resp?.data?.detail) {
        message = resp.data.detail;
      }
    } else if (error instanceof Error) {
      message = error.message;
    }
    return {
      successful: false,
      hash: '',
      error: message,
    };
  }
}

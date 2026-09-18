import {
  Account,
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import { getNetworkConfig } from './client';

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
  const account = options.sourceAccount ?? (await server.loadAccount(sourceAddress));
  const assetDefinition = asset === 'XLM'
    ? Asset.native()
    : new Asset(asset, getConfiguredAssetIssuer(asset, network) ?? '');

  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: destinationAddress,
        asset: assetDefinition,
        amount,
      }),
    )
    .setTimeout(180);

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

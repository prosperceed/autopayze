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

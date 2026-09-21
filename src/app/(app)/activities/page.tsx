import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { requireUser } from '@/lib/auth';
import { Activity as ActivityIcon, ExternalLink, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

interface Transaction {
  id: string;
  created_at: string;
  amount: string;
  asset: string;
  recipient: string;
  status: string;
  tx_hash: string | null;
}

export default async function ActivitiesPage() {
  const user = await requireUser();

  const supabase = createClient();
  const { data, error } = await supabase
    .from('agent_transactions')
    .select('id, created_at, amount, asset, recipient, status, tx_hash')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const transactions: Transaction[] = data as Transaction[];

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          Activities
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          All transaction activity recorded on Supabase.
        </p>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-5">
          <CardTitle className="text-sm sm:text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-5 pt-0">
          {error && (
            <p className="text-xs sm:text-sm text-destructive mb-4">
              Failed to load transactions.
            </p>
          )}
          {!transactions || transactions.length === 0 ? (
            <EmptyState
              icon={ActivityIcon}
              title="No activity yet"
              description="Connect a wallet and perform transactions to see activity here."
            />
          ) : (
            <div className="space-y-2">
              <div className="hidden sm:grid sm:grid-cols-5 gap-2 pb-3 border-b border-border/50 text-xs font-semibold text-muted-foreground">
                <div>Amount</div>
                <div>Recipient</div>
                <div>Date</div>
                <div>Status</div>
                <div>Action</div>
              </div>
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex flex-col sm:grid sm:grid-cols-5 gap-2 sm:gap-2 p-2.5 sm:p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between sm:block">
                      <span className="text-xs sm:hidden font-medium text-muted-foreground">Amount</span>
                      <span className="font-semibold text-xs sm:text-sm text-foreground">
                        {tx.amount} {tx.asset}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:block">
                      <span className="text-xs sm:hidden font-medium text-muted-foreground">Recipient</span>
                      <span className="font-mono text-[10px] sm:text-xs text-muted-foreground truncate">
                        {tx.recipient?.slice(0, 6)}...{tx.recipient?.slice(-4)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:block">
                      <span className="text-xs sm:hidden font-medium text-muted-foreground">Date</span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:block">
                      <span className="text-xs sm:hidden font-medium text-muted-foreground">Status</span>
                      <span
                        className={`px-2 py-1 rounded text-[9px] sm:text-xs font-medium whitespace-nowrap w-fit sm:w-auto ${
                          tx.status === 'accepted'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : tx.status === 'executed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-start">
                      {tx.tx_hash ? (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
                        >
                          <span className="hidden sm:inline">View</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


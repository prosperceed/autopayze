import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { requireUser } from '@/lib/auth';
import { Activity as ActivityIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

interface Transaction {
  id: string;
  created_at: string;
  amount: string;
  asset: string;
  destination: string;
  status: string;
  tx_hash: string | null;
}

export default async function ActivitiesPage() {
  const user = await requireUser();

  const supabase = createClient();
  const { data, error } = await supabase
    .from('agent_transactions')
    .select('id, created_at, amount, asset, destination, status, tx_hash')
    .order('created_at', { ascending: false })
    .limit(50);

  const transactions: Transaction[] = data as Transaction[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Activities
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All transaction activity recorded on Supabase.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-destructive">
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
            <ul className="space-y-2">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {tx.amount} {tx.asset}
                  </span>
                  <span className="text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
                  <span
                    className={`px-2 py-0.5 rounded ${
                      tx.status === 'executed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {tx.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


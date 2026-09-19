'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('agent_transactions')
        .select('id, created_at, amount, asset, destination, status, tx_hash')
        .order('created_at', { ascending: false })
        .limit(5);
      if (!error && data) {
        setTransactions(data as Transaction[]);
      } else {
        console.error('Failed to fetch recent transactions', error);
        setTransactions([]);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent transactions.</p>;
  }

  return (
    <ul className="space-y-2">
      {transactions.map((tx) => (
        <li key={tx.id} className="flex items-center justify-between text-sm">
          <span className="font-medium">{tx.amount} {tx.asset}</span>
          <span className="text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
          <span className={`px-2 py-0.5 rounded ${tx.status === 'executed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {tx.status}
          </span>
        </li>
      ))}
    </ul>
  );
}


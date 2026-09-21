'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Transaction {
  id: string;
  created_at: string;
  amount: string;
  asset: string;
  recipient: string;
  status: string;
  tx_hash: string | null;
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('agent_transactions')
          .select('id, created_at, amount, asset, recipient, status, tx_hash')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (fetchError) {
          console.error('Failed to fetch recent transactions', fetchError);
          setError('Failed to load transactions');
          setTransactions([]);
          return;
        }

        if (data) {
          setTransactions(data as Transaction[]);
        } else {
          setTransactions([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    // Set up real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel('agent_transactions_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_transactions',
        },
        (payload: any) => {
          // Re-fetch transactions when changes occur
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('agent_transactions')
        .select('id, created_at, amount, asset, recipient, status, tx_hash')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (fetchError) {
        setError('Failed to load transactions');
        setTransactions([]);
      } else if (data) {
        setTransactions(data as Transaction[]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return <p className="text-xs sm:text-sm text-muted-foreground">No recent transactions.</p>;
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {transactions.map((tx) => (
          <li
            key={tx.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 text-xs sm:text-sm p-2.5 sm:p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="font-medium truncate">
                {tx.amount} {tx.asset}
              </span>
              <span className="text-muted-foreground text-xs ml-2 shrink-0">
                {new Date(tx.created_at).toLocaleDateString()}
              </span>
            </div>
            <span
              className={`px-2 py-1 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                tx.status === 'accepted'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : tx.status === 'executed'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}
            >
              {tx.status}
            </span>
          </li>
        ))}
      </ul>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        className="w-full gap-2 text-xs mt-2"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Refresh
      </Button>
    </div>
  );
}


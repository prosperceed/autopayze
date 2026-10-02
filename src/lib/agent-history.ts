"use server";

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';

export type AgentHistoryInsert = {
  user_id: string;
  wallet_address: string;
  wallet_network: string;
  prompt_text: string;
  response_summary: string;
  action_type: 'payment' | 'schedule_payment' | 'airdrop';
  intent_payload: Record<string, unknown>;
  status: 'accepted' | 'review_required' | 'rejected';
  created_at?: string;
};

export type AgentTransactionInsert = {
  user_id: string;
  wallet_address: string;
  wallet_network: string;
  action_type: 'payment' | 'schedule_payment' | 'airdrop';
  prompt_text: string;
  summary: string;
  intent_payload: Record<string, unknown>;
  status: 'accepted' | 'review_required' | 'rejected' | 'executed' | 'failed';
  amount?: string | null;
  recipient?: string | null;
  asset?: string | null;
  memo?: string | null;
  tx_hash?: string | null;
  created_at?: string;
};

async function getDbClient() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createServerClient();
}

export async function savePromptHistory(entry: AgentHistoryInsert): Promise<{ id?: string; recorded: boolean; error?: string }> {
  try {
    const supabase = await getDbClient();
    const { data, error } = await supabase
      .from('agent_prompt_history')
      .insert(entry)
      .select('id')
      .maybeSingle();

    if (error) {
      console.warn('Could not save prompt history to Supabase:', error.message || error);
      return { recorded: false, error: error.message || 'Database insert failed' };
    }

    return { id: data?.id, recorded: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Exception while saving prompt history:', message);
    return { recorded: false, error: message };
  }
}

export async function saveTransactionHistory(entry: AgentTransactionInsert): Promise<{ id?: string; recorded: boolean; error?: string }> {
  try {
    const supabase = await getDbClient();
    const { data, error } = await supabase
      .from('agent_transactions')
      .insert(entry)
      .select('id')
      .maybeSingle();

    if (error) {
      console.warn('Could not save transaction history to Supabase:', error.message || error);
      return { recorded: false, error: error.message || 'Database insert failed' };
    }

    return { id: data?.id, recorded: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Exception while saving transaction history:', message);
    return { recorded: false, error: message };
  }
}

export async function updateTransactionStatus({
  transactionId,
  userId,
  status,
  txHash,
}: {
  transactionId?: string;
  userId: string;
  status: 'executed' | 'failed' | 'accepted' | 'rejected';
  txHash?: string;
}): Promise<{ updated: boolean; error?: string }> {
  // transactionId is required to safely update a specific row.
  // Without it we cannot determine which row to update, so we skip the DB write.
  if (!transactionId) {
    console.warn('updateTransactionStatus: no transactionId provided, skipping update');
    return { updated: false, error: 'No transactionId provided' };
  }

  try {
    const supabase = await getDbClient();
    const { error } = await supabase
      .from('agent_transactions')
      .update({
        status,
        ...(txHash ? { tx_hash: txHash } : {}),
      })
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (error) {
      console.warn('Could not update transaction status in Supabase:', error.message || error);
      return { updated: false, error: error.message };
    }

    return { updated: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Exception while updating transaction status:', message);
    return { updated: false, error: message };
  }
}

export async function getUserAgentHistory(userId: string) {
  try {
    const supabase = await getDbClient();
    const { data, error } = await supabase
      .from('agent_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return [];
    }

    return data || [];
  } catch {
    return [];
  }
}

"use server";

import { createAdminClient } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns the Supabase admin client (service role, bypasses RLS).
 * createAdminClient() throws with a descriptive message when SUPABASE_SERVICE_ROLE_KEY
 * or NEXT_PUBLIC_SUPABASE_URL are absent — no null-guard needed here.
 */
function getDbClient() {
  return createAdminClient();
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Guards against a Stellar public key (56-char 'G...' string) accidentally
 * landing in the user_id column (which is typed uuid in Postgres). This would
 * produce "invalid input syntax for type uuid" and a 500 from Supabase.
 *
 * The root cause can be a mis-destructured request body in the API route
 * (e.g. body.wallet.address bleeding into user_id). Fail loudly here so the
 * call-site error is actionable rather than a cryptic DB constraint violation.
 */
function assertUuid(value: string, fieldName: string): void {
  if (!UUID_RE.test(value)) {
    throw new Error(
      `agent-history: "${fieldName}" must be a UUID but received "${value}". ` +
        `A Stellar wallet address was likely passed where the authenticated user ID was expected. ` +
        `Ensure user.id (from supabase.auth.getUser()) is used, not wallet_address.`,
    );
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function savePromptHistory(
  entry: AgentHistoryInsert,
): Promise<{ id?: string; recorded: boolean; error?: string }> {
  try {
    // Catch field-mapping mistakes before they hit the database.
    assertUuid(entry.user_id, 'user_id');

    const supabase = getDbClient();
    const { data, error } = await supabase
      .from('agent_prompt_history')
      .insert(entry)
      .select('id')
      .maybeSingle();

    if (error) {
      console.warn('Could not save prompt history to Supabase:', {
        message: error.message,
        details: (error as { details?: string }).details ?? null,
        code: (error as { code?: string }).code ?? null,
      });
      return { recorded: false, error: error.message ?? 'Database insert failed' };
    }

    return { id: data?.id, recorded: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Exception while saving prompt history:', message);
    return { recorded: false, error: message };
  }
}

export async function saveTransactionHistory(
  entry: AgentTransactionInsert,
): Promise<{ id?: string; recorded: boolean; error?: string }> {
  try {
    // Catch field-mapping mistakes before they hit the database.
    assertUuid(entry.user_id, 'user_id');

    const supabase = getDbClient();
    const { data, error } = await supabase
      .from('agent_transactions')
      .insert(entry)
      .select('id')
      .maybeSingle();

    if (error) {
      console.warn('Could not save transaction history to Supabase:', {
        message: error.message,
        details: (error as { details?: string }).details ?? null,
        code: (error as { code?: string }).code ?? null,
      });
      return { recorded: false, error: error.message ?? 'Database insert failed' };
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
    assertUuid(userId, 'userId');

    const supabase = getDbClient();
    const { error } = await supabase
      .from('agent_transactions')
      .update({
        status,
        ...(txHash ? { tx_hash: txHash } : {}),
      })
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (error) {
      console.warn('Could not update transaction status in Supabase:', {
        message: error.message,
        details: (error as { details?: string }).details ?? null,
        code: (error as { code?: string }).code ?? null,
      });
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
    assertUuid(userId, 'userId');

    const supabase = getDbClient();
    const { data, error } = await supabase
      .from('agent_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return [];
    }

    return data ?? [];
  } catch {
    return [];
  }
}

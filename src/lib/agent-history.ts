import { createClient } from '@/lib/supabase/client';

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
  status: 'accepted' | 'review_required' | 'rejected';
  amount?: string | null;
  recipient?: string | null;
  asset?: string | null;
  memo?: string | null;
  created_at?: string;
};

export async function savePromptHistory(entry: AgentHistoryInsert) {
  const supabase = createClient();
  const { error } = await supabase.from('agent_prompt_history').insert(entry);
  if (error) throw error;
}

export async function saveTransactionHistory(entry: AgentTransactionInsert) {
  const supabase = createClient();
  const { error } = await supabase.from('agent_transactions').insert(entry);
  if (error) throw error;
}

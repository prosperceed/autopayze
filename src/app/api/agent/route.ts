import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { GroqProvider } from '@/agents/providers/groq/provider';
import { savePromptHistory, saveTransactionHistory } from '@/lib/agent-history';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const user = await requireUser();
    const supabase = await createClient();
    const requestWallet = body?.wallet as { address?: string; network?: string } | undefined;
    const { data: walletData } = await supabase
      .from('wallets')
      .select('address, network')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    const resolvedWalletAddress = walletData?.address ?? requestWallet?.address;
    const resolvedWalletNetwork = walletData?.network ?? requestWallet?.network;

    if (!resolvedWalletAddress || !resolvedWalletNetwork) {
      return NextResponse.json(
        { error: 'A confirmed wallet connection is required before the agent can run.' },
        { status: 403 },
      );
    }

    const provider = new GroqProvider();
    const structured = await provider.generateStructuredIntent?.({
      prompt,
      userId: user.id,
      walletAddress: resolvedWalletAddress,
      network: resolvedWalletNetwork,
    });

    if (!structured) {
      return NextResponse.json({ error: 'Agent response was not produced.' }, { status: 500 });
    }

    const intent = structured.intent;
    const actionType = intent.action;
    const amount =
      'amount' in intent && typeof intent.amount === 'string' ? intent.amount : null;
    const recipient =
      'recipient' in intent && typeof intent.recipient === 'string' ? intent.recipient : null;
    const asset = 'asset' in intent && typeof intent.asset === 'string' ? intent.asset : null;
    const memo = 'memo' in intent && typeof intent.memo === 'string' ? intent.memo : null;

    const promptHistory = {
      user_id: user.id,
      wallet_address: resolvedWalletAddress,
      wallet_network: resolvedWalletNetwork,
      prompt_text: prompt,
      response_summary: structured.summary,
      action_type: actionType,
      intent_payload: intent,
      status: structured.status,
    };

    await savePromptHistory(promptHistory);

    await saveTransactionHistory({
      user_id: user.id,
      wallet_address: resolvedWalletAddress,
      wallet_network: resolvedWalletNetwork,
      action_type: actionType,
      prompt_text: prompt,
      summary: structured.summary,
      intent_payload: intent,
      status: structured.status,
      amount,
      recipient,
      asset,
      memo,
    });

    return NextResponse.json({
      ok: true,
      action: actionType,
      summary: structured.summary,
      status: structured.status,
      details: intent,
    });
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'The agent could not process your request.',
      },
      { status: 500 },
    );
  }
}

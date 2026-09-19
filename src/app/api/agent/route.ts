import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { GroqProvider } from '@/agents/providers/groq/provider';
import { savePromptHistory, saveTransactionHistory } from '@/lib/agent-history';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in before activating the agent.' },
        { status: 401 },
      );
    }

    const requestWallet = (body?.wallet ?? body) as { address?: string; network?: string } | undefined;
    let resolvedWalletAddress = requestWallet?.address;
    let resolvedWalletNetwork = requestWallet?.network;

    // Try fetching stored wallet if not in request
    if (!resolvedWalletAddress) {
      const { data: walletData } = await supabase
        .from('wallets')
        .select('address, network')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      resolvedWalletAddress = walletData?.address;
      resolvedWalletNetwork = walletData?.network;
    }

    if (!resolvedWalletAddress || !resolvedWalletNetwork) {
      return NextResponse.json(
        { error: 'A confirmed wallet connection is required before the agent can run.' },
        { status: 400 },
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
      return NextResponse.json({ error: 'Agent response could not be generated.' }, { status: 500 });
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

    const promptSave = await savePromptHistory(promptHistory);

    const txSave = await saveTransactionHistory({
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
      transactionId: txSave.id ?? null,
      promptHistoryId: promptSave.id ?? null,
      dbRecorded: promptSave.recorded && txSave.recorded,
    });
  } catch (error) {
    console.error('Agent API error:', error);
    let errorMessage = 'The agent could not process your request.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String((error as { message: unknown }).message);
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}

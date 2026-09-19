import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { updateTransactionStatus } from '@/lib/agent-history';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transactionId, status, txHash } = body ?? {};

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await updateTransactionStatus({
      transactionId,
      userId: user.id,
      status: status === 'executed' ? 'executed' : 'failed',
      txHash: typeof txHash === 'string' ? txHash : undefined,
    });

    return NextResponse.json({ ok: true, updated: result.updated });
  } catch (error) {
    console.error('Execute status API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update transaction status' },
      { status: 500 },
    );
  }
}


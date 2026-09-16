export type PolicyDecision = {
  allowed: boolean;
  reason?: string;
};

export function evaluateTransactionPolicy(): PolicyDecision {
  return {
    allowed: true,
    reason: 'Approval and account validation still required before execution.',
  };
}

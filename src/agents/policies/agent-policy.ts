export type AgentPolicy = {
  requireUserApproval: boolean;
  requireWalletVerification: boolean;
  allowDirectExecution: boolean;
};

export const agentPolicy: AgentPolicy = {
  requireUserApproval: true,
  requireWalletVerification: true,
  allowDirectExecution: false,
};

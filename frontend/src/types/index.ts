export interface DormantAccount {
  pubkey: string;
  mint: string;
  symbol?: string;
  balance: number;
  decimals: number;
  reclaimableLamports: number;
  reclaimableSol: number;
  programId: string;
  actionType?: 'CLOSE' | 'WITHDRAW_EXCESS';
}

export interface ScanSummary {
  totalAccountsFound: number;
  totalSolRecovered: number;
  userNetRefundSol: number;
  platformFeeSol: number;
  estimatedUsdValue: number;
  accounts: DormantAccount[];
}

export interface ReclaimResult {
  signature: string;
  closedAccountsCount: number;
  solRecovered: number;
  userSolReceived: number;
  feePaidSol: number;
}

import {
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import type { DormantAccount, ScanSummary } from '../types';
import { getAppConfig } from '../config/appConfig';

// Typical rent-exempt deposit for SPL Token Account (165 bytes)
const STANDARD_RENT_LAMPORTS = 2039280;
const LAMPORTS_PER_SOL = 1000000000;

/**
 * Scans the connected wallet for empty SPL Token accounts.
 * Primary: Queries backend API to protect private RPC API keys and log audit metrics.
 * Fallback: Direct client RPC scan if backend is unreachable.
 */
export async function scanDormantAccounts(
  connection: Connection,
  walletPublicKey: PublicKey,
  authToken?: string
): Promise<ScanSummary> {
  const apiBaseUrl = getAppConfig().apiBaseUrl;
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const res = await fetch(`${apiBaseUrl}/api/v1/solana/scan`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ walletAddress: walletPublicKey.toBase58() }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        totalAccountsFound: data.totalAccountsFound,
        totalSolRecovered: data.totalSolRecovered,
        userNetRefundSol: data.userNetRefundSol,
        platformFeeSol: data.platformFeeSol,
        estimatedUsdValue: data.totalSolRecovered * 150,
        accounts: data.accounts.map((a: any) => ({
          pubkey: a.pubkey,
          mint: a.mint,
          balance: a.balance || 0,
          decimals: a.decimals || 0,
          reclaimableLamports: a.reclaimableLamports,
          reclaimableSol: a.reclaimableSol,
          programId: a.programId,
          actionType: a.actionType || 'CLOSE',
        })),
      };
    }
  } catch (err) {
    console.warn('Backend scan failed, attempting client-side scan fallback:', err);
  }

  const dormantList: DormantAccount[] = [];

  // 1. Scan standard SPL Token accounts
  try {
    const standardAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPublicKey,
      { programId: TOKEN_PROGRAM_ID },
      'confirmed'
    );

    for (const item of standardAccounts.value) {
      const data = item.account.data.parsed.info;
      const amount = data.tokenAmount.amount;
      if (amount === '0') {
        const lamports = item.account.lamports || STANDARD_RENT_LAMPORTS;
        dormantList.push({
          pubkey: item.pubkey.toBase58(),
          mint: data.mint,
          balance: 0,
          decimals: data.tokenAmount.decimals,
          reclaimableLamports: lamports,
          reclaimableSol: lamports / LAMPORTS_PER_SOL,
          programId: TOKEN_PROGRAM_ID.toBase58(),
        });
      }
    }
  } catch (err) {
    console.error('Error fetching standard SPL accounts:', err);
  }

  // 2. Scan Token-2022 accounts
  try {
    const token2022Accounts = await connection.getParsedTokenAccountsByOwner(
      walletPublicKey,
      { programId: TOKEN_2022_PROGRAM_ID },
      'confirmed'
    );

    for (const item of token2022Accounts.value) {
      const data = item.account.data.parsed.info;
      const amount = data.tokenAmount.amount;
      if (amount === '0') {
        const lamports = item.account.lamports || STANDARD_RENT_LAMPORTS;
        dormantList.push({
          pubkey: item.pubkey.toBase58(),
          mint: data.mint,
          balance: 0,
          decimals: data.tokenAmount.decimals,
          reclaimableLamports: lamports,
          reclaimableSol: lamports / LAMPORTS_PER_SOL,
          programId: TOKEN_2022_PROGRAM_ID.toBase58(),
        });
      }
    }
  } catch (err) {
    console.error('Error fetching Token-2022 accounts:', err);
  }

  const totalLamports = dormantList.reduce((acc, curr) => acc + curr.reclaimableLamports, 0);
  const totalSol = totalLamports / LAMPORTS_PER_SOL;
  // Estimated 10% fee mockup for visual calculation before backend confirms exact tx
  const platformFee = totalSol * 0.025;
  const userNetRefund = totalSol - platformFee;
  const estimatedUsd = totalSol * 150;

  return {
    totalAccountsFound: dormantList.length,
    totalSolRecovered: totalSol,
    userNetRefundSol: userNetRefund,
    platformFeeSol: platformFee,
    estimatedUsdValue: estimatedUsd,
    accounts: dormantList,
  };
}

/**
 * Step 1 SIWS: Requests temporary authentication challenge nonce from the backend.
 */
export async function requestAuthNonce(walletAddress: string): Promise<{ nonce: string; statement: string }> {
  const url = `${getAppConfig().apiBaseUrl}/api/v1/auth/nonce?wallet=${encodeURIComponent(walletAddress)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to obtain nonce: HTTP ${res.status}`);
  }
  return await res.json();
}

/**
 * Step 2 SIWS: Submits Ed25519 signature to exchange for backend JWT.
 */
export async function verifyAuthSignature(
  walletAddress: string,
  nonce: string,
  signature: string
): Promise<{ token: string; expiresIn: number }> {
  const url = `${getAppConfig().apiBaseUrl}/api/v1/auth/verify`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, nonce, signature }),
  });
  if (!res.ok) {
    throw new Error(`Signature verification failed: HTTP ${res.status}`);
  }
  return await res.json();
}

export interface BuildTxResult {
  transactions: Transaction[];
  totalAccounts: number;
  totalSolRecovered: number;
  platformFeeSol: number;
  userNetRefundSol: number;
}

/**
 * SECURE TRANSACTION BUILDER:
 * Requests atomic, pre-compiled wire-format transactions from the backend API.
 * The backend enforces treasury wallet destination and exact commission,
 * preventing any client-side manipulation of fees or recipients.
 */
export async function buildReclaimTransactions(
  walletPublicKey: PublicKey,
  accountsToClose: DormantAccount[],
  authToken?: string
): Promise<BuildTxResult> {
  const url = `${getAppConfig().apiBaseUrl}/api/v1/solana/build-tx`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const payload = {
    walletAddress: walletPublicKey.toBase58(),
    accounts: accountsToClose.map(acc => ({
      pubkey: acc.pubkey,
      mint: acc.mint,
      balance: acc.balance,
      decimals: acc.decimals,
      reclaimableLamports: acc.reclaimableLamports,
      reclaimableSol: acc.reclaimableSol,
      programId: acc.programId,
      actionType: acc.actionType || 'CLOSE',
    })),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to compile transaction on backend: HTTP ${res.status}`);
  }

  const data = await res.json();
  const transactions: Transaction[] = [];

  for (const txBase64 of data.transactionsBase64) {
    const bytes = Uint8Array.from(atob(txBase64), c => c.charCodeAt(0));
    const tx = Transaction.from(bytes);
    transactions.push(tx);
  }

  return {
    transactions,
    totalAccounts: data.totalAccounts,
    totalSolRecovered: data.totalSolRecovered,
    platformFeeSol: data.platformFeeSol,
    userNetRefundSol: data.userNetRefundSol,
  };
}

/**
 * RELAY TRANSACTION TO BACKEND PROXY:
 * Relays a signed transaction to the backend relayer endpoint.
 * Protects against browser Cloudflare 403 blocks and antivirus false positives.
 */
export async function relayTransaction(
  base64Tx: string,
  walletAddress: string,
  authToken?: string
): Promise<string> {
  const url = `${getAppConfig().apiBaseUrl}/api/v1/solana/send-tx`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base64Transaction: base64Tx,
      walletAddress,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Error enviando transacción al nodo Solana: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.txSignature;
}

/**
 * Submits confirmed reclaim transaction signature to the backend for audit & on-chain verification.
 */
export async function recordReclaimTransaction(
  txSignature: string,
  walletAddress: string,
  accountsClosedCount: number,
  totalSolRecovered: number,
  platformFeeSol: number,
  userSolReceived: number,
  authToken?: string
): Promise<void> {
  try {
    const url = `${getAppConfig().apiBaseUrl}/api/v1/solana/record-reclaim`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        txSignature,
        walletAddress,
        accountsClosedCount,
        totalSolRecovered,
        userSolReceived,
        platformFeeSol,
        platformFeeUsd: platformFeeSol * 150,
      }),
    });
  } catch (err) {
    console.warn('Failed to record reclaim on backend:', err);
  }
}

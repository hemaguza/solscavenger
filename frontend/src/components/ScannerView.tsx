import { useState, type FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useLanguage } from '../context/LanguageContext';
import type { ScanSummary, ReclaimResult } from '../types';
import { buildReclaimTransactions, recordReclaimTransaction, relayTransaction } from '../services/solanaService';
import {
  CheckSquare,
  Square,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Info,
  ShieldCheck,
  Layers,
  Trash2,
} from 'lucide-react';
import { MascotIcon } from './MascotIcon';

interface ScannerViewProps {
  summary: ScanSummary;
  onRescan: () => void;
  isScanning?: boolean;
  onSuccess: (result: ReclaimResult) => void;
}

export const ScannerView: FC<ScannerViewProps> = ({ summary, onRescan, isScanning = false, onSuccess }) => {
  const { t } = useLanguage();
  const { publicKey, signTransaction } = useWallet();

  // Filter tabs: ALL, EXCESS (active accounts), CLOSE (zero-balance)
  const [filterTab, setFilterTab] = useState<'ALL' | 'EXCESS' | 'CLOSE'>('ALL');

  // Selected account pubkeys
  const [selectedPubkeys, setSelectedPubkeys] = useState<Set<string>>(
    () => new Set(summary.accounts.map((a) => a.pubkey))
  );
  const [isReclaiming, setIsReclaiming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const excessAccounts = summary.accounts.filter((a) => a.actionType === 'WITHDRAW_EXCESS');
  const closeAccounts = summary.accounts.filter((a) => a.actionType !== 'WITHDRAW_EXCESS');

  const displayedAccounts = summary.accounts.filter((a) => {
    if (filterTab === 'EXCESS') return a.actionType === 'WITHDRAW_EXCESS';
    if (filterTab === 'CLOSE') return a.actionType !== 'WITHDRAW_EXCESS';
    return true;
  });

  const selectedAccounts = summary.accounts.filter((a) => selectedPubkeys.has(a.pubkey));
  const selectedLamports = selectedAccounts.reduce((acc, curr) => acc + curr.reclaimableLamports, 0);
  const selectedSol = selectedLamports / 1000000000;

  // Dynamic fee rate from backend summary (defaults to 2.5% if zero total)
  const feeRate = summary.totalSolRecovered > 0
    ? (summary.platformFeeSol / summary.totalSolRecovered)
    : 0.025;
  const platformFee = selectedSol * feeRate;
  const userNetRefund = selectedSol - platformFee;

  const allDisplayedSelected =
    displayedAccounts.length > 0 &&
    displayedAccounts.every((a) => selectedPubkeys.has(a.pubkey));

  const toggleSelectDisplayed = () => {
    const next = new Set(selectedPubkeys);
    if (allDisplayedSelected) {
      displayedAccounts.forEach((a) => next.delete(a.pubkey));
    } else {
      displayedAccounts.forEach((a) => next.add(a.pubkey));
    }
    setSelectedPubkeys(next);
  };

  const toggleAccount = (pubkey: string) => {
    const next = new Set(selectedPubkeys);
    if (next.has(pubkey)) {
      next.delete(pubkey);
    } else {
      next.add(pubkey);
    }
    setSelectedPubkeys(next);
  };

  const handleReclaim = async () => {
    if (!publicKey || selectedAccounts.length === 0) return;
    if (!signTransaction) {
      setErrorMessage(t.scanner.errorNoSignDirect);
      return;
    }
    setIsReclaiming(true);
    setErrorMessage(null);

    try {
      // 1. Build secure transactions via Backend (enforces treasury wallet, 2.5% fee and SIMD-0437 opcodes)
      const buildResult = await buildReclaimTransactions(
        publicKey,
        selectedAccounts
      );

      let lastSignature = '';

      // 2. Sign transaction with Phantom locally and relay via backend (eliminates browser 403 blocks)
      for (const tx of buildResult.transactions) {
        const signedTx = await signTransaction(tx);
        const serialized = signedTx.serialize();
        const base64Tx = btoa(String.fromCharCode(...serialized));

        // Submit via Backend Relayer
        const sig = await relayTransaction(base64Tx, publicKey.toBase58());
        lastSignature = sig;

        // Brief delay to allow initial slot confirmation on-chain
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // 3. Record audit entry on backend
        await recordReclaimTransaction(
          sig,
          publicKey.toBase58(),
          selectedAccounts.length,
          buildResult.totalSolRecovered,
          buildResult.platformFeeSol,
          buildResult.userNetRefundSol
        );
      }

      onSuccess({
        signature: lastSignature || 'tx_completed',
        closedAccountsCount: buildResult.totalAccounts,
        solRecovered: buildResult.totalSolRecovered,
        userSolReceived: buildResult.userNetRefundSol,
        feePaidSol: buildResult.platformFeeSol,
      });
    } catch (err: any) {
      console.error('Reclaim execution failed:', err);
      setErrorMessage(err?.message || 'Transaction rejected or network error');
    } finally {
      setIsReclaiming(false);
    }
  };

  if (summary.accounts.length === 0) {
    return (
      <div className="max-w-3xl mx-4 sm:mx-auto my-8 sm:my-12 p-6 sm:p-10 rounded-3xl bg-[#181922] border border-[#272833] text-center shadow-xl">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-[#202230] flex items-center justify-center text-3xl sm:text-4xl mb-4 sm:mb-6 shadow-inner">
          🧼
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">{t.scanner.noDormantFoundTitle}</h3>
        <p className="text-xs sm:text-sm text-[#94A3B8] max-w-md mx-auto mb-6 sm:mb-8 leading-relaxed">
          {t.scanner.noDormantFoundDesc}
        </p>
        <button
          onClick={onRescan}
          disabled={isScanning}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#272836] hover:bg-[#343547] text-white text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin text-[#00FFA3]' : ''}`} />
          <span>{isScanning ? (t.hero.ctaScanning || 'Escaneando...') : t.scanner.scanAgain}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-6 sm:my-8 px-3 sm:px-6">
      {/* Summary Box */}
      <div className="rounded-3xl bg-gradient-to-b from-[#1c1d29] to-[#161720] border border-[#2d2f40] p-4 sm:p-8 shadow-2xl relative overflow-hidden mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#2d2f40]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#00FFA3] tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              {t.scanner.scanComplete}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {t.scanner.foundAccounts(summary.accounts.length)}
            </h2>
          </div>
          <button
            onClick={onRescan}
            disabled={isScanning}
            className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#252737] hover:bg-[#313347] text-xs font-bold text-[#94A3B8] hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-[#00FFA3]' : ''}`} />
            <span>{isScanning ? (t.hero.ctaScanning || 'Escaneando...') : t.scanner.scanAgain}</span>
          </button>
        </div>

        {/* Security Trust Callout (Anti-Drainer Banner) */}
        <div className="mb-6 p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-emerald-400">{t.scanner.securityBadge}</span>{' '}
            {t.scanner.securityGuarantee}
          </div>
        </div>

        {/* Financial Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Total SOL Released */}
          <div className="p-4 rounded-2xl bg-[#111218] border border-[#272836]">
            <span className="text-xs font-mono text-[#94A3B8] block mb-1">
              {t.scanner.totalReleased}
            </span>
            <div className="text-xl sm:text-2xl font-black text-white">
              + {selectedSol.toFixed(5)} <span className="text-xs font-mono text-[#00FFA3]">SOL</span>
            </div>
            <span className="text-[11px] text-[#64748B]">
              ~${(selectedSol * 150).toFixed(2)} USD
            </span>
          </div>

          {/* User Net Refund */}
          <div className="p-4 rounded-2xl bg-[#00FFA3]/5 border border-[#00FFA3]/30 relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono font-bold text-[#00FFA3]">
                {t.scanner.netRefund}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded">
                {(100 - feeRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#00FFA3]">
              + {userNetRefund.toFixed(5)} <span className="text-xs font-mono">SOL</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#00FFA3] flex items-center gap-1 mt-1">
              {t.scanner.directToWallet}
            </span>
          </div>

          {/* Platform Fee */}
          <div className="p-4 rounded-2xl bg-[#111218] border border-[#272836]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-[#94A3B8]">
                {t.scanner.scavengerFee}
              </span>
              <span className="text-[10px] font-mono text-[#9945FF] bg-purple-950/60 px-1.5 py-0.5 rounded">
                {(feeRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-300">
              {platformFee.toFixed(5)} <span className="text-xs font-mono text-[#9945FF]">SOL</span>
            </div>
            <span className="text-[10px] font-mono text-[#94A3B8] flex items-center gap-1 mt-1">
              {t.scanner.infraSupport}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleReclaim}
            disabled={isReclaiming || selectedAccounts.length === 0}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00FFA3] to-[#9945FF] text-black font-extrabold text-lg tracking-wide flex items-center justify-center gap-3 shadow-xl shadow-[#00FFA3]/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isReclaiming ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />
                {t.scanner.reclaimingBtn}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <MascotIcon className="w-6 h-6 flex-shrink-0" />
                {t.scanner.reclaimBtn(userNetRefund.toFixed(5))}
              </span>
            )}
          </button>

          <p className="text-xs text-[#94A3B8] flex items-center gap-1.5 text-center">
            <Info className="w-3.5 h-3.5 text-[#00FFA3] flex-shrink-0" />
            {t.scanner.simulationNote}
          </p>

          {errorMessage && (
            <div className="w-full mt-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs & Accounts Selection List */}
      <div className="rounded-3xl bg-[#171822] border border-[#272833] overflow-hidden">
        {/* Navigation Filter Tabs */}
        <div className="p-3 bg-[#13141d] border-b border-[#272833] flex flex-wrap gap-2">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              filterTab === 'ALL'
                ? 'bg-[#27283a] text-[#00FFA3] border border-[#00FFA3]/40'
                : 'text-slate-400 hover:text-white hover:bg-[#1f202b]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {t.scanner.tabAll(summary.accounts.length)}
          </button>

          <button
            onClick={() => setFilterTab('EXCESS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              filterTab === 'EXCESS'
                ? 'bg-amber-950/60 text-amber-400 border border-amber-500/50'
                : 'text-slate-400 hover:text-white hover:bg-[#1f202b]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            {t.scanner.tabExcess(excessAccounts.length)}
          </button>

          <button
            onClick={() => setFilterTab('CLOSE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              filterTab === 'CLOSE'
                ? 'bg-teal-950/60 text-teal-400 border border-teal-500/50'
                : 'text-slate-400 hover:text-white hover:bg-[#1f202b]'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-teal-400" />
            {t.scanner.tabClose(closeAccounts.length)}
          </button>
        </div>

        {/* List Header */}
        <div className="p-4 sm:p-5 border-b border-[#272833] bg-[#1a1b26] flex items-center justify-between">
          <button
            onClick={toggleSelectDisplayed}
            className="flex items-center gap-2.5 text-xs font-mono font-bold text-white hover:text-[#00FFA3] transition-colors cursor-pointer"
          >
            {allDisplayedSelected ? (
              <CheckSquare className="w-4 h-4 text-[#00FFA3]" />
            ) : (
              <Square className="w-4 h-4 text-[#64748B]" />
            )}
            {t.scanner.selectAll(displayedAccounts.length)}
          </button>
          <span className="text-xs font-mono text-[#64748B]">
            {t.scanner.selectedCount(selectedAccounts.length, summary.accounts.length)}
          </span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#232431] max-h-96 overflow-y-auto">
          {displayedAccounts.map((acc) => {
            const isChecked = selectedPubkeys.has(acc.pubkey);
            const isWithdrawExcess = acc.actionType === 'WITHDRAW_EXCESS';

            return (
              <div
                key={acc.pubkey}
                onClick={() => toggleAccount(acc.pubkey)}
                className={`p-4 sm:px-6 flex items-center justify-between cursor-pointer transition-colors ${
                  isChecked ? 'bg-[#1b1c28]' : 'bg-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-[#00FFA3] flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-[#64748B] flex-shrink-0" />
                  )}
                  <div className="w-8 h-8 rounded-lg bg-[#242635] flex items-center justify-center text-sm">
                    {isWithdrawExcess ? '💎' : '🪙'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-mono font-medium text-white">
                        ATA: {acc.pubkey.slice(0, 4)}...{acc.pubkey.slice(-4)}
                      </span>
                      {isWithdrawExcess ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {t.scanner.badgeIntactTokens(acc.balance.toFixed(2))}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">
                          {t.scanner.badgeZeroBalance}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-[#64748B] mt-0.5">
                      {t.scanner.mintLabel}: {acc.mint.slice(0, 4)}...{acc.mint.slice(-4)} | {t.scanner.balanceLabel}: {acc.balance.toFixed(4)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs sm:text-sm font-mono font-bold text-[#00FFA3]">
                    +{acc.reclaimableSol.toFixed(5)} SOL
                  </div>
                  <span className="text-[10px] uppercase font-mono text-gray-500">
                    {isWithdrawExcess ? t.scanner.excessTag : t.scanner.rentExemptTag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

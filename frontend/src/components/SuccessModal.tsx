import type { FC } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { ReclaimResult } from '../types';
import { getSolanaNetwork } from '../context/WalletContextProvider';
import { ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';
import { MascotIcon } from './MascotIcon';

interface SuccessModalProps {
  result: ReclaimResult;
  onClose: () => void;
}

export const SuccessModal: FC<SuccessModalProps> = ({ result, onClose }) => {
  const { t } = useLanguage();

  const clusterParam = getSolanaNetwork() === 'devnet' ? '?cluster=devnet' : '';
  const solscanUrl = `https://solscan.io/tx/${result.signature}${clusterParam}`;
  
  const tweetText = encodeURIComponent(
    `Just cleaned up my @solana wallet with @SolScavengerApp and reclaimed +${result.userSolReceived.toFixed(4)} SOL! Reclaim your locked rent at solscavenger.app`
  );
  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="max-w-md w-full rounded-3xl bg-[#181924] border border-[#2e3042] p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#00FFA3]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#9945FF]/30 to-[#00FFA3]/30 border border-[#00FFA3]/40 flex items-center justify-center p-2 mb-6 shadow-xl relative z-10">
          <MascotIcon className="w-full h-full drop-shadow-md" />
        </div>

        <h3 className="text-2xl font-black text-white mb-2 relative z-10">
          {t.success.title}
        </h3>

        <p className="text-sm sm:text-base text-[#00FFA3] font-medium mb-6 relative z-10">
          {t.success.recoveredMsg(result.userSolReceived.toFixed(5), result.closedAccountsCount)}
        </p>

        {/* Transaction details card */}
        <div className="p-4 rounded-2xl bg-[#111218] border border-[#272836] mb-6 text-left relative z-10">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-2">
            <span>{t.success.txSignature}</span>
            <span className="font-mono text-[10px] text-[#00FFA3] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {t.success.confirmed}
            </span>
          </div>
          <a
            href={solscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-white hover:text-[#00FFA3] break-all flex items-center gap-1.5 transition-colors"
          >
            <span>{result.signature.slice(0, 16)}...{result.signature.slice(-16)}</span>
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-[#9945FF]" />
          </a>
        </div>

        {/* Buttons */}
        <div className="space-y-3 relative z-10">
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 rounded-xl bg-[#1DA1F2] hover:bg-[#1a94df] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#1DA1F2]/20"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            {t.success.shareTwitter}
          </a>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#242533] hover:bg-[#2e3042] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#00FFA3]" />
            {t.success.scanAnother}
          </button>
        </div>
      </div>
    </div>
  );
};

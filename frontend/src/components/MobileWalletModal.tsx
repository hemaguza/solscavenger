import { useState, type FC } from 'react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useLanguage } from '../context/LanguageContext';
import { useMobileWallet } from '../context/MobileWalletContext';
import { MascotIcon } from './MascotIcon';
import { X, Copy, Check, ExternalLink, Smartphone } from 'lucide-react';
import { getPhantomDeepLink, getSolflareDeepLink, getCleanCurrentUrl } from '../utils/mobileDetection';

export const MobileWalletModal: FC = () => {
  const { t } = useLanguage();
  const { isMobileModalOpen, closeMobileModal } = useMobileWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);

  if (!isMobileModalOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getCleanCurrentUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleOpenStandardModal = () => {
    closeMobileModal();
    setVisible(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-[#181922] border border-[#2e303f] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#9945FF]/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-r from-[#9945FF]/30 to-[#00FFA3]/30 blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={closeMobileModal}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-[#252633] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#9945FF] to-[#00FFA3] p-[2px] mb-3 shadow-lg shadow-[#00FFA3]/10">
            <div className="w-full h-full bg-[#181922] rounded-[14px] flex items-center justify-center p-2">
              <MascotIcon className="w-full h-full" />
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1f202b] text-[11px] font-mono font-semibold text-[#00FFA3] border border-[#2e303f] mb-2">
            <Smartphone className="w-3.5 h-3.5" />
            <span>SOLSCAVENGER MOBILE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {t.mobileModal.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-xs mx-auto">
            {t.mobileModal.subtitle}
          </p>
        </div>

        {/* Wallet Options */}
        <div className="space-y-3 relative z-10">
          {/* Option 1: Phantom */}
          <a
            href={getPhantomDeepLink()}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1e1f2b] hover:bg-[#252737] border border-[#ab9ff2]/30 hover:border-[#ab9ff2] transition-all group shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#ab9ff2]/20 flex items-center justify-center border border-[#ab9ff2]/40 shrink-0">
                {/* Phantom Ghost Icon */}
                <svg className="w-6 h-6 text-[#ab9ff2]" viewBox="0 0 128 128" fill="currentColor">
                  <path d="M115.5 64c0 28.4-23.1 51.5-51.5 51.5S12.5 92.4 12.5 64 35.6 12.5 64 12.5s51.5 23.1 51.5 51.5z" opacity="0.2"/>
                  <path d="M106.8 62.4c-2.3-19.1-18.4-33.8-37.8-33.8-21.2 0-38.4 17.2-38.4 38.4 0 5.4 1.1 10.5 3.1 15.2l.6 1.4c2.5 5.8 4.7 11.8 4.7 18.2 0 1.9 1.6 3.5 3.5 3.5h.3c1.9-.1 3.4-1.6 3.4-3.5 0-5.3 1.9-10.4 5.3-14.4 2.8-3.3 6.9-5.3 11.2-5.3h10.3c18.6 0 34.1-13.4 36.6-31.7.3-1.6-.9-3.2-2.5-3.5-.6-.1-1.2 0-1.7.2zM43.7 58.7c-2.7 0-4.9-2.2-4.9-4.9s2.2-4.9 4.9-4.9 4.9 2.2 4.9 4.9-2.2 4.9-4.9 4.9zm21.4 0c-2.7 0-4.9-2.2-4.9-4.9s2.2-4.9 4.9-4.9 4.9 2.2 4.9 4.9-2.2 4.9-4.9 4.9z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-sm sm:text-base flex items-center gap-1.5">
                  {t.mobileModal.openPhantom}
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#9945FF]/20 text-[#00FFA3] border border-[#00FFA3]/30">
                    Popular
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {t.mobileModal.phantomDesc}
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#00FFA3] transition-colors" />
          </a>

          {/* Option 2: Solflare */}
          <a
            href={getSolflareDeepLink()}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1e1f2b] hover:bg-[#252737] border border-[#f39021]/30 hover:border-[#f39021] transition-all group shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#f39021]/20 flex items-center justify-center border border-[#f39021]/40 shrink-0">
                {/* Solflare Flame Icon */}
                <svg className="w-6 h-6 text-[#f39021]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c0 .83-.67 1.5-1.5 1.5S10 17.33 10 16.5c0-1.5 1.5-3 1.5-3s1.5 1.5 1.5 3zm3.5-3.5c-.83 0-1.5-.67-1.5-1.5 0-1.5 1.5-3 1.5-3s1.5 1.5 1.5 3c0 .83-.67 1.5-1.5 1.5zM8.5 11c-.83 0-1.5-.67-1.5-1.5 0-1.5 1.5-3 1.5-3s1.5 1.5 1.5 3c0 .83-.67 1.5-1.5 1.5z"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-sm sm:text-base">
                  {t.mobileModal.openSolflare}
                </div>
                <div className="text-xs text-slate-400">
                  {t.mobileModal.solflareDesc}
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#f39021] transition-colors" />
          </a>

          {/* Option 3: Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#1e1f2b] hover:bg-[#252737] border border-[#2e303f] hover:border-slate-500 transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#272838] flex items-center justify-center border border-[#3b3c4f] shrink-0 text-slate-300">
                {copied ? <Check className="w-5 h-5 text-[#00FFA3]" /> : <Copy className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-bold text-white text-sm">
                  {copied ? t.mobileModal.linkCopied : t.mobileModal.copyLink}
                </div>
                <div className="text-xs text-slate-400">
                  {t.mobileModal.copyLinkDesc}
                </div>
              </div>
            </div>
            {copied && (
              <span className="text-[10px] font-mono text-[#00FFA3] font-bold">
                ✓
              </span>
            )}
          </button>
        </div>

        {/* Fallback for extension-enabled mobile browsers */}
        <div className="mt-5 text-center relative z-10 pt-4 border-t border-[#252633]">
          <button
            onClick={handleOpenStandardModal}
            className="text-xs text-slate-400 hover:text-slate-200 underline decoration-dotted transition-colors cursor-pointer"
          >
            {t.mobileModal.continueAnyway}
          </button>
        </div>
      </div>
    </div>
  );
};

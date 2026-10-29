import type { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useLanguage } from '../context/LanguageContext';
import { useMobileWallet } from '../context/MobileWalletContext';
import { MascotIcon } from './MascotIcon';
import { Sparkles, ArrowRight, Wallet, CheckCircle2, Smartphone } from 'lucide-react';

interface LandingHeroProps {
  onScanClick?: () => void;
  isScanning?: boolean;
}

export const LandingHero: FC<LandingHeroProps> = ({ onScanClick, isScanning }) => {
  const { t } = useLanguage();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { shouldUseMobileFlow, openMobileModal } = useMobileWallet();

  const handleCtaClick = () => {
    if (!connected) {
      if (shouldUseMobileFlow) {
        openMobileModal();
      } else {
        setVisible(true);
      }
    } else if (onScanClick) {
      onScanClick();
    }
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background Neon Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-[#9945FF]/15 to-[#00FFA3]/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Cyberpunk Mascot Visual */}
        <div className="inline-block relative mb-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#181922] border border-[#2e303f] flex items-center justify-center p-2 shadow-2xl shadow-[#9945FF]/20 relative">
            <MascotIcon className="w-full h-full drop-shadow-lg" />
            {/* Sunglasses / Cyberpunk badge */}
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00FFA3] text-black shadow-md">
              0-RISK
            </span>
          </div>
        </div>

        {/* Tagline */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1e1f2b] border border-[#2e303f] text-xs font-mono tracking-widest text-[#00FFA3] mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#00FFA3]" />
          <span className="font-bold text-white tracking-normal">{t.hero.badge}</span>
          <span className="text-[#64748B]">•</span>
          <span>{t.hero.tagline}</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6">
          {t.hero.title}
        </h1>

        <p className="text-xl sm:text-2xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-300 to-gray-400 max-w-3xl mx-auto mb-6">
          {t.hero.subtitle}
        </p>

        {/* Description */}
        <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed mb-10">
          {t.hero.description}
        </p>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <button
            onClick={handleCtaClick}
            disabled={isScanning}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#00FFA3] to-[#9945FF] text-black font-extrabold text-base tracking-wide flex items-center justify-center gap-3 shadow-xl shadow-[#00FFA3]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {isScanning ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />
                {t.hero.ctaScanning}
              </span>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                {t.hero.ctaConnect}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Supported Wallets Badge */}
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#64748B]">
          <CheckCircle2 className="w-4 h-4 text-[#00FFA3]" />
          <span>{t.hero.supportedWallets}</span>
        </div>

        {/* Mobile Deep Link Banner / Hint */}
        {shouldUseMobileFlow && (
          <div className="mt-5 inline-flex flex-col sm:flex-row items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1a1b24] border border-[#9945FF]/40 text-xs text-slate-300 shadow-lg shadow-[#9945FF]/10 max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#00FFA3] shrink-0" />
              <span>{t.mobileBanner.text}</span>
            </div>
            <button
              onClick={openMobileModal}
              className="px-3 py-1 rounded-full bg-gradient-to-r from-[#9945FF] to-[#00FFA3] text-black font-extrabold text-[11px] hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
            >
              {t.mobileBanner.action} →
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

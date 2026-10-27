import type { FC } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Wallet, UserCheck, SearchCode, ListFilter, Coins, Globe, Laptop, Smartphone } from 'lucide-react';

export const HowItWorks: FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      step: '01',
      icon: Wallet,
      title: t.howItWorks.step1Title,
      desc: t.howItWorks.step1Desc,
      highlight: 'Chrome • Brave • Edge • Firefox • iOS • Android',
    },
    {
      step: '02',
      icon: UserCheck,
      title: t.howItWorks.step2Title,
      desc: t.howItWorks.step2Desc,
      highlight: 'Read-only • Zero approvals',
    },
    {
      step: '03',
      icon: SearchCode,
      title: t.howItWorks.step3Title,
      desc: t.howItWorks.step3Desc,
      highlight: 'SPL Token & Token-2022',
    },
    {
      step: '04',
      icon: ListFilter,
      title: t.howItWorks.step4Title,
      desc: t.howItWorks.step4Desc,
      highlight: 'SIMD-0437 & 0-Balance Filter',
    },
    {
      step: '05',
      icon: Coins,
      title: t.howItWorks.step5Title,
      desc: t.howItWorks.step5Desc,
      highlight: 'Instant SOL to your wallet',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-16">
        <h2 className="text-xs uppercase font-mono tracking-widest text-[#9945FF] mb-2">
          [ {t.howItWorks.title} ]
        </h2>
        <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          {t.howItWorks.subtitle}
        </p>
        <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xl mx-auto mt-3">
          {t.howItWorks.walletCompatibilityNote}
        </p>
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {steps.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={`relative p-7 rounded-3xl bg-[#181924] border border-[#272836] hover:border-[#3d3f54] transition-all group flex flex-col justify-between shadow-xl ${
                index === 4 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#9945FF]/20 to-[#00FFA3]/20 flex items-center justify-center border border-[#9945FF]/30">
                    <Icon className="w-6 h-6 text-[#00FFA3]" />
                  </div>
                  <span className="font-mono text-3xl font-black text-[#2f3144] group-hover:text-[#9945FF] transition-colors">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 tracking-wide">{item.title}</h3>
                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed mb-4">{item.desc}</p>
              </div>

              <div className="pt-3 border-t border-[#232433] flex items-center gap-2 text-[11px] font-mono text-[#00FFA3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-pulse"></span>
                <span>{item.highlight}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compatibility Banner */}
      <div className="mt-10 p-5 rounded-3xl bg-[#14151e] border border-[#272836] flex flex-wrap items-center justify-between gap-4 text-xs text-[#94A3B8]">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#00FFA3]" />
          <span className="font-semibold text-white">{t.howItWorks.universalSupport}</span>
          <span>Chrome, Brave, Edge, Firefox, Opera, Safari</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Laptop className="w-4 h-4 text-purple-400" /> {t.howItWorks.desktopExtension}
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <Smartphone className="w-4 h-4 text-teal-400" /> {t.howItWorks.mobileApps}
          </span>
        </div>
      </div>
    </section>
  );
};

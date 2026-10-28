import type { FC } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useLanguage } from '../context/LanguageContext';
import { MascotIcon } from './MascotIcon';
import { Globe, Shield, HelpCircle, Terminal, ExternalLink } from 'lucide-react';

export const Navbar: FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#121214]/85 border-b border-[#272833]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#9945FF] to-[#00FFA3] p-[2px] flex items-center justify-center shadow-lg shadow-[#00FFA3]/10">
            <div className="w-full h-full bg-[#18191f] rounded-[14px] flex items-center justify-center overflow-hidden p-1 select-none">
              <MascotIcon className="w-full h-full" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-wider text-xl text-white flex items-center gap-1.5">
              Sol<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFA3] to-[#9945FF]">Scavenger</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#94A3B8] hidden sm:inline">
                {t.nav.tagline}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 font-bold tracking-tight">
                by neihec
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#94A3B8]">
          <a href="#how-it-works" className="hover:text-[#00FFA3] transition-colors flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-[#9945FF]" />
            {t.nav.howItWorks}
          </a>
          <a href="#security" className="hover:text-[#00FFA3] transition-colors flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-[#00FFA3]" />
            {t.nav.security}
          </a>
          <a href="#faq" className="hover:text-[#00FFA3] transition-colors flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-[#9945FF]" />
            {t.nav.faq}
          </a>
          <a
            href="https://neihec.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1 text-slate-400 hover:text-indigo-400"
          >
            <span>Neihec</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://github.com/hemaguza/solscavenger"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1.5 text-slate-400 hover:text-[#00FFA3]"
            title="GitHub Repository"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <span>GitHub</span>
          </a>
          <a
            href="https://x.com/SolScavengerApp"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1.5 text-slate-400 hover:text-[#00FFA3]"
            title="X (Twitter)"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>X</span>
          </a>
        </nav>

        {/* Action Controls: Language Toggle & Connect Wallet */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a1b24] hover:bg-[#252633] text-xs font-semibold border border-[#2e303f] transition-all text-white cursor-pointer"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#00FFA3]" />
            <span className={language === 'en' ? 'text-[#00FFA3] font-bold' : 'text-[#64748B]'}>EN</span>
            <span className="text-[#64748B]">|</span>
            <span className={language === 'es' ? 'text-[#00FFA3] font-bold' : 'text-[#64748B]'}>ES</span>
          </button>

          <WalletMultiButton className="!bg-gradient-to-r !from-[#9945FF] !to-[#00FFA3] !text-black !font-bold !rounded-full !py-2 !px-3 sm:!px-5 !text-xs sm:!text-sm hover:!opacity-90" />
        </div>
      </div>
    </header>
  );
};

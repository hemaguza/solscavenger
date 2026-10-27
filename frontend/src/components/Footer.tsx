import type { FC } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const Footer: FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-[#272833] py-10 bg-[#121214] text-center text-xs text-[#64748B]">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <span className="font-medium text-white">{t.footer.rights}</span>
          <span className="hidden sm:inline text-gray-500">•</span>
          <a
            href="https://neihec.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00FFA3] hover:underline font-mono text-xs"
          >
            neihec.com
          </a>
          <span className="hidden sm:inline text-gray-500">•</span>
          <span className="text-[#94A3B8]">{t.footer.builtOn}</span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://neihec.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#00FFA3] transition-colors"
          >
            Neihec
          </a>
          <a
            href="https://github.com/hemaguza/solscavenger"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#00FFA3] transition-colors flex items-center gap-1"
          >
            GitHub
          </a>
          <a href="#how-it-works" className="hover:text-white transition-colors">
            {t.nav.howItWorks}
          </a>
          <a href="#security" className="hover:text-white transition-colors">
            {t.nav.security}
          </a>
          <a href="#faq" className="hover:text-white transition-colors">
            {t.nav.faq}
          </a>
        </div>
      </div>
    </footer>
  );
};

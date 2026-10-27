import { useState, type FC } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const FaqSection: FC = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { q: t.faq.q1, a: t.faq.a1 },
    { q: t.faq.q2, a: t.faq.a2 },
    { q: t.faq.q3, a: t.faq.a3 },
    { q: t.faq.q4, a: t.faq.a4 },
    { q: t.faq.q5, a: t.faq.a5 },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-xs uppercase font-mono tracking-widest text-[#00FFA3] mb-2">
          [ {t.faq.title} ]
        </h2>
        <p className="text-3xl font-extrabold text-white">{t.faq.subtitle}</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-[#181922] border border-[#272833] overflow-hidden transition-all"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#1f202c] transition-colors"
              >
                <span className="font-bold text-white text-base sm:text-lg">{faq.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-[#00FFA3] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#64748B] flex-shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-5 pb-6 sm:px-6 text-sm sm:text-base text-[#94A3B8] leading-relaxed border-t border-[#232430] pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

import { createContext, useContext, useState, useEffect, type ReactNode, type FC } from 'react';

export type Language = 'en' | 'es';

interface Translations {
  nav: {
    tagline: string;
    howItWorks: string;
    security: string;
    faq: string;
    neihec: string;
    connectWallet: string;
    disconnect: string;
  };
  hero: {
    badge: string;
    tagline: string;
    title: string;
    subtitle: string;
    description: string;
    ctaConnect: string;
    ctaScanning: string;
    supportedWallets: string;
  };
  pillars: {
    title: string;
    subtitle: string;
    nonCustodialTitle: string;
    nonCustodialDesc: string;
    zeroBalanceTitle: string;
    zeroBalanceDesc: string;
    auditedTitle: string;
    auditedDesc: string;
  };
  howItWorks: {
    title: string;
    subtitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    step4Title: string;
    step4Desc: string;
    step5Title: string;
    step5Desc: string;
    walletCompatibilityNote: string;
    universalSupport: string;
    desktopExtension: string;
    mobileApps: string;
  };
  scanner: {
    scanComplete: string;
    foundAccounts: (count: number) => string;
    totalReleased: string;
    netRefund: string;
    scavengerFee: string;
    directToWallet: string;
    infraSupport: string;
    selectAll: (count: number) => string;
    reclaimBtn: (sol: string) => string;
    reclaimingBtn: string;
    simulationNote: string;
    noDormantFoundTitle: string;
    noDormantFoundDesc: string;
    scanAgain: string;
    securityBadge: string;
    securityGuarantee: string;
    tabAll: (count: number) => string;
    tabExcess: (count: number) => string;
    tabClose: (count: number) => string;
    selectedCount: (selected: number, total: number) => string;
    badgeIntactTokens: (bal: string) => string;
    badgeZeroBalance: string;
    mintLabel: string;
    balanceLabel: string;
    excessTag: string;
    rentExemptTag: string;
    errorNoSignDirect: string;
  };
  faq: {
    title: string;
    subtitle: string;
    q1: string;
    a1: string;
    q2: string;
    a2: string;
    q3: string;
    a3: string;
    q4: string;
    a4: string;
    q5: string;
    a5: string;
  };
  success: {
    title: string;
    recoveredMsg: (sol: string, count: number) => string;
    viewSolscan: string;
    shareTwitter: string;
    scanAnother: string;
    txSignature: string;
    confirmed: string;
  };
  footer: {
    rights: string;
    byNeihec: string;
    builtOn: string;
  };
  mobileModal: {
    title: string;
    subtitle: string;
    openPhantom: string;
    phantomDesc: string;
    openSolflare: string;
    solflareDesc: string;
    copyLink: string;
    linkCopied: string;
    copyLinkDesc: string;
    continueAnyway: string;
  };
  mobileBanner: {
    text: string;
    action: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    nav: {
      tagline: 'SOLANA RENT OPTIMIZER',
      howItWorks: 'How it Works',
      security: 'Security',
      faq: 'FAQ',
      neihec: 'by Neihec',
      connectWallet: 'Connect Wallet',
      disconnect: 'Disconnect',
    },
    hero: {
      badge: 'SolScavenger by Neihec',
      tagline: 'SOLANA RENT OPTIMIZER & RECLAIMER',
      title: 'SOL SCAVENGER',
      subtitle: 'Reclaim locked SOL from dormant accounts & excess rent from active tokens',
      description: 'With Solana SIMD-0437, active token accounts hold excess SOL and empty accounts hold locked deposits. SolScavenger safely extracts your surplus SOL without touching your tokens and destroys dead accounts in 1 atomic click.',
      ctaConnect: '🔍 CONNECT & SCAN WALLET',
      ctaScanning: 'SCANNING BLOCKCHAIN...',
      supportedWallets: 'Compatible with Phantom, Solflare & Backpack (Chrome, Brave, Edge, Firefox, iOS, Android)',
    },
    pillars: {
      title: 'SECURITY & TRUST PILLARS',
      subtitle: 'Built for Maximum Safety & Zero Anxiety',
      nonCustodialTitle: '🛡️ NON-CUSTODIAL & ATOMIC',
      nonCustodialDesc: 'Funds never touch our servers. Smart transaction refunds SOL directly to your wallet in the same instant.',
      zeroBalanceTitle: '🔍 ZERO-RISK ASSET SAFETY',
      zeroBalanceDesc: 'We never burn or transfer your active tokens. For active tokens we only withdraw surplus rent (SIMD-0437), and for empty accounts we only close zero-balance storage.',
      auditedTitle: '🏛️ BACKED & AUDITED BY NEIHEC',
      auditedDesc: 'Engineered under enterprise security standards by Neihec: strict CSP, on-chain proof verification and zero approval permissions.',
    },
    howItWorks: {
      title: 'HOW IT WORKS',
      subtitle: 'Step-by-step, Fast & Completely Safe',
      step1Title: '1. GET A WEB3 WALLET',
      step1Desc: 'Install Phantom, Solflare or Backpack. It is NOT exclusive to Chrome: works seamlessly on Brave, Edge, Firefox, Opera, and on mobile (iOS & Android).',
      step2Title: '2. CONNECT & SELECT ACCOUNT',
      step2Desc: 'Click "Connect Wallet" and select the account you want to audit. Zero permissions requested, strictly read-only mode.',
      step3Title: '3. AUTOMATIC AUDIT SCAN',
      step3Desc: 'SolScavenger analyzes all your SPL Token and Token-2022 accounts on-chain to detect empty accounts and excess rent from SIMD-0437.',
      step4Title: '4. FILTER & CHOOSE',
      step4Desc: 'Review the financial breakdown. Filter between empty zero-balance accounts or active tokens with surplus rent, and choose what to reclaim.',
      step5Title: '5. ATOMIC RECLAIM',
      step5Desc: 'Confirm the transaction in your wallet. The accounts close on-chain and your SOL rent is refunded directly to your main balance.',
      walletCompatibilityNote: '💡 Multi-Browser & Multi-Device: Phantom and Solflare work across all modern desktop browsers and mobile apps.',
      universalSupport: 'Universal Browser Support:',
      desktopExtension: 'Desktop Extension',
      mobileApps: 'Mobile Apps (iOS & Android)',
    },
    scanner: {
      scanComplete: 'SCAN COMPLETE!',
      foundAccounts: (count) => `Found ${count} dormant token accounts with 0 balance eligible for rent recovery.`,
      totalReleased: 'Total SOL Released:',
      netRefund: 'Your Net Refund:',
      scavengerFee: 'Protocol Fee:',
      directToWallet: '🟢 DIRECTLY TO YOUR WALLET',
      infraSupport: '🪙 INFRASTRUCTURE SUPPORT',
      selectAll: (count) => `Select All (${count})`,
      reclaimBtn: (sol) => `RECLAIM +${sol} SOL`,
      reclaimingBtn: 'CONFIRMING ON-CHAIN...',
      simulationNote: 'Phantom will prompt you to confirm. The simulation will display a GREEN net positive balance.',
      noDormantFoundTitle: 'Wallet is Squeaky Clean! 🧼',
      noDormantFoundDesc: 'No empty token accounts with zero balance found in this wallet. All your active accounts are healthy.',
      scanAgain: 'Scan Again',
      securityBadge: 'Native Security Guarantee:',
      securityGuarantee: 'This operation only invokes official Solana instructions: WithdrawExcessLamports and CloseAccount. NEVER requests token transfers or approval permissions.',
      tabAll: (count) => `All (${count})`,
      tabExcess: (count) => `Excess Rent (Active Accounts) (${count})`,
      tabClose: (count) => `Empty Accounts (${count})`,
      selectedCount: (selected, total) => `${selected} / ${total} SELECTED`,
      badgeIntactTokens: (bal) => `Tokens Intact (${bal})`,
      badgeZeroBalance: 'Balance 0 (Closing)',
      mintLabel: 'Mint',
      balanceLabel: 'Balance',
      excessTag: 'Excess SIMD-0437',
      rentExemptTag: 'Rent-Exempt',
      errorNoSignDirect: 'Your wallet extension does not support direct transaction signing.',
    },
    faq: {
      title: 'FREQUENTLY ASKED QUESTIONS',
      subtitle: 'Got Questions? We’ve Got Answers',
      q1: 'Can SolScavenger drain my wallet?',
      a1: 'No. We only trigger the native Solana SPL Token "closeAccount" and "withdrawExcessLamports" instructions. Before signing in Phantom, you will see a green simulation confirming you RECEIVE SOL.',
      q2: 'Is Phantom wallet exclusive to Google Chrome?',
      a2: 'Not at all! Phantom and other major Solana wallets (Solflare, Backpack) work across Google Chrome, Brave, Microsoft Edge, Mozilla Firefox, Opera, and on mobile devices via the official iOS and Android apps with built-in Web3 browsers.',
      q3: 'Why does Solana lock my SOL in the first place?',
      a3: 'Solana requires a rent-exempt deposit (~0.002039 SOL per token) to allocate blockchain space for each token account. When you sell all your tokens, the account stays open forever unless you explicitly close it.',
      q4: 'What is the fee?',
      a4: 'We charge a competitive 2.5% fee on reclaimed rent to support high-speed RPC nodes and infrastructure. You keep 97.5% of all recovered funds. If no empty accounts are found, it costs you $0.00.',
      q5: 'Who develops and backs SolScavenger?',
      a5: 'SolScavenger is engineered and backed by Neihec (neihec.com), built with enterprise-grade security headers, non-custodial architecture, and audited on-chain transaction builders.',
    },
    success: {
      title: 'SUCCESSFUL RECLAIM! 🎉',
      recoveredMsg: (sol, count) => `You recovered +${sol} SOL to your wallet (${count} empty accounts closed permanently).`,
      viewSolscan: 'View on Solscan ↗',
      shareTwitter: '🐦 Share on X / Twitter',
      scanAnother: 'Scan Another Wallet',
      txSignature: 'Transaction Signature',
      confirmed: 'Confirmed',
    },
    footer: {
      rights: '© 2026 SolScavenger',
      byNeihec: 'by Neihec',
      builtOn: 'Built on Solana',
    },
    mobileModal: {
      title: 'CONNECT ON MOBILE',
      subtitle: 'Standard mobile browsers (Safari / Chrome) do not support wallet extensions. Open SolScavenger directly in your wallet app:',
      openPhantom: 'Open in Phantom',
      phantomDesc: 'Recommended for iOS & Android',
      openSolflare: 'Open in Solflare',
      solflareDesc: 'Solana native mobile wallet',
      copyLink: 'Copy SolScavenger Link',
      linkCopied: 'Link Copied to Clipboard!',
      copyLinkDesc: 'Paste into any Web3 mobile wallet browser',
      continueAnyway: 'Using a mobile browser with extensions? Click here',
    },
    mobileBanner: {
      text: 'Browsing on mobile? Open SolScavenger directly in Phantom for 1-click connection.',
      action: 'Open in Phantom',
    },
  },
  es: {
    nav: {
      tagline: 'OPTIMIZADOR DE RENTA DE SOLANA',
      howItWorks: 'Cómo Funciona',
      security: 'Seguridad',
      faq: 'Preguntas',
      neihec: 'by Neihec',
      connectWallet: 'Conectar Billetera',
      disconnect: 'Desconectar',
    },
    hero: {
      badge: 'SolScavenger by Neihec',
      tagline: 'OPTIMIZADOR Y RECUPERADOR DE RENTA DE SOLANA',
      title: 'SOL SCAVENGER',
      subtitle: 'Recupera tu SOL de subcuentas vacías y el exceso de renta en tus tokens activos',
      description: 'Con la reducción de renta SIMD-0437 de Solana, tus tokens activos tienen SOL excedente y tus cuentas vacías tienen depósitos atrapados. SolScavenger extrae tu exceso de renta sin tocar tus tokens y destruye subcuentas en cero con 1 solo clic atómico.',
      ctaConnect: '🔍 CONECTAR Y ESCANEAR WALLET',
      ctaScanning: 'ESCANEANDO BLOCKCHAIN...',
      supportedWallets: 'Compatible con Phantom, Solflare y Backpack (Chrome, Brave, Edge, Firefox, iOS, Android)',
    },
    pillars: {
      title: 'PILARES DE SEGURIDAD Y CONFIANZA',
      subtitle: 'Diseñado para Máxima Seguridad y Cero Ansiedad',
      nonCustodialTitle: '🛡️ NO-CUSTODIAL Y ATÓMICO',
      nonCustodialDesc: 'Tus fondos jamás tocan nuestros servidores. La transacción reembolsa el SOL directamente a tu wallet en el mismo instante.',
      zeroBalanceTitle: '🔍 SEGURIDAD TOTAL DE ACTIVOS',
      zeroBalanceDesc: 'Nunca quemamos ni tocamos tus tokens con valor o NFTs. Para tokens activos solo retiramos el exceso de renta (SIMD-0437) y para cuentas vacías solo cerramos casilleros en cero.',
      auditedTitle: '🏛️ RESPALDADO Y AUDITADO POR NEIHEC',
      auditedDesc: 'Desarrollado bajo estándares de seguridad corporativa por Neihec: CSP estricto, verificación on-chain y cero permisos solicitados.',
    },
    howItWorks: {
      title: 'CÓMO FUNCIONA',
      subtitle: 'Paso a paso, Rápido y Completamente Seguro',
      step1Title: '1. DISPÓN DE TU WALLET WEB3',
      step1Desc: 'Instala Phantom, Solflare o Backpack. NO es exclusivo de Chrome: funciona en Brave, Edge, Firefox, Opera y en móviles (iOS y Android).',
      step2Title: '2. CONECTA Y SELECCIONA CUENTA',
      step2Desc: 'Haz clic en "Conectar Billetera" y elige la cuenta que deseas auditar. Sin permisos de aprobación de fondos, modo solo-lectura.',
      step3Title: '3. ESCANEO AUDITOR AUTOMÁTICO',
      step3Desc: 'SolScavenger analiza en cadena tus subcuentas de SPL Token y Token-2022 para detectar cuentas vacías y excedentes de renta de SIMD-0437.',
      step4Title: '4. FILTRA Y ELIGE CUENTAS',
      step4Desc: 'Revisa el balance desglosado. Filtra entre cuentas vacías (balance 0) o tokens activos con exceso de fianza, y selecciona lo que deseas recuperar.',
      step5Title: '5. RECLAMO ATÓMICO EN 1 CLIC',
      step5Desc: 'Firma la transacción en tu wallet. La blockchain destruye las subcuentas inactivas y te devuelve el depósito en SOL directamente a tu saldo.',
      walletCompatibilityNote: '💡 Multi-Navegador y Multi-Dispositivo: Phantom y Solflare son compatibles con todos los navegadores modernos y apps móviles.',
      universalSupport: 'Soporte Universal de Navegadores:',
      desktopExtension: 'Extensión de Escritorio',
      mobileApps: 'Apps Móviles (iOS y Android)',
    },
    scanner: {
      scanComplete: '¡ESCANEO COMPLETADO!',
      foundAccounts: (count) => `Se encontraron ${count} subcuentas inactivas con balance 0 elegibles para recuperar fianza.`,
      totalReleased: 'SOL Bruto Liberado:',
      netRefund: 'Tu Reembolso Neto:',
      scavengerFee: 'Comisión del Protocolo:',
      directToWallet: '🟢 DIRECTAMENTE A TU WALLET',
      infraSupport: '🪙 SOPORTE DE INFRAESTRUCTURA',
      selectAll: (count) => `Seleccionar Todo (${count})`,
      reclaimBtn: (sol) => `RECUPERAR +${sol} SOL`,
      reclaimingBtn: 'CONFIRMANDO EN RED...',
      simulationNote: 'Phantom te pedirá confirmar. La simulación mostrará un balance neto POSITIVO en color VERDE.',
      noDormantFoundTitle: '¡Tu wallet está impecable! 🧼',
      noDormantFoundDesc: 'No se encontraron subcuentas vacías en balance cero. Todas tus cuentas activas están en orden.',
      scanAgain: 'Escanear de Nuevo',
      securityBadge: 'Garantía de Seguridad Nativa:',
      securityGuarantee: 'Esta operación solo invoca las instrucciones oficiales de Solana: WithdrawExcessLamports y CloseAccount. NUNCA solicita aprobación (Approve) ni transferencias de tus tokens.',
      tabAll: (count) => `Todos (${count})`,
      tabExcess: (count) => `Exceso Renta (Cuentas Activas) (${count})`,
      tabClose: (count) => `Cuentas Vacías (${count})`,
      selectedCount: (selected, total) => `${selected} / ${total} SELECCIONADAS`,
      badgeIntactTokens: (bal) => `Tokens Intactos (${bal})`,
      badgeZeroBalance: 'Balance 0 (Cierre)',
      mintLabel: 'Mint',
      balanceLabel: 'Saldo',
      excessTag: 'Exceso SIMD-0437',
      rentExemptTag: 'Rent-Exempt',
      errorNoSignDirect: 'Tu wallet no soporta la firma directa de transacciones.',
    },
    faq: {
      title: 'PREGUNTAS FRECUENTES',
      subtitle: '¿Tienes dudas? Aquí te explicamos todo',
      q1: '¿Puede SolScavenger drenar mi wallet?',
      a1: 'No. Solo ejecutamos las instrucciones oficiales de Solana "closeAccount" y "withdrawExcessLamports". Antes de firmar en Phantom, verás una simulación en verde confirmando que RECIBES SOL.',
      q2: '¿Phantom es exclusivo de Google Chrome?',
      a2: '¡Para nada! Phantom y las principales billeteras de Solana (Solflare, Backpack) funcionan en Google Chrome, Brave, Microsoft Edge, Mozilla Firefox, Opera, y en dispositivos móviles a través de sus apps oficiales para iOS y Android.',
      q3: '¿Por qué Solana retiene mi SOL en primer lugar?',
      a3: 'Solana exige un depósito de fianza de almacenamiento (~0.002039 SOL por token) para reservar espacio en el registro distribuido. Cuando vendes todos tus tokens, la cuenta física queda abierta para siempre a menos que la destruyas.',
      q4: '¿Cuál es la comisión?',
      a4: 'Cobramos una tarifa competitiva del 2.5% del SOL recuperado para costear los nodos RPC de alta velocidad. Te quedas con el 97.5% neto de los fondos recuperados. Si no hay cuentas vacías, te cuesta $0.00.',
      q5: '¿Quién respalda y desarrolla SolScavenger?',
      a5: 'SolScavenger es desarrollado y respaldado por Neihec (neihec.com), construido bajo arquitectura no-custodial, cabeceras de seguridad de grado empresarial y constructores de transacciones auditados en cadena.',
    },
    success: {
      title: '¡RECLAMO EXITOSO! 🎉',
      recoveredMsg: (sol, count) => `Recuperaste +${sol} SOL directamente en tu wallet (${count} cuentas vacías destruidas permanentemente).`,
      viewSolscan: 'Ver en Solscan ↗',
      shareTwitter: '🐦 Compartir en X / Twitter',
      scanAnother: 'Escanear Otra Wallet',
      txSignature: 'Firma de la Transacción',
      confirmed: 'Confirmado',
    },
    footer: {
      rights: '© 2026 SolScavenger',
      byNeihec: 'by Neihec',
      builtOn: 'Construido en Solana',
    },
    mobileModal: {
      title: 'CONECTAR EN CELULAR',
      subtitle: 'Los navegadores móviles estándar (Safari / Chrome) no admiten extensiones. Abre SolScavenger directamente en tu aplicación de wallet:',
      openPhantom: 'Abrir en Phantom',
      phantomDesc: 'Recomendado para iOS y Android',
      openSolflare: 'Abrir en Solflare',
      solflareDesc: 'Billetera nativa de Solana',
      copyLink: 'Copiar enlace de SolScavenger',
      linkCopied: '¡Enlace copiado al portapapeles!',
      copyLinkDesc: 'Pégalo en el navegador de cualquier app Web3',
      continueAnyway: '¿Usas un navegador móvil con extensiones? Haz clic aquí',
    },
    mobileBanner: {
      text: '¿Navegando desde el celular? Abre SolScavenger directo en Phantom para conectar en 1 clic.',
      action: 'Abrir en Phantom',
    },
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('solscavenger_lang');
    return saved === 'es' ? 'es' : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('solscavenger_lang', lang);
  };

  useEffect(() => {
    localStorage.setItem('solscavenger_lang', language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

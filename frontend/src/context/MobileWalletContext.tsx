import { createContext, useContext, useState, type FC, type ReactNode } from 'react';
import {
  isMobileDevice,
  isInAppWalletBrowser,
  getPhantomDeepLink,
  getSolflareDeepLink,
} from '../utils/mobileDetection';

interface MobileWalletContextType {
  isMobile: boolean;
  isInAppBrowser: boolean;
  shouldUseMobileFlow: boolean;
  isMobileModalOpen: boolean;
  openMobileModal: () => void;
  closeMobileModal: () => void;
  openInPhantom: () => void;
  openInSolflare: () => void;
}

const MobileWalletContext = createContext<MobileWalletContextType | undefined>(undefined);

export const MobileWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [isMobile] = useState(() => isMobileDevice());
  const [isInAppBrowser] = useState(() => isInAppWalletBrowser());
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  const shouldUseMobileFlow = isMobile && !isInAppBrowser;

  const openMobileModal = () => setIsMobileModalOpen(true);
  const closeMobileModal = () => setIsMobileModalOpen(false);

  const openInPhantom = () => {
    window.location.href = getPhantomDeepLink();
  };

  const openInSolflare = () => {
    window.location.href = getSolflareDeepLink();
  };

  return (
    <MobileWalletContext.Provider
      value={{
        isMobile,
        isInAppBrowser,
        shouldUseMobileFlow,
        isMobileModalOpen,
        openMobileModal,
        closeMobileModal,
        openInPhantom,
        openInSolflare,
      }}
    >
      {children}
    </MobileWalletContext.Provider>
  );
};

export const useMobileWallet = (): MobileWalletContextType => {
  const context = useContext(MobileWalletContext);
  if (!context) {
    throw new Error('useMobileWallet must be used within a MobileWalletProvider');
  }
  return context;
};

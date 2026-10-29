import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { WalletContextProvider } from './context/WalletContextProvider';
import { LanguageProvider } from './context/LanguageContext';
import { MobileWalletProvider } from './context/MobileWalletContext';
import { loadAppConfig } from './config/appConfig';

loadAppConfig().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <WalletContextProvider>
        <LanguageProvider>
          <MobileWalletProvider>
            <App />
          </MobileWalletProvider>
        </LanguageProvider>
      </WalletContextProvider>
    </StrictMode>,
  );
});

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { WalletContextProvider } from './context/WalletContextProvider';
import { LanguageProvider } from './context/LanguageContext';
import { loadAppConfig } from './config/appConfig';

loadAppConfig().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <WalletContextProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </WalletContextProvider>
    </StrictMode>,
  );
});

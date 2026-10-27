import { useMemo, type FC, type ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { getAppConfig } from '../config/appConfig';

export const getSolanaNetwork = () => getAppConfig().solanaNetwork;
export const getSolanaRpcEndpoint = () => getAppConfig().solanaRpc;

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint = useMemo(() => getSolanaRpcEndpoint(), []);
  
  // Empty array allows standard auto-discovery of browser extension wallets (Phantom, Solflare, Backpack, etc.)
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

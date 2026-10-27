import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { TrustPillars } from './components/TrustPillars';
import { HowItWorks } from './components/HowItWorks';
import { ScannerView } from './components/ScannerView';
import { FaqSection } from './components/FaqSection';
import { SuccessModal } from './components/SuccessModal';
import { Footer } from './components/Footer';
import type { ScanSummary, ReclaimResult } from './types';
import { scanDormantAccounts } from './services/solanaService';

export default function App() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();

  const [isScanning, setIsScanning] = useState(false);
  const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null);
  const [reclaimResult, setReclaimResult] = useState<ReclaimResult | null>(null);

  // Trigger scan when connected or requested
  const handleScan = async () => {
    if (!publicKey) return;
    setIsScanning(true);
    try {
      const result = await scanDormantAccounts(connection, publicKey);
      setScanSummary(result);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      handleScan();
    } else {
      setScanSummary(null);
    }
  }, [connected, publicKey]);

  const handleSuccess = (result: ReclaimResult) => {
    setReclaimResult(result);
  };

  const handleModalClose = () => {
    setReclaimResult(null);
    handleScan();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#121214] text-white selection:bg-[#00FFA3] selection:text-black">
      <Navbar />

      <main className="flex-1">
        {connected && scanSummary ? (
          <ScannerView
            summary={scanSummary}
            onRescan={handleScan}
            onSuccess={handleSuccess}
          />
        ) : (
          <>
            <LandingHero onScanClick={handleScan} isScanning={isScanning} />
            <TrustPillars />
            <HowItWorks />
            <FaqSection />
          </>
        )}
      </main>

      <Footer />

      {reclaimResult && (
        <SuccessModal result={reclaimResult} onClose={handleModalClose} />
      )}
    </div>
  );
}

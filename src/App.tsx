"use client";
import { useState, useEffect, useRef, type FC } from "react";
import ParticleField from "@/components/effects/ParticleField";
import { C, type PageId } from "@/lib/tokens";
import { getWeb3Wallet } from "@/lib/walletController";
import Header from "@/components/header/Header";

// Pages
import DepositPage from "@/components/pages/DepositPage";
import CreateProxyPage from "@/components/pages/CreateProxyPage";
import ConnectPage from "@/components/pages/ConnectPage";
import TradePage from "@/components/pages/TradePage";
import PortfolioPage from "@/components/pages/PortfolioPage";

const PAGE_COMPONENTS: Record<PageId, FC<any>> = {
  deposit: DepositPage,
  proxy: CreateProxyPage,
  connect: ConnectPage,
  trade: TradePage,
  portfolio: PortfolioPage,
};

export interface WalletState {
  isConnected: boolean;
  isHLConnected: boolean;
  eoa: string | null;
  proxySafe: string | null;
  stealthAccount: string | null;
  stealthAddress: string | null;   
  proxies: any[];
}

export default function App() {
  const [page, setPage] = useState<PageId>("proxy");
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    isHLConnected: false,
    eoa: null,
    proxySafe: null,
    stealthAccount: null,
    stealthAddress: null,
    proxies: [],
  });

useEffect(() => {
  // Just trigger the initialization. The listener is attached inside walletController.
  getWeb3Wallet().then(() => console.log("🚀 WalletConnect Engine Online"));
}, []);

// === SILENCE EXPECTED WALLET CONNECT ERROR (official fix) ===
useEffect(() => {
  const handleRejection = (event: PromiseRejectionEvent) => {
    if (event.reason?.message?.includes("No matching key")) {
      console.warn("✅ Ignored expected WalletConnect error (normal)");
      event.preventDefault(); // stops red error in console
    }
  };

  window.addEventListener("unhandledrejection", handleRejection);
  return () => window.removeEventListener("unhandledrejection", handleRejection);
}, []);

  const PageComponent = PAGE_COMPONENTS[page];

  return (
    <div className="min-h-screen relative" style={{ background: C.void, color: C.white }}>
      <ParticleField />

      <Header 
        page={page} 
        setPage={setPage} 
        wallet={wallet} 
        setWallet={setWallet} 
      />

      <main className="relative z-[1]" style={{ padding: "28px 28px 60px", maxWidth: 1280, margin: "0 auto" }} key={page}>
        {!wallet.isConnected ? (
          <div className="flex flex-col items-center justify-center py-40 text-center anim-fade-up">
             <h2 className="text-2xl font-head font-bold mb-4">Initialize Terminal</h2>
             <p className="text-muted mb-8 max-w-sm">Connect your wallet to derive your private stealth proxy and access Hyperliquid.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 anim-fade-up">
              <div className="font-mono text-[9px] tracking-[4px] uppercase mb-1.5" style={{ color: C.muted }}>
                {page}
              </div>
              <h1 className="font-head text-[30px] font-extrabold tracking-tight" style={{ color: C.white }}>
                {page.charAt(0).toUpperCase() + page.slice(1)}
              </h1>
            </div>
            <PageComponent wallet={wallet} setWallet={setWallet} />
          </>
        )}
      </main>
    </div>
  );
}
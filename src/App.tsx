"use client";
import { useState, useEffect, type FC } from "react";
import ParticleField from "@/components/effects/ParticleField";
import { C, type PageId } from "@/lib/tokens";
import { getWeb3Wallet, onPendingRequest, resolveRequest } from "@/lib/walletController";
import Header from "@/components/header/Header";

import DepositPage    from "@/components/pages/DepositPage";
import CreateProxyPage from "@/components/pages/CreateProxyPage";
import ConnectPage    from "@/components/pages/ConnectPage";
import TradePage      from "@/components/pages/TradePage";
import PortfolioPage  from "@/components/pages/PortfolioPage";
import { Zap } from "lucide-react";
import { getStoredEOA } from "./lib/hyperStealth";

const PAGE_COMPONENTS: Record<PageId, FC<any>> = {
  deposit:   DepositPage,
  proxy:     CreateProxyPage,
  connect:   ConnectPage,
  trade:     TradePage,
  portfolio: PortfolioPage,
};

export interface WalletState {
  isConnected:    boolean;
  isHLConnected:  boolean;
  eoa:            string | null;
  // The currently active stealth address (used for WalletConnect session)
  activeProxy:    string | null;
  // Convenience alias — same value as activeProxy, kept for signing handlers
  stealthAddress: string | null;
  proxies:        any[];
}

export default function App() {
  const [page, setPage] = useState<PageId>("proxy");
  const [wallet, setWallet] = useState<WalletState>({
    isConnected:    false,
    isHLConnected:  false,
    eoa:            null,
    activeProxy:    null,
    stealthAddress: null,
    proxies:        [],
  });
  const [request, setRequest] = useState<any>(null);

  // 1. Subscribe to WalletController pub/sub — modal appears on signing requests
  useEffect(() => {
    const unsub = onPendingRequest((req) => setRequest(req));
    return unsub;
  }, []);

  // 2. Boot WalletConnect engine on mount — registers session_request listener
  //    before the user connects to any dapp.
  useEffect(() => {
    getWeb3Wallet()
      .then(() => console.log("[Nyra] WalletConnect engine online"))
      .catch((e) => console.error("[Nyra] WalletConnect init failed:", e));
  }, []);

  // 3. Rehydrate wallet state from localStorage on first load
  useEffect(() => {
    const activeAddress = localStorage.getItem("nyra_active_stealth");
    const stealthKey    = localStorage.getItem("nyra_stealth_key");
    const proxiesRaw    = localStorage.getItem("nyra_proxies");

    if (!activeAddress || !stealthKey) return;

    const proxies = proxiesRaw ? JSON.parse(proxiesRaw) : [];

    // Mirror into sessionStorage so walletController.getStoredKeys() works
    sessionStorage.setItem("nyra_stealth_address", activeAddress);
    sessionStorage.setItem("nyra_stealth_key",     stealthKey);

    setWallet((prev) => ({
      ...prev,
      eoa: getStoredEOA(),
      isConnected:    true,
      activeProxy:    activeAddress,
      stealthAddress: activeAddress,
      proxies,
    }));
  }, []);

  // 4. Silence benign WalletConnect "No matching key" noise
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes("No matching key")) {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  const PageComponent = PAGE_COMPONENTS[page];

  const getDisplayData = () => {
    if (!request) return null;
    try {
      const p = request.params.request.params;
      const data = p.length > 1 ? p[1] : p[0];
      return typeof data === "string" ? JSON.parse(data) : data;
    } catch {
      return request.params;
    }
  };

  return (
    <div className="min-h-screen relative" style={{ background: C.void, color: C.white }}>
      <ParticleField />

      <Header page={page} setPage={setPage} wallet={wallet} setWallet={setWallet} />

      <main
        className="relative z-[1]"
        style={{ padding: "28px 28px 60px", maxWidth: 1280, margin: "0 auto" }}
      >
        {!wallet.isConnected ? (
          <div className="flex flex-col items-center justify-center py-40 text-center anim-fade-up">
            <h2 className="text-2xl font-head font-bold mb-4">Initialize Terminal</h2>
            <p className="text-muted mb-8 max-w-sm">
              Connect your wallet to derive a private stealth address and access Hyperliquid.
            </p>
            <button
              onClick={() => setPage("proxy")}
              className="px-8 py-3 bg-primary rounded-full font-bold"
            >
              Create Stealth Address
            </button>
          </div>
        ) : (
          <div className="anim-fade-up">
            <div className="mb-6">
              <div
                className="font-mono text-[9px] tracking-[4px] uppercase mb-1.5"
                style={{ color: C.muted }}
              >
                {page}
              </div>
              <h1 className="font-head text-[30px] font-extrabold tracking-tight">
                {page.charAt(0).toUpperCase() + page.slice(1)}
              </h1>
            </div>
            <PageComponent wallet={wallet} setWallet={setWallet} />
          </div>
        )}
      </main>

      {/* Signing modal */}
      {request && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md anim-fade-in">
          <div className="w-[440px] bg-[#0c0c0c] border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Signature Request</h3>
                <p className="text-[10px] text-muted uppercase tracking-widest">
                  {request.method}
                </p>
              </div>
            </div>

            <div className="bg-black/60 border border-white/5 rounded-2xl p-4 text-[11px] font-mono break-all mb-8 max-h-[200px] overflow-auto custom-scrollbar">
              <pre className="text-muted-foreground">
                {JSON.stringify(getDisplayData(), null, 2)}
              </pre>
            </div>

            <div className="flex gap-4">
              <button
                className="flex-1 py-4 rounded-2xl font-bold transition-all bg-white text-black hover:bg-white/90 active:scale-95"
                onClick={() => resolveRequest(true)}
              >
                Confirm & Sign
              </button>
              <button
                className="flex-1 py-4 rounded-2xl font-bold transition-all bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95"
                onClick={() => resolveRequest(false)}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

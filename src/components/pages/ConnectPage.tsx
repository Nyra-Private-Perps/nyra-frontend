"use client";
import { useState, useEffect, useCallback } from "react";
import { Link2, Check, RefreshCw, Zap, AlertCircle, ChevronDown } from "lucide-react";
import { GlowCard, Badge, Btn, Input, SignatureViz } from "@/components/ui";
import { C } from "@/lib/tokens";
import { getWeb3Wallet } from "@/lib/walletController";
import { WalletState } from "../../App";
import { getAddress } from "ethers";

// Arbitrum Sepolia for HL Testnet
const HL_TESTNET_CHAIN = "eip155:421614"; 

export default function ConnectPage({
  wallet,
  setWallet,
}: {
  wallet: WalletState;
  setWallet: (fn: (prev: WalletState) => WalletState) => void;
}) {
  const [step, setStep] = useState(0); // 0: select proxy, 1: input uri, 2: connecting, 3: success, 4: error
  const [uri, setUri] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [wcInstance, setWcInstance] = useState<any>(null);


// ConnectPage.tsx -> handleConnect
// Inside ConnectPage.tsx

// ConnectPage.tsx -> handleConnect
// ConnectPage.tsx -> handleConnect

const handleConnect = async () => {
  if (!uri || !uri.includes("wc:")) return;
  setLoading(true);
  setErrorMsg(null);

  try {
    const wc = await getWeb3Wallet();

    // 1. Cleanup old pairings
    const pairings = wc.core.pairing.getPairings();
    for (const p of pairings) {
      await wc.core.pairing.disconnect({ topic: p.topic }).catch(() => {});
    }

    const handshakePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Handshake timeout")), 40000);

      wc.on("session_proposal", async (proposal: any) => {
        clearTimeout(timeout);
        try {
          console.log("🔔 Received session proposal for Safe:", wallet.proxySafe);
          
          // CRITICAL: Identify as the SAFE ADDRESS, not the stealth address
          const safeAddress = getAddress(wallet.proxySafe!);
          
          if (!safeAddress) {
             throw new Error("No active Proxy Safe selected");
          }

          const required = proposal.params.requiredNamespaces?.eip155 || {};
          const optional = proposal.params.optionalNamespaces?.eip155 || {};

          const supportedMethods = [
            'eth_sendTransaction',
            'personal_sign',
            'eth_signTypedData',
            'eth_signTypedData_v4',
            'eth_sign',
          ];

          const mergedMethods = Array.from(new Set([
            ...(required.methods || []),
            ...(optional.methods || []),
            ...supportedMethods
          ]));

          const namespaces = {
            eip155: {
              // WE REPORT THE SAFE ADDRESS HERE
              accounts: [`eip155:421614:${safeAddress}`], 
              methods: mergedMethods,
              events: ['accountsChanged', 'chainChanged'],
              chains: [`eip155:421614`],
            },
          };

          await wc.approveSession({ id: proposal.id, namespaces });
          console.log("✅ Session approved for Safe:", safeAddress);
          
          resolve(true);
        } catch (e) { reject(e); }
      });
    });

    await wc.core.pairing.pair({ uri: uri.trim() });
    setStep(2); 

    await handshakePromise;
    setWallet(prev => ({ ...prev, isHLConnected: true }));
    setStep(3); 

  } catch (err: any) {
    setErrorMsg(err.message);
    setStep(4);
  } finally {
    setLoading(false);
  }
};
  const reset = () => {
    setStep(0);
    setUri("");
    setErrorMsg(null);
  };

  return (
    <div className="max-w-[540px] mx-auto anim-fade-up">
      {step === 0 && (
        <GlowCard>
          <div className="mb-6">
            <h3 className="font-head text-xl font-bold mb-1">Target Proxy</h3>
            <p className="text-[11px] text-muted uppercase tracking-wider">Select the safe to link with Hyperliquid</p>
          </div>
          <div className="flex flex-col gap-3 mb-7">
            {wallet.proxies.length === 0 ? (
              <div className="text-center py-12 text-muted text-sm border border-dashed border-white/10 rounded-2xl">
                No proxies available — create one first
              </div>
            ) : (
              wallet.proxies.map((p: any) => (
                <div
                  key={p.safe}
                  onClick={() => {
                    setWallet((prev: any) => ({ ...prev, proxySafe: p.safe }));
                    sessionStorage.setItem("nyra_safe_address", p.safe); // Keep storage in sync
                  }}
                  className="p-4 rounded-xl border cursor-pointer transition-all hover:bg-white/[0.02]"
                  style={{
                    background: wallet.proxySafe === p.safe ? `${C.primary}12` : "transparent",
                    borderColor: wallet.proxySafe === p.safe ? C.accent : `${C.primary}20`,
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-body text-sm font-semibold text-white">
                      Proxy Safe #{p.num}
                    </div>
                    {wallet.proxySafe === p.safe && <Badge variant="success">Active</Badge>}
                  </div>
                  <div className="font-mono text-[10px] text-muted mt-1 break-all opacity-60">
                    {p.safe}
                  </div>
                </div>
              ))
            )}
          </div>
          <Btn
            variant="primary"
            full
            onClick={() => setStep(1)}
            disabled={!wallet.proxySafe || loading}
          >
            Confirm Proxy & Continue
          </Btn>
        </GlowCard>
      )}

      {step === 1 && (
        <GlowCard className="text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-accent/20">
              <Link2 size={28} className="text-accent" />
            </div>
            <h3 className="font-head text-xl font-bold mb-2">Connect Hyperliquid</h3>
            <p className="text-xs text-muted leading-relaxed px-6">
              Paste the WalletConnect URI from Hyperliquid "Connect Wallet" menu.
            </p>
          </div>
          <Input
            placeholder="wc:abc123..."
            value={uri}
            onChange={(val) => setUri(val)}
            mono
          />
          <Btn
            variant="primary"
            full
            onClick={handleConnect}
            disabled={loading || !uri.trim()}
          >
            {loading ? <RefreshCw className="anim-spin mr-2" size={15} /> : null}
            Establish Handshake
          </Btn>
          <button onClick={() => setStep(0)} className="mt-4 text-[10px] font-mono text-muted hover:text-white uppercase tracking-widest">
            ← Change Selected Proxy
          </button>
        </GlowCard>
      )}

      {step === 2 && (
        <GlowCard className="text-center py-10">
          <div className="mb-8">
            <SignatureViz active />
          </div>
          <h3 className="font-head text-xl font-bold mb-3">Initializing Session</h3>
          <p className="text-xs text-muted mb-7 px-8 leading-relaxed">
            Establishing encrypted tunnel between your Stealth Proxy and Hyperliquid Testnet nodes...
          </p>
          <div className="flex items-center justify-center gap-2 font-mono text-[10px] text-accent animate-pulse uppercase tracking-[2px]">
            <span className="w-1.5 h-1.5 bg-accent rounded-full" />
            Waiting for Peer Response
          </div>
        </GlowCard>
      )}

      {step === 3 && (
        <GlowCard glow={C.success} className="text-center py-10">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-success/20">
            <Check size={40} className="text-success" />
          </div>
          <h3 className="font-head text-2xl font-bold mb-3">Tunnel Established</h3>
          <p className="text-sm text-muted mb-8 px-10 leading-relaxed">
            Your Proxy Safe is now securely linked. You can now execute private trades on Hyperliquid.
          </p>
          <Btn variant="primary" full onClick={reset}>
            Enter Trading Terminal
          </Btn>
        </GlowCard>
      )}

      {step === 4 && (
        <GlowCard className="text-center border-red-500/20">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h3 className="font-head text-xl font-bold mb-2 text-red-200">Handshake Failed</h3>
          <p className="text-xs text-muted mb-8 px-4 leading-relaxed">{errorMsg}</p>
          <div className="flex gap-3">
            <Btn variant="outline" full onClick={() => setStep(1)}>
              Retry
            </Btn>
            <Btn variant="ghost" full onClick={reset}>
              Abort
            </Btn>
          </div>
        </GlowCard>
      )}
    </div>
  );
}
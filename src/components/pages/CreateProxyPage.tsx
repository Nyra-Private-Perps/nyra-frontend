"use client";
import { useState } from "react";
import { Wallet, RefreshCw, Check, AlertCircle } from "lucide-react";
import { GlowCard, Badge, Btn, SignatureViz } from "@/components/ui";
import { C } from "@/lib/tokens";
import { ethers } from "ethers";
import { generateStealthProxy, deploySafeAccount } from "@/lib/walletController";
import { WalletState } from "../../App";

type Phase = "idle" | "signing" | "deriving" | "deploying" | "success" | "error";

const STEPS: { label: string; desc: string; p: Phase }[] = [
  { label: "Sign Message", desc: '"CREATE_PROXY_ADDRESS"', p: "signing" },
  { label: "Derive Keys", desc: "Spending + Viewing keys", p: "deriving" },
  { label: "Predict & Deploy Safe", desc: "CREATE2 + relayer deployment", p: "deploying" },
  { label: "Ready", desc: "Stealth proxy live", p: "success" },
];

const TARGET_CHAIN_ID = 421614;          // Arbitrum One — change to 999 for HyperEVM mainnet
const TARGET_CHAIN_HEX = "0xa4b1";      // 42161 → hex
// const TARGET_CHAIN_ID = 999;         // ← uncomment for Hyperliquid HyperEVM
// const TARGET_CHAIN_HEX = "0x3e7";

export default function CreateProxyPage({
  wallet,
  setWallet,
}: {
  wallet: WalletState;
  setWallet: (fn: (prev: WalletState) => WalletState) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    setProgress(0);

    try {
      if (!window.ethereum) throw new Error("No wallet detected");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      // 1. Network switch
      if (Number(network.chainId) !== TARGET_CHAIN_ID) {
        setProgress(5);
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${TARGET_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchErr: any) {
          if (switchErr.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: `0x${TARGET_CHAIN_ID.toString(16)}`,
                chainName: "Arbitrum Sepolia",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
                blockExplorerUrls: ["https://sepolia.arbiscan.io"],
              }],
            });
          } else {
            throw switchErr;
          }
        }
      }

      // 2. Step: Signing Message
      setPhase("signing");
      setProgress(20);
      
      // Ensure we are connected
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const signer = await provider.getSigner();
      
      const nonce = wallet.proxies?.length || 0;

// 1. Generate (Now takes the nonce)
const result = await generateStealthProxy(signer, nonce);

      // 3. Step: Deriving Keys (Visual Feedback)
      setPhase("deriving");
      setProgress(45);
      await new Promise(resolve => setTimeout(resolve, 800));

      // 4. Step: Predict & Deploy (MetaMask Gas Popup)
      setPhase("deploying");
      setProgress(70);

      // Pass the initialized kit and the MetaMask signer
      const deployment = await deploySafeAccount(
        result.protocolKit,
        signer
      );

      setProgress(90);

      // 5. Update UI state & persistence
      const newProxy = {
        num: (wallet.proxies?.length || 0) + 1,
        id: `${deployment.safeAddress.slice(0, 6)}...${deployment.safeAddress.slice(-4)}`,
        safe: deployment.safeAddress,
        balance: "0.00",
        active: true,
      };

      const updatedProxies = [...(wallet.proxies || []), newProxy];
      
      // Save to BOTH localStorage (for persistence) and sessionStorage (for the listener)
      localStorage.setItem("nyra_active_safe", deployment.safeAddress);
      localStorage.setItem("nyra_stealth_key", result.stealthPrivateKey);
      sessionStorage.setItem("nyra_safe_address", deployment.safeAddress);
      sessionStorage.setItem("nyra_stealth_key", result.stealthPrivateKey);

      setWallet((prev) => ({
        ...prev,
        isConnected: true, // Mark as connected now that we have a proxy
        proxySafe: deployment.safeAddress,
        stealthAddress: result.stealthAddress,
        stealthAccount: result.stealthPrivateKey,
        proxies: updatedProxies,
      }));

      setPhase("success");
      setProgress(100);

      setTimeout(() => {
        setPhase("idle");
        setProgress(0);
      }, 5000);

    } catch (err: any) {
      console.error("Proxy creation failed:", err);
      const isUserRejection = err.code === 4001 || err.message?.includes("rejected");
      setError(
        isUserRejection
          ? "Signature or transaction rejected by user"
          : err.message || "Deployment failed. Ensure you have Sepolia ETH."
      );
      setPhase("error");
      setProgress(0);
    }
  };
  const currentStepIndex = STEPS.findIndex((s) => s.p === phase);

  return (
    <div className="anim-fade-up">
      <div className="grid gap-6" style={{ gridTemplateColumns: "400px 1fr" }}>
        <GlowCard glow={phase === "error" ? "#ef4444" : C.accent}>
          <div className="text-center mb-6">
            <SignatureViz
              active={phase === "signing" || phase === "deriving" || phase === "deploying"}
            />
          </div>

          <h3
            className="font-head text-[22px] font-extrabold text-center mb-2"
            style={{ color: phase === "error" ? "#ef4444" : C.white }}
          >
            {phase === "idle"
              ? "Create Stealth Proxy"
              : phase === "success"
              ? "✓ Proxy Created"
              : phase === "error"
              ? "Creation Failed"
              : "Processing..."}
          </h3>

          <p className="text-[11px] text-center text-muted mb-6 leading-relaxed min-h-[48px]">
            {phase === "error" ? (
              error
            ) : phase === "deploying" ? (
              "Deploying Safe via relayer (gasless for you)..."
            ) : phase === "success" ? (
              "Your unlinkable proxy Safe is ready. Select it to connect."
            ) : (
              "Deriving secure stealth keys from your one-time signature."
            )}
          </p>

          {phase !== "idle" && phase !== "error" && phase !== "success" && (
            <div className="mb-6 rounded-full overflow-hidden h-1.5 bg-primary/10">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`,
                  boxShadow: `0 0 12px ${C.accent}50`,
                }}
              />
            </div>
          )}

          <div className="flex flex-col gap-3 mb-6">
            {STEPS.map((s, i) => {
              const isActive = i === currentStepIndex;
              const isDone = i < currentStepIndex;
              const isError = phase === "error" && i === currentStepIndex - 1;

              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl transition-all p-3.5"
                  style={{
                    background: isActive ? `${C.primary}15` : "transparent",
                    border: `1px solid ${isActive || isError ? (isError ? "#ef4444" : C.primary + "40") : "transparent"}`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-mono shrink-0"
                    style={{
                      border: `2.5px solid ${
                        isError ? "#ef4444" : isDone ? C.success : isActive ? C.accent : C.primary + "30"
                      }`,
                      color: isError ? "#ef4444" : isDone ? C.success : isActive ? C.accent : C.muted,
                      background: isError ? "#ef444420" : "transparent",
                    }}
                  >
                    {isError ? "!" : isDone ? "✓" : i + 1}
                  </div>
                  <div>
                    <div
                      className="text-sm font-medium"
                      style={{ color: isActive || isError ? C.white : C.muted }}
                    >
                      {s.label}
                    </div>
                    <div className="text-[10px] font-mono text-muted">{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {phase === "error" ? (
            <div className="flex gap-3">
              <Btn variant="outline" full onClick={() => setPhase("idle")}>
                Try Again
              </Btn>
              <Btn variant="ghost" full onClick={() => setError(null)}>
                Dismiss
              </Btn>
            </div>
          ) : (
            <Btn
              variant="primary"
              full
              onClick={handleCreate}
              disabled={phase !== "idle" && phase !== "success"}
            >
              {phase === "idle" ? (
                <>
                  <Wallet size={15} className="mr-2" /> Create Proxy Safe
                </>
              ) : phase === "success" ? (
                <>
                  <Check size={15} className="mr-2" /> Success — Create Another?
                </>
              ) : (
                <>
                  <RefreshCw size={15} className="mr-2 anim-spin" /> In Progress...
                </>
              )}
            </Btn>
          )}
        </GlowCard>

        {/* Right column — Active Proxies list */}
        <div>
          <div className="font-mono uppercase text-[10px] tracking-[3px] mb-4 text-muted">
            Active Proxies ({wallet.proxies?.length || 0})
          </div>

          <div className="flex flex-col gap-3">
            {wallet.proxies?.length === 0 ? (
              <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center text-muted text-sm">
                No stealth proxies yet.<br />Create your first one above.
              </div>
            ) : (
              wallet.proxies.map((p: any, i: number) => (
                <GlowCard key={i}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-extrabold font-head"
                        style={{ background: C.core, color: C.glow }}
                      >
                        {p.num}
                      </div>
                      <div>
                        <div className="font-medium text-white">Proxy #{p.num}</div>
                        <div className="font-mono text-xs text-muted mt-0.5">
                          Safe: {p.safe.slice(0, 10)}...{p.safe.slice(-8)}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={wallet.proxySafe === p.safe ? "success" : "secondary"}
                      pulse={wallet.proxySafe === p.safe}
                    >
                      {wallet.proxySafe === p.safe ? "Active" : "Ready"}
                    </Badge>
                  </div>
                </GlowCard>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

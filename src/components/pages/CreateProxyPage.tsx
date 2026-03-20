"use client";
import { useState, useEffect } from "react";
import { Wallet, RefreshCw, Check } from "lucide-react";
import { GlowCard, Badge, Btn, SignatureViz } from "@/components/ui";
import { C } from "@/lib/tokens";
import { ethers } from "ethers";
import { generateStealthProxy, deploySafeAccount } from "@/lib/walletController";
import { WalletState } from "../../App";

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const TARGET_CHAIN_ID = 421614; // Arbitrum Sepolia
const TARGET_CHAIN_HEX = `0x${TARGET_CHAIN_ID.toString(16)}`; // "0x66eee"

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type Phase = "idle" | "switching" | "signing" | "deriving" | "deploying" | "success" | "error";

interface ProxyEntry {
  num: number;
  id: string;
  safe: string;
  balance: string;
  active: boolean;
}

const STEPS: { label: string; desc: string; p: Phase }[] = [
  { label: "Switch Network",       desc: "Arbitrum Sepolia",            p: "switching" },
  { label: "Sign Message",         desc: '"CREATE_PROXY_ADDRESS"',      p: "signing"   },
  { label: "Derive Keys",          desc: "Spending + Viewing keys",     p: "deriving"  },
  { label: "Predict & Deploy Safe",desc: "CREATE2 deterministic deploy",p: "deploying" },
  { label: "Ready",                desc: "Stealth proxy live",          p: "success"   },
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Prompts MetaMask to switch to TARGET_CHAIN_ID, adding it if needed. */
async function ensureCorrectNetwork(): Promise<void> {
  if (!window.ethereum) throw new Error("No wallet detected");

  const chainIdHex: string = await window.ethereum.request({ method: "eth_chainId" });
  if (parseInt(chainIdHex, 16) === TARGET_CHAIN_ID) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: TARGET_CHAIN_HEX }],
    });
  } catch (switchErr: any) {
    if (switchErr.code === 4902) {
      // Chain not added yet — add it first
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: TARGET_CHAIN_HEX,
            chainName: "Arbitrum Sepolia",
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
            blockExplorerUrls: ["https://sepolia.arbiscan.io"],
          },
        ],
      });
    } else {
      throw switchErr;
    }
  }
}

/** Loads saved proxies from localStorage so the list survives page refresh. */
function loadSavedProxies(): ProxyEntry[] {
  try {
    const raw = localStorage.getItem("nyra_proxies");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Persists proxy list to localStorage. */
function saveProxies(proxies: ProxyEntry[]): void {
  localStorage.setItem("nyra_proxies", JSON.stringify(proxies));
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
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

  // ── Rehydrate proxy list from localStorage on first mount ──
  useEffect(() => {
    const saved = loadSavedProxies();
    if (saved.length === 0) return;

    const activeSafe = localStorage.getItem("nyra_active_safe");
    const stealthKey = localStorage.getItem("nyra_stealth_key");

    setWallet((prev) => {
      // Don't overwrite if state already has proxies (e.g. navigating back)
      if ((prev.proxies?.length ?? 0) > 0) return prev;

      // Also sync to sessionStorage so walletController can find the keys
      if (activeSafe) sessionStorage.setItem("nyra_safe_address", activeSafe);
      if (stealthKey) sessionStorage.setItem("nyra_stealth_key", stealthKey);

      return {
        ...prev,
        isConnected: true,
        proxySafe: activeSafe ?? prev.proxySafe,
        stealthAccount: stealthKey ?? prev.stealthAccount,
        proxies: saved,
      };
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Main creation flow ──
  const handleCreate = async () => {
    setError(null);
    setProgress(0);

    try {
      if (!window.ethereum) throw new Error("No wallet detected");

      // 1. Ensure we are on the right network FIRST
      setPhase("switching");
      setProgress(8);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await ensureCorrectNetwork();

      // Re-create provider AFTER the network switch so it reflects the new chain
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 2. Sign message → derive stealth keys
      setPhase("signing");
      setProgress(25);

      const nonce = wallet.proxies?.length ?? 0;
      const result = await generateStealthProxy(signer, nonce);
      console.log("[Nyra] Stealth address (owner):", result.stealthAddress);
      console.log("[Nyra] Predicted Safe:", result.safeAddress);

      // 3. Visual pause for key derivation feedback
      setPhase("deriving");
      setProgress(50);
      await new Promise((resolve) => setTimeout(resolve, 700));

      // 4. Deploy Safe (MetaMask gas popup)
      setPhase("deploying");
      setProgress(72);

      const deployment = await deploySafeAccount(result.protocolKit, signer);

      setProgress(92);

      // 5. Build new proxy entry
      const newProxy: ProxyEntry = {
        num: nonce + 1,
        id: `${deployment.safeAddress.slice(0, 6)}...${deployment.safeAddress.slice(-4)}`,
        safe: deployment.safeAddress,
        balance: "0.00",
        active: true,
      };

      const updatedProxies = [...(wallet.proxies ?? []), newProxy];

      // 6. Persist to storage
      //    localStorage  → survives page refresh
      //    sessionStorage → walletController reads keys here at signing time
      localStorage.setItem("nyra_active_safe", deployment.safeAddress);
      localStorage.setItem("nyra_stealth_key", result.stealthPrivateKey);
      localStorage.setItem("nyra_stealth_address", result.stealthAddress);
      saveProxies(updatedProxies);

      sessionStorage.setItem("nyra_safe_address", deployment.safeAddress);
      sessionStorage.setItem("nyra_stealth_key", result.stealthPrivateKey);

      // 7. Update app state
      setWallet((prev) => ({
        ...prev,
        isConnected: true,
        proxySafe: deployment.safeAddress,
        stealthAddress: result.stealthAddress,
        stealthAccount: result.stealthPrivateKey,
        proxies: updatedProxies,
      }));

      setPhase("success");
      setProgress(100);

      // Reset back to idle after a short celebration window
      setTimeout(() => {
        setPhase("idle");
        setProgress(0);
      }, 5000);
    } catch (err: any) {
      console.error("[Nyra] Proxy creation failed:", err);
      const isRejection =
        err.code === 4001 ||
        err.message?.toLowerCase().includes("rejected") ||
        err.message?.toLowerCase().includes("denied");

      setError(
        isRejection
          ? "Signature or transaction rejected by user."
          : err.message || "Deployment failed. Make sure you have Sepolia ETH for gas."
      );
      setPhase("error");
      setProgress(0);
    }
  };

  // ── Derived UI state ──
  const currentStepIndex = STEPS.findIndex((s) => s.p === phase);
  const proxies: ProxyEntry[] = wallet.proxies ?? [];
  const isWorking =
    phase === "switching" ||
    phase === "signing" ||
    phase === "deriving" ||
    phase === "deploying";

  const cardGlow = phase === "error" ? "#ef4444" : C.accent;

  const phaseLabel =
    phase === "idle"       ? "Create Stealth Proxy" :
    phase === "success"    ? "✓ Proxy Created"       :
    phase === "error"      ? "Creation Failed"       :
                             "Processing...";

  const phaseDesc =
    phase === "error"     ? error :
    phase === "switching" ? "Switching to Arbitrum Sepolia..." :
    phase === "signing"   ? "Approve the signature in MetaMask..." :
    phase === "deriving"  ? "Deriving stealth keys from signature..." :
    phase === "deploying" ? "Deploying Safe — approve the gas tx in MetaMask..." :
    phase === "success"   ? "Your unlinkable proxy Safe is ready. Connect it to Hyperliquid." :
                            "Deriving secure stealth keys from your one-time signature.";

  return (
    <div className="anim-fade-up">
      <div className="grid gap-6" style={{ gridTemplateColumns: "400px 1fr" }}>

        {/* ── Left card: creation wizard ── */}
        <GlowCard glow={cardGlow}>
          <div className="text-center mb-6">
            <SignatureViz active={isWorking} />
          </div>

          <h3
            className="font-head text-[22px] font-extrabold text-center mb-2"
            style={{ color: phase === "error" ? "#ef4444" : C.white }}
          >
            {phaseLabel}
          </h3>

          <p className="text-[11px] text-center text-muted mb-6 leading-relaxed min-h-[48px]">
            {phaseDesc}
          </p>

          {/* Progress bar */}
          {isWorking && (
            <div className="mb-6 rounded-full overflow-hidden h-1.5 bg-primary/10">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`,
                  boxShadow: `0 0 12px ${C.accent}50`,
                }}
              />
            </div>
          )}

          {/* Step list */}
          <div className="flex flex-col gap-3 mb-6">
            {STEPS.map((s, i) => {
              const isActive = i === currentStepIndex;
              const isDone   = currentStepIndex > -1 && i < currentStepIndex;
              const isErr    = phase === "error" && i === currentStepIndex - 1;

              const borderColor = isErr      ? "#ef4444"
                                : isDone     ? C.success
                                : isActive   ? C.accent + "60"
                                :              C.primary + "20";

              const numColor    = isErr      ? "#ef4444"
                                : isDone     ? C.success
                                : isActive   ? C.accent
                                :              C.muted;

              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl transition-all p-3.5"
                  style={{
                    background: isActive ? `${C.primary}12` : "transparent",
                    border: `1px solid ${isActive || isErr || isDone ? borderColor : "transparent"}`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-mono shrink-0"
                    style={{
                      border: `2.5px solid ${borderColor}`,
                      color: numColor,
                      background: isErr ? "#ef444420" : "transparent",
                    }}
                  >
                    {isErr ? "!" : isDone ? "✓" : i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: isActive || isErr ? C.white : C.muted }}>
                      {s.label}
                    </div>
                    <div className="text-[10px] font-mono text-muted">{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          {phase === "error" ? (
            <div className="flex gap-3">
              <Btn variant="outline" full onClick={() => { setPhase("idle"); setError(null); }}>
                Try Again
              </Btn>
              <Btn variant="ghost" full onClick={() => { setPhase("idle"); setError(null); }}>
                Dismiss
              </Btn>
            </div>
          ) : (
            <Btn
              variant="primary"
              full
              onClick={handleCreate}
              disabled={isWorking}
            >
              {phase === "idle" ? (
                <><Wallet size={15} className="mr-2" /> Create Proxy Safe</>
              ) : phase === "success" ? (
                <><Check size={15} className="mr-2" /> Success — Create Another?</>
              ) : (
                <><RefreshCw size={15} className="mr-2 anim-spin" /> In Progress...</>
              )}
            </Btn>
          )}
        </GlowCard>

        {/* ── Right column: active proxies list ── */}
        <div>
          <div className="font-mono uppercase text-[10px] tracking-[3px] mb-4 text-muted">
            Active Proxies ({proxies.length})
          </div>

          <div className="flex flex-col gap-3">
            {proxies.length === 0 ? (
              <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center text-muted text-sm">
                No stealth proxies yet.<br />Create your first one above.
              </div>
            ) : (
              proxies.map((p, i) => (
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
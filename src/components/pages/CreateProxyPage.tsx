"use client";
import { useState, useEffect } from "react";
import { Wallet, RefreshCw, Check, AlertCircle } from "lucide-react";
import { GlowCard, Badge, Btn } from "@/components/ui";
import { C } from "@/lib/tokens";
import {
  apiRegister,
  apiGenerateAddress,
  apiDeriveKey,
  apiStealthAddresses,
  type StealthAddressEntry,
} from "@/lib/hyperStealth";
import { WalletState } from "../../App";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type Phase = "idle" | "registering" | "generating" | "deriving" | "success" | "error";

export interface ProxyEntry {
  num:     number;
  address: string;
}

const STEPS: { label: string; desc: string; p: Phase }[] = [
  { label: "Register EOA",         desc: "Sign to prove wallet ownership",    p: "registering" },
  { label: "Generate Address",     desc: "Server derives new stealth address", p: "generating"  },
  { label: "Retrieve Stealth Key", desc: "Sign to decrypt your private key",   p: "deriving"    },
  { label: "Ready",                desc: "Stealth address live",               p: "success"     },
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function loadSavedProxies(): ProxyEntry[] {
  try {
    const raw = localStorage.getItem("nyra_proxies");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveProxies(proxies: ProxyEntry[]): void {
  localStorage.setItem("nyra_proxies", JSON.stringify(proxies));
}

async function getConnectedEOA(): Promise<string> {
  if (!window.ethereum) throw new Error("No wallet detected");
  const accounts: string[] = await window.ethereum.request({ method: "eth_requestAccounts" });
  if (!accounts[0]) throw new Error("No account connected");
  return accounts[0];
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function CreateProxyPage({
  wallet,
  setWallet,
}: {
  wallet:    WalletState;
  setWallet: (fn: (prev: WalletState) => WalletState) => void;
}) {
  const [phase,    setPhase]    = useState<Phase>("idle");
  const [error,    setError]    = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // ── Rehydrate from localStorage on mount ──
  useEffect(() => {
    const saved         = loadSavedProxies();
    const activeAddress = localStorage.getItem("nyra_active_stealth");
    const stealthKey    = localStorage.getItem("nyra_stealth_key");
    const eoa           = localStorage.getItem("nyra_eoa");

    if (saved.length === 0 || !activeAddress) return;

    if (activeAddress) sessionStorage.setItem("nyra_stealth_address", activeAddress);
    if (stealthKey)    sessionStorage.setItem("nyra_stealth_key",     stealthKey);

    setWallet((prev) => {
      if ((prev.proxies?.length ?? 0) > 0) return prev;
      return {
        ...prev,
        isConnected:    true,
        eoa:            eoa ?? prev.eoa,
        activeProxy:    activeAddress,
        stealthAddress: activeAddress,
        proxies:        saved,
      };
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Also load stealth addresses from API if EOA is known ──
  useEffect(() => {
    const eoa = localStorage.getItem("nyra_eoa");
    if (!eoa || (wallet.proxies?.length ?? 0) > 0) return;

    // Silent background sync — don't block the UI
    apiStealthAddresses(eoa)
      .then((res) => {
        if (!res.stealthAddresses?.length) return;
        const proxies: ProxyEntry[] = res.stealthAddresses.map(
          (s: StealthAddressEntry, i: number) => ({ num: i + 1, address: s.address })
        );
        saveProxies(proxies);
        const active = proxies[proxies.length - 1].address;
        setWallet((prev) => ({
          ...prev,
          isConnected:    true,
          activeProxy:    prev.activeProxy ?? active,
          stealthAddress: prev.stealthAddress ?? active,
          proxies,
        }));
      })
      .catch(() => {/* silently ignore — user may not be registered yet */});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    setError(null);
    setProgress(0);

    try {
      // ── Step 1: get connected EOA ──
      const eoa = await getConnectedEOA();
      localStorage.setItem("nyra_eoa", eoa);
      sessionStorage.setItem("nyra_eoa", eoa);

      // ── Step 2: Register (or re-register — idempotent) ──
      setPhase("registering");
      setProgress(20);
      await apiRegister(eoa);
      console.log("[Nyra] EOA registered:", eoa);

      // ── Step 3: Generate a new stealth address ──
      setPhase("generating");
      setProgress(50);
      const { stealthAddress } = await apiGenerateAddress(eoa);
      console.log("[Nyra] New stealth address:", stealthAddress);

      // ── Step 4: Retrieve the private key for this stealth address ──
      setPhase("deriving");
      setProgress(75);
      const { stealthPrivateKey } = await apiDeriveKey(eoa, stealthAddress);
      console.log("[Nyra] Stealth key retrieved for:", stealthAddress);

      // ── Step 5: Persist ──
      const existing      = loadSavedProxies();
      const newProxy: ProxyEntry = {
        num:     existing.length + 1,
        address: stealthAddress,
      };
      const updated = [...existing, newProxy];
      saveProxies(updated);

      localStorage.setItem("nyra_active_stealth", stealthAddress);
      localStorage.setItem("nyra_stealth_key",    stealthPrivateKey);

      sessionStorage.setItem("nyra_stealth_address", stealthAddress);
      sessionStorage.setItem("nyra_stealth_key",     stealthPrivateKey);

      setWallet((prev) => ({
        ...prev,
        isConnected:    true,
        eoa,
        activeProxy:    stealthAddress,
        stealthAddress: stealthAddress,
        proxies:        updated,
      }));

      setProgress(100);
      setPhase("success");

      setTimeout(() => { setPhase("idle"); setProgress(0); }, 5000);
    } catch (err: any) {
      console.error("[Nyra] Create proxy failed:", err);
      const isRejection =
        err.code === 4001 ||
        err.message?.toLowerCase().includes("rejected") ||
        err.message?.toLowerCase().includes("denied");

      setError(
        isRejection
          ? "Signature rejected by user."
          : err.message ?? "Something went wrong. Try again."
      );
      setPhase("error");
      setProgress(0);
    }
  };

  // Switch active stealth address
  const handleSelect = (proxy: ProxyEntry) => {
    localStorage.setItem("nyra_active_stealth", proxy.address);
    sessionStorage.setItem("nyra_stealth_address", proxy.address);

    // Note: switching address requires fetching that address's key from backend.
    // For now we alert — full multi-key switching can be added later.
    setWallet((prev) => ({
      ...prev,
      activeProxy:    proxy.address,
      stealthAddress: proxy.address,
    }));
  };

  const currentStepIndex = STEPS.findIndex((s) => s.p === phase);
  const proxies: ProxyEntry[] = wallet.proxies ?? [];
  const isWorking = phase === "registering" || phase === "generating" || phase === "deriving";

  const phaseLabel =
    phase === "idle"    ? "Create Stealth Address" :
    phase === "success" ? "✓ Address Created"       :
    phase === "error"   ? "Creation Failed"         :
                          "Processing...";

  const phaseDesc =
    phase === "error"       ? error :
    phase === "registering" ? "Sign in MetaMask to register your wallet..." :
    phase === "generating"  ? "Server generating your stealth address..." :
    phase === "deriving"    ? "Sign in MetaMask to retrieve your private key..." :
    phase === "success"     ? "Stealth address ready. Connect it to Hyperliquid." :
                              "Two signatures derive an unlinkable Hyperliquid identity.";

  return (
    <div className="anim-fade-up">
      <div className="grid gap-6" style={{ gridTemplateColumns: "400px 1fr" }}>

        {/* Left: creation wizard */}
        <GlowCard glow={phase === "error" ? "#ef4444" : C.accent}>
          <h3
            className="font-head text-[22px] font-extrabold text-center mb-2"
            style={{ color: phase === "error" ? "#ef4444" : C.white }}
          >
            {phaseLabel}
          </h3>

          <p className="text-[11px] text-center text-muted mb-6 leading-relaxed min-h-[40px]">
            {phaseDesc}
          </p>

          {/* Progress bar */}
          {(isWorking || phase === "success") && (
            <div className="mb-6 rounded-full overflow-hidden h-1.5 bg-primary/10">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width:     `${progress}%`,
                  background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`,
                  boxShadow:  `0 0 12px ${C.accent}50`,
                }}
              />
            </div>
          )}

          {/* Steps */}
          <div className="flex flex-col gap-3 mb-6">
            {STEPS.map((s, i) => {
              const isActive = i === currentStepIndex;
              const isDone   = currentStepIndex > -1 && i < currentStepIndex;
              const isErr    = phase === "error" && i === currentStepIndex - 1;

              const borderColor = isErr    ? "#ef4444"
                                : isDone   ? C.success
                                : isActive ? C.accent + "60"
                                :            C.primary + "20";
              const numColor    = isErr    ? "#ef4444"
                                : isDone   ? C.success
                                : isActive ? C.accent
                                :            C.muted;

              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl transition-all p-3.5"
                  style={{
                    background: isActive ? `${C.primary}12` : "transparent",
                    border:     `1px solid ${isActive || isErr || isDone ? borderColor : "transparent"}`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-mono shrink-0"
                    style={{
                      border:     `2.5px solid ${borderColor}`,
                      color:      numColor,
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

          {/* Error state */}
          {phase === "error" && (
            <div className="mb-4 flex items-start gap-2 rounded-xl p-3" style={{ background: "#ef444410", border: "1px solid #ef444420" }}>
              <AlertCircle size={14} color="#ef4444" className="mt-0.5 shrink-0" />
              <span className="font-mono text-[10px]" style={{ color: "#ef4444" }}>{error}</span>
            </div>
          )}

          {/* Button */}
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
            <Btn variant="primary" full onClick={handleCreate} disabled={isWorking}>
              {phase === "idle" ? (
                <><Wallet size={15} className="mr-2" />Create Stealth Address</>
              ) : phase === "success" ? (
                <><Check size={15} className="mr-2" />Success — Create Another?</>
              ) : (
                <><RefreshCw size={15} className="mr-2 anim-spin" />In Progress...</>
              )}
            </Btn>
          )}
        </GlowCard>

        {/* Right: address list */}
        <div>
          <div className="font-mono uppercase text-[10px] tracking-[3px] mb-4 text-muted">
            Stealth Addresses ({proxies.length})
          </div>

          <div className="flex flex-col gap-3">
            {proxies.length === 0 ? (
              <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center text-muted text-sm">
                No stealth addresses yet.<br />Create your first one above.
              </div>
            ) : (
              proxies.map((p, i) => {
                const isActive = wallet.activeProxy === p.address;
                return (
                  <GlowCard key={i} onClick={() => handleSelect(p)} style={{ cursor: "pointer" }}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-extrabold font-head"
                          style={{ background: C.core, color: C.glow }}
                        >
                          {p.num}
                        </div>
                        <div>
                          <div className="font-medium text-white">Stealth #{p.num}</div>
                          <div className="font-mono text-xs text-muted mt-0.5 break-all">
                            {p.address.slice(0, 12)}...{p.address.slice(-10)}
                          </div>
                        </div>
                      </div>
                      <Badge variant={isActive ? "success" : "secondary"} pulse={isActive}>
                        {isActive ? "Active" : "Ready"}
                      </Badge>
                    </div>
                  </GlowCard>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { Link2, Check, RefreshCw, AlertCircle } from "lucide-react";
import { GlowCard, Badge, Btn, Input, SignatureViz } from "@/components/ui";
import { C } from "@/lib/tokens";
import { getAddress } from "viem";
import { getWeb3Wallet, disconnectAllSessions } from "@/lib/walletController";
import { WalletState } from "../../App";

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const CHAIN_ID = 421614; // Arbitrum Sepolia

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type Step = 0 | 1 | 2 | 3 | 4;
// 0 → select proxy
// 1 → paste WC URI
// 2 → connecting (pairing in progress)
// 3 → success
// 4 → error

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function ConnectPage({
  wallet,
  setWallet,
}: {
  wallet: WalletState;
  setWallet: (fn: (prev: WalletState) => WalletState) => void;
}) {
  const [step, setStep] = useState<Step>(0);
  const [uri, setUri] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Select a proxy from the list ──
  // Syncs BOTH safe address AND stealth key to sessionStorage so that
  // walletController can find the right key when signing.
  const selectProxy = (proxy: any) => {
    setWallet((prev) => ({ ...prev, proxySafe: proxy.safe }));
    sessionStorage.setItem("nyra_safe_address", proxy.safe);

    // Sync stealth key so walletController.getStoredKeys() works immediately
    const stealthKey = localStorage.getItem("nyra_stealth_key") ?? "";
    if (stealthKey) sessionStorage.setItem("nyra_stealth_key", stealthKey);

    // Sync stealth address so session_proposal can expose it to HL
    const stealthAddress = localStorage.getItem("nyra_stealth_address") ?? "";
    if (stealthAddress) sessionStorage.setItem("nyra_stealth_address", stealthAddress);
  };

  // ── WalletConnect pairing + session approval ──
  const handleConnect = async () => {
    const trimmed = uri.trim();
    if (!trimmed || !trimmed.startsWith("wc:")) return;

    setLoading(true);
    setStep(2); // show "connecting" state immediately

    try {
      console.log("[Nyra] Step 1: disconnecting old sessions...");
      await disconnectAllSessions();

      console.log("[Nyra] Step 2: getting fresh WC wallet...");
      const wc = await getWeb3Wallet();

      console.log("[Nyra] Step 3: wallet ready, registering session_proposal listener...");
      wc.on("session_proposal", async (proposal: any) => {
        console.log("[Nyra] session_proposal received!", proposal.id);
        try {
          // ── What address to expose to HL ──
          // personal_sign and eth_signTypedData both do ecrecover off-chain.
          // ecrecover returns the EOA that signed — the STEALTH address, not the Safe.
          // If we expose the Safe address, HL's ecrecover check returns stealthAddress
          // which doesn't match safeAddress → 500 Internal Server Error.
          //
          // Fix: expose the STEALTH address (EOA owner) for the session.
          // eth_sendTransaction still goes through the Safe via protocolKit internally.
          //
          // Priority: wallet state → sessionStorage → localStorage
          const stealthAddress =
            wallet.stealthAddress ??
            sessionStorage.getItem("nyra_stealth_address") ??
            localStorage.getItem("nyra_stealth_address");

          if (!stealthAddress) {
            throw new Error("No stealth address found — create a proxy first");
          }

          const signerAddress = getAddress(stealthAddress);

          const required = proposal.params.requiredNamespaces?.eip155 ?? {};
          const methods =
            required.methods?.length > 0
              ? required.methods
              : [
                  "eth_sendTransaction",
                  "eth_sign",
                  "personal_sign",
                  "eth_signTypedData",
                  "eth_signTypedData_v4",
                ];

          await wc.approveSession({
            id: proposal.id,
            namespaces: {
              eip155: {
                accounts: [`eip155:${CHAIN_ID}:${signerAddress}`], // stealth EOA, not Safe
                methods,
                events: ["accountsChanged", "chainChanged"],
                chains: [`eip155:${CHAIN_ID}`],
              },
            },
          });

          setWallet((prev) => ({ ...prev, isHLConnected: true }));
          setStep(3);
        } catch (e: any) {
          console.error("[Nyra] Session approval failed:", e);
          setErrorMsg(e.message ?? "Session approval failed");
          setStep(4);
        }
      });

      console.log("[Nyra] Step 4: calling pair() with URI:", trimmed.slice(0, 40) + "...");
      // This triggers the session_proposal event from the dapp
      await wc.core.pairing.pair({ uri: trimmed });
      console.log("[Nyra] Step 5: pair() resolved — waiting for session_proposal from HL...");
    } catch (err: any) {
      console.error("[Nyra] Pairing failed:", err);
      setErrorMsg(err.message ?? "Pairing failed");
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

  const proxies: any[] = wallet.proxies ?? [];

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[540px] mx-auto anim-fade-up">

      {/* ── Step 0: Select proxy ── */}
      {step === 0 && (
        <GlowCard>
          <div className="mb-6">
            <h3 className="font-head text-xl font-bold mb-1">Target Proxy</h3>
            <p className="text-[11px] text-muted uppercase tracking-wider">
              Select the Safe to link with Hyperliquid
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-7">
            {proxies.length === 0 ? (
              <div className="text-center py-12 text-muted text-sm border border-dashed border-white/10 rounded-2xl">
                No proxies available — create one first
              </div>
            ) : (
              proxies.map((p) => {
                const isActive = wallet.proxySafe === p.safe;
                return (
                  <div
                    key={p.safe}
                    onClick={() => selectProxy(p)}
                    className="p-4 rounded-xl border cursor-pointer transition-all hover:bg-white/[0.02]"
                    style={{
                      background: isActive ? `${C.primary}12` : "transparent",
                      borderColor: isActive ? C.accent : `${C.primary}20`,
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-body text-sm font-semibold text-white">
                        Proxy Safe #{p.num}
                      </div>
                      {isActive && <Badge variant="success">Selected</Badge>}
                    </div>
                    <div className="font-mono text-[10px] text-muted mt-1 break-all opacity-60">
                      {p.safe}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Btn
            variant="primary"
            full
            onClick={() => setStep(1)}
            disabled={!wallet.proxySafe}
          >
            Confirm Proxy & Continue
          </Btn>
        </GlowCard>
      )}

      {/* ── Step 1: Paste WC URI ── */}
      {step === 1 && (
        <GlowCard className="text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-accent/20">
              <Link2 size={28} className="text-accent" />
            </div>
            <h3 className="font-head text-xl font-bold mb-2">Connect Hyperliquid</h3>
            <p className="text-xs text-muted leading-relaxed px-6">
              Open Hyperliquid → Connect Wallet → WalletConnect → copy the URI and paste it below.
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
            disabled={loading || !uri.trim().startsWith("wc:")}
          >
            {loading && <RefreshCw className="anim-spin mr-2" size={15} />}
            Establish Handshake
          </Btn>

          <button
            onClick={() => setStep(0)}
            className="mt-4 text-[10px] font-mono text-muted hover:text-white uppercase tracking-widest"
          >
            ← Change Selected Proxy
          </button>
        </GlowCard>
      )}

      {/* ── Step 2: Connecting (pairing in progress) ── */}
      {step === 2 && (
        <GlowCard className="text-center py-10">
          <div className="mb-8">
            <SignatureViz active />
          </div>
          <h3 className="font-head text-xl font-bold mb-3">Initializing Session</h3>
          <p className="text-xs text-muted mb-7 px-8 leading-relaxed">
            Establishing encrypted tunnel between your Stealth Proxy and Hyperliquid...
          </p>
          <div className="flex items-center justify-center gap-2 font-mono text-[10px] text-accent animate-pulse uppercase tracking-[2px]">
            <span className="w-1.5 h-1.5 bg-accent rounded-full" />
            Waiting for Peer Response
          </div>
        </GlowCard>
      )}

      {/* ── Step 3: Success ── */}
      {step === 3 && (
        <GlowCard glow={C.success} className="text-center py-10">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-success/20">
            <Check size={40} className="text-success" />
          </div>
          <h3 className="font-head text-2xl font-bold mb-3">Tunnel Established</h3>
          <p className="text-sm text-muted mb-2 px-10 leading-relaxed">
            Your Proxy Safe is now securely linked. You can execute private trades on Hyperliquid.
          </p>
          <div className="font-mono text-[10px] text-muted/60 mb-8 break-all px-6">
            {wallet.proxySafe}
          </div>
          <Btn variant="primary" full onClick={reset}>
            Connect Another / Done
          </Btn>
        </GlowCard>
      )}

      {/* ── Step 4: Error ── */}
      {step === 4 && (
        <GlowCard className="text-center border-red-500/20">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h3 className="font-head text-xl font-bold mb-2 text-red-200">Handshake Failed</h3>
          <p className="text-xs text-muted mb-8 px-4 leading-relaxed">{errorMsg}</p>
          <div className="flex gap-3">
            <Btn variant="outline" full onClick={() => { setStep(1); setErrorMsg(null); }}>
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

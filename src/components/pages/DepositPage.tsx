"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownToLine, ArrowUpRight, RefreshCw, Check, AlertCircle, 
  ExternalLink, Loader2, ShieldCheck, ChevronRight, X
} from "lucide-react";
import { GlowCard, Badge, Btn, Input } from "@/components/ui";
import { C } from "@/lib/tokens";
import { parseUnits } from "viem";
import { 
  apiDeposit, apiWithdraw, apiBridge, apiGetBridgeStatus,
  getStoredEOA, getStoredStealthKey, getStoredStealthAddress 
} from "@/lib/hyperStealth";
import { WalletState } from "../../App";

// ─────────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────────
type Mode = "deposit" | "withdraw";
type Step = "IDLE" | "SIGNING_BRIDGE" | "BRIDGING" | "SIGNING_ACTION" | "SUBMITTING" | "SUCCESS" | "ERROR";

const USDC_DECIMALS = 6;
const MIN_DEPOSIT = 5;
const HORIZEN_ID = "0x2af";

// ─────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────

const ModalOverlay = ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
  >
    <motion.div 
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0c] shadow-2xl"
    >
      <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={20}/></button>
      {children}
    </motion.div>
  </motion.div>
);

export default function DepositPage({ wallet }: { wallet: WalletState }) {
  const [mode, setMode] = useState<Mode>("deposit");
  const [amount, setAmount] = useState("100");
  const [destination, setDestination] = useState("");
  
  // Transaction State
  const [step, setStep] = useState<Step>("IDLE");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [bridgeTx, setBridgeTx] = useState<string | null>(null);

  const stealthAddress = wallet.stealthAddress ?? getStoredStealthAddress();
  const eoaAddress = wallet.eoa ?? getStoredEOA();
  const isReady = !!(stealthAddress && eoaAddress);

  // ── LOGIC: DEPOSIT FLOW (BRIDGE -> DEPOSIT) ──
  const handleDeposit = async () => {
    if (!isReady) return setError("Identity missing");
    setError(null);
    setStep("SIGNING_BRIDGE");

    try {
      const rawAmount = parseUnits(amount, USDC_DECIMALS).toString();
      await switchChain(HORIZEN_ID);

    // STEP 2: APPROVE TOKEN (If needed)
    // You can add a checkAllowance here, but for now let's call approve
    console.log("[Bridge] Requesting Approval on Horizen...");
    await approveToken(HORIZEN_USDC, BRIDGE_CONTRACT, rawAmount);

    // STEP 3: SIGN BRIDGE (EIP-712)
    console.log("[Bridge] Signing Bridge Action...");
      // 1. Sign & Initiate Bridge (Horizen -> Arbitrum)
      const bridgeRes = await apiBridge(eoaAddress!, rawAmount);
      setBridgeTx(bridgeRes.txHash);
      setStep("BRIDGING");

      // 2. Poll Status until DELIVERED
      let delivered = false;
      while (!delivered) {
        const statusRes = await apiGetBridgeStatus(bridgeRes.txHash);
        if (statusRes.status === "DELIVERED") delivered = true;
        else if (statusRes.status === "FAILED") throw new Error("Bridge failed");
        else await new Promise(r => setTimeout(r, 5000)); // Poll every 5s
      }

      // 3. Sign Deposit (Stealth Key)
      setStep("SIGNING_ACTION");
      const stealthKey = getStoredStealthKey();
      if (!stealthKey) throw new Error("Stealth key missing");
      
      setStep("SUBMITTING");
      const depRes = await apiDeposit(eoaAddress!, stealthAddress!, rawAmount, stealthKey);
      
      setTxHash(depRes.txHash);
      setStep("SUCCESS");
    } catch (e: any) {
      setError(e.message || "Deposit failed");
      setStep("ERROR");
    }
  };

  async function switchChain(chainId: string) {
    if (!window.ethereum) throw new Error("No wallet found");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });
    } catch (err: any) {
      // If chain isn't added to MetaMask, you might need wallet_addEthereumChain here
      throw new Error(`Please switch your wallet to ${chainId === HORIZEN_ID ? 'Horizen' : 'Arbitrum'}`);
    }
  }
  
  /**
   * Standard ERC-20 Approval
   */
  async function approveToken(tokenAddress: string, spender: string, amount: string) {
    if (!window.ethereum) throw new Error("No wallet found");
    const [from] = await window.ethereum.request({ method: "eth_requestAccounts" });
  
    // Simple ERC-20 Approve Data: method id 0x095ea7b3 + spender + amount
    const data = `0x095ea7b3${spender.replace("0x", "").padStart(64, "0")}${BigInt(amount)
      .toString(16)
      .padStart(64, "0")}`;
  
    const tx = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{ from, to: tokenAddress, data }],
    });
  
    // Wait for approval to be mined (optional but recommended)
    console.log("Approval TX submitted:", tx);
    // You could use viem's waitForTransactionReceipt here
  }

  // ── LOGIC: WITHDRAW FLOW ──
  const handleWithdraw = async () => {
    if (!isReady || !destination) return setError("Check destination");
    setError(null);
    setStep("SIGNING_ACTION");

    try {
      const stealthKey = getStoredStealthKey();
      if (!stealthKey) throw new Error("Stealth key missing");
      
      const amountStr = parseFloat(amount).toFixed(1);
      
      setStep("SUBMITTING");
      await apiWithdraw(stealthKey, destination, amountStr);
      
      setStep("SUCCESS");
    } catch (e: any) {
      setError(e.message || "Withdraw failed");
      setStep("ERROR");
    }
  };

  return (
    <div className="anim-fade-up">
      {/* Mode Selector */}
      <div className="flex p-1 mb-8 rounded-2xl bg-white/5 w-fit border border-white/5">
        {(["deposit", "withdraw"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setStep("IDLE"); }}
            className={`px-6 py-2 rounded-xl font-mono text-xs transition-all ${mode === m ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlowCard>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Badge variant={mode === "deposit" ? "success" : "warning"} pulse>
                {mode === "deposit" ? "Bridge + Deposit" : "Direct Withdrawal"}
              </Badge>
              <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">HL Mainnet</div>
            </div>

            <Input label="Amount (USDC)" value={amount} onChange={setAmount} suffix="USDC" mono />

            {mode === "withdraw" && (
              <Input label="Recipient Address" value={destination} onChange={setDestination} placeholder="0x..." mono />
            )}

            <Btn 
              variant={mode === "deposit" ? "success" : "primary"} 
              full 
              onClick={mode === "deposit" ? handleDeposit : handleWithdraw}
              disabled={step !== "IDLE" || !isReady}
            >
              {mode === "deposit" ? "Initiate Secure Bridge" : "Withdraw Funds"}
            </Btn>
          </div>
        </GlowCard>

        {/* Info/Status Preview Card */}
        <div className="space-y-4">
          <GlowCard glow={C.accent}>
            <div className="font-mono text-[10px] text-white/40 mb-3 uppercase">Active Stealth Account</div>
            <div className="text-xs font-mono break-all text-white/80">{stealthAddress || "Not Connected"}</div>
          </GlowCard>
          
          <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
            <h4 className="text-xs font-mono text-white/40 uppercase mb-4">Security Protocol</h4>
            <div className="space-y-3">
              <div className="flex gap-3 text-[11px] text-white/60">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Zero-knowledge stealth derivation</span>
              </div>
              <div className="flex gap-3 text-[11px] text-white/60">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>EIP-712 Permit-based authorization</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TRANSACTION OVERLAY ── */}
      <AnimatePresence>
        {step !== "IDLE" && (
          <ModalOverlay onClose={() => setStep("IDLE")}>
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex p-4 rounded-full bg-white/5 mb-4">
                  {step === "ERROR" ? <AlertCircle size={32} className="text-red-500" /> : 
                   step === "SUCCESS" ? <Check size={32} className="text-emerald-500" /> : 
                   <Loader2 size={32} className="text-blue-500 animate-spin" />}
                </div>
                <h3 className="text-xl font-bold text-white">
                  {step === "SUCCESS" ? "Transaction Complete" : 
                   step === "ERROR" ? "Action Failed" : "Processing Transaction"}
                </h3>
                <p className="text-xs text-white/40 mt-1">Please keep this window open</p>
              </div>

              {/* Progress Steps */}
              <div className="space-y-6">
                <ProgressStep 
                  label="Authorize Bridge" 
                  sub="Sign EIP-712 on Horizen" 
                  status={step === "SIGNING_BRIDGE" ? "active" : (mode === "withdraw" || step === "BRIDGING" || step === "SIGNING_ACTION" || step === "SUBMITTING" || step === "SUCCESS" ? "done" : "pending")} 
                />
                
                {mode === "deposit" && (
                  <ProgressStep 
                    label="Bridging Funds" 
                    sub="Stargate V2: Horizen → Arbitrum" 
                    status={step === "BRIDGING" ? "active" : (step === "SIGNING_ACTION" || step === "SUBMITTING" || step === "SUCCESS" ? "done" : "pending")} 
                  />
                )}

                <ProgressStep 
                  label="Final Confirmation" 
                  sub={mode === "deposit" ? "Signing HL Deposit Permit" : "Signing HL Withdrawal"} 
                  status={step === "SIGNING_ACTION" ? "active" : (step === "SUBMITTING" || step === "SUCCESS" ? "done" : "pending")} 
                />

                <ProgressStep 
                  label="Settlement" 
                  sub="Hyperliquid ledger update" 
                  status={step === "SUBMITTING" ? "active" : (step === "SUCCESS" ? "done" : "pending")} 
                />
              </div>

              {/* Error Message */}
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <p className="text-[11px] text-red-400 font-mono leading-relaxed">{error}</p>
                </motion.div>
              )}

              {/* Success View */}
              {step === "SUCCESS" && (
                <div className="mt-8 space-y-3">
                  <Btn variant="primary" full onClick={() => setStep("IDLE")}>Close & Return</Btn>
                  {txHash && (
                    <a href={`https://arbiscan.io/tx/${txHash}`} target="_blank" className="flex items-center justify-center gap-2 text-[10px] font-mono text-white/40 hover:text-white transition-colors">
                      VERIFY ON EXPLORER <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProgressStep({ label, sub, status }: { label: string, sub: string, status: "pending" | "active" | "done" }) {
  return (
    <div className={`flex items-start gap-4 transition-opacity duration-500 ${status === "pending" ? "opacity-30" : "opacity-100"}`}>
      <div className={`mt-1 flex items-center justify-center w-5 h-5 rounded-full border ${
        status === "done" ? "bg-emerald-500 border-emerald-500" : 
        status === "active" ? "border-blue-500" : "border-white/20"
      }`}>
        {status === "done" ? <Check size={12} className="text-black" /> : 
         status === "active" ? <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> : null}
      </div>
      <div>
        <div className="text-xs font-bold text-white leading-none mb-1">{label}</div>
        <div className="text-[10px] font-mono text-white/40">{sub}</div>
      </div>
    </div>
  );
}

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
  apiDeposit, apiWithdraw, apiBridge, apiGetBridgeStatus, apiGetBalance,
  getStoredEOA, getStoredStealthAddress
} from "@/lib/hyperStealth";
import { WalletState } from "../../App";

// ─────────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────────
type Mode = "deposit" | "withdraw";
type DepositMethod = "bridge" | "direct";
type Step = "IDLE" | "SIGNING_BRIDGE" | "BRIDGING" | "SIGNING_ACTION" | "SUBMITTING" | "SUCCESS" | "ERROR";

const USDC_DECIMALS = 6;
const MIN_DEPOSIT = 5;
const HORIZEN_ID = "0x6792";
const ARBITRUM_ID = "0xa4b1";
const HORIZEN_USDC = "0xDF7108f8B10F9b9eC1aba01CCa057268cbf86B6c";  // USDC.e on Horizen
const CENTRAL_WALLET = "0xFB3fF1767A0a6c0d3b5fE61882B1460458372FCF"; // approval target for bridge transferFrom

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
  const [depositMethod, setDepositMethod] = useState<DepositMethod>("bridge");
  const [amount, setAmount] = useState("10");
  const [destination, setDestination] = useState("");
  
  // Transaction State
  const [step, setStep] = useState<Step>("IDLE");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [bridgeTx, setBridgeTx] = useState<string | null>(null);

  const stealthAddress = wallet.stealthAddress ?? getStoredStealthAddress();
  const eoaAddress = wallet.eoa ?? getStoredEOA();
  const isReady = !!(stealthAddress && eoaAddress);

  // ── BALANCE STATE ──
  const [availableBalance, setAvailableBalance] = useState<string | null>(null);

  useEffect(() => {
    if (!eoaAddress) return;
    const fetchBal = async () => {
      try {
        const bal = await apiGetBalance(eoaAddress);
        setAvailableBalance(bal.available || "0");
      } catch { /* ignore */ }
    };
    fetchBal();
    const interval = setInterval(fetchBal, 10000);
    return () => clearInterval(interval);
  }, [eoaAddress]);

  const availableUSDC = availableBalance ? (Number(availableBalance) / 1e6).toFixed(2) : "...";

  // ── LOGIC: DIRECT DEPOSIT (deposit available server-side balance to HL) ──
  const handleDirectDeposit = async () => {
    if (!isReady) return setError("Identity missing");
    setError(null);

    try {
      const bal = await apiGetBalance(eoaAddress!);
      const available = BigInt(bal.available || "0");

      if (available < BigInt(5_000_000)) {
        throw new Error(`Insufficient available balance: $${(Number(available) / 1e6).toFixed(2)} USDC. Bridge funds first.`);
      }

      // Deposit all available balance to HL
      setStep("SIGNING_ACTION");

      setStep("SUBMITTING");
      const depRes = await apiDeposit(eoaAddress!, stealthAddress!, available.toString());

      setTxHash(depRes.txHash);
      setStep("SUCCESS");
      setAvailableBalance("0");
    } catch (e: any) {
      setError(e.message || "Deposit failed");
      setStep("ERROR");
    }
  };

  // ── LOGIC: BRIDGE + DEPOSIT (Horizen → Arbitrum → HL) ──
  const [busy, setBusy] = useState(false);
  const handleBridgeDeposit = async () => {
    if (!isReady) return setError("Identity missing");
    if (busy) return; // prevent double-calls
    setBusy(true);
    setError(null);

    try {
      // Check existing available balance first (retry scenario)
      const existingBal = await apiGetBalance(eoaAddress!);
      const existingAvailable = BigInt(existingBal.available || "0");
      const rawAmount = parseUnits(amount, USDC_DECIMALS).toString();

      let depositAmount: string;

      if (existingAvailable >= BigInt(5_000_000)) {
        // Skip bridge — user already has funds from a previous bridge
        console.log("[Bridge Deposit] Existing balance found, skipping bridge:", existingAvailable.toString());
        depositAmount = existingAvailable.toString();
      } else {
        // Need to bridge first
        setStep("SIGNING_BRIDGE");
        await switchChain(HORIZEN_ID);

        // Check on-chain USDC.e balance before proceeding
        const onChainBal = await getTokenBalance(HORIZEN_USDC, eoaAddress!);
        if (BigInt(onChainBal) < BigInt(rawAmount)) {
          const have = (Number(onChainBal) / 1e6).toFixed(2);
          const need = amount;
          throw new Error(`Insufficient USDC.e on Horizen: you have ${have}, need ${need}`);
        }

        // Approve token (if needed)
        console.log("[Bridge] Requesting Approval on Horizen...");
        await approveToken(HORIZEN_USDC, CENTRAL_WALLET, rawAmount);

        // Sign & Initiate Bridge (Horizen -> Arbitrum)
        console.log("[Bridge] Signing Bridge Action...");
        const bridgeRes = await apiBridge(eoaAddress!, rawAmount);
        setBridgeTx(bridgeRes.txHash);
        setStep("BRIDGING");

        // Poll Status until DELIVERED
        let delivered = false;
        while (!delivered) {
          const statusRes = await apiGetBridgeStatus(bridgeRes.txHash);
          if (statusRes.status === "DELIVERED") delivered = true;
          else if (statusRes.status === "FAILED") throw new Error("Bridge failed");
          else await new Promise(r => setTimeout(r, 5000));
        }

        // Switch back to Arbitrum for deposit
        await switchChain(ARBITRUM_ID);

        // Fetch actual available balance (after Stargate fees)
        const balRes = await apiGetBalance(eoaAddress!);
        depositAmount = balRes.available;
        if (!depositAmount || depositAmount === "0") throw new Error("No available balance after bridge");
      }

      // Sign Deposit (EOA signs EIP-712, server uses stealth key for permit)
      setStep("SIGNING_ACTION");

      setStep("SUBMITTING");
      const depRes = await apiDeposit(eoaAddress!, stealthAddress!, depositAmount);

      setTxHash(depRes.txHash);
      setStep("SUCCESS");
    } catch (e: any) {
      setError(e.message || "Deposit failed");
      setStep("ERROR");
    } finally {
      setBusy(false);
    }
  };

  const handleDeposit = depositMethod === "bridge" ? handleBridgeDeposit : handleDirectDeposit;

  const CHAIN_CONFIG: Record<string, { name: string; rpcUrl: string; nativeCurrency: { name: string; symbol: string; decimals: number } }> = {
    [HORIZEN_ID]: { name: "Horizen Mainnet", rpcUrl: "https://horizen.calderachain.xyz/http", nativeCurrency: { name: "ZEN", symbol: "ZEN", decimals: 18 } },
    [ARBITRUM_ID]: { name: "Arbitrum One", rpcUrl: "https://arb1.arbitrum.io/rpc", nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 } },
  };

  async function switchChain(chainId: string) {
    if (!window.ethereum) throw new Error("No wallet found");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });
    } catch (err: any) {
      // 4902 = chain not added to wallet — try adding it
      if (err.code === 4902) {
        const cfg = CHAIN_CONFIG[chainId];
        if (cfg) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{ chainId, chainName: cfg.name, rpcUrls: [cfg.rpcUrl], nativeCurrency: cfg.nativeCurrency }],
          });
          return;
        }
      }
      throw err;
    }
  }
  
  /**
   * Standard ERC-20 Approval
   */
  async function approveToken(tokenAddress: string, spender: string, amount: string) {
    if (!window.ethereum) throw new Error("No wallet found");
    const [from] = await window.ethereum.request({ method: "eth_requestAccounts" });

    // ERC-20 approve(spender, amount) — 0x095ea7b3
    const data = `0x095ea7b3${spender.replace("0x", "").padStart(64, "0")}${BigInt(amount)
      .toString(16)
      .padStart(64, "0")}`;

    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{ from, to: tokenAddress, data }],
    });
    console.log("[Approve] TX submitted:", txHash);

    // Wait for approval to be mined before proceeding
    let receipt = null;
    while (!receipt) {
      await new Promise(r => setTimeout(r, 2000));
      receipt = await window.ethereum.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      });
    }
    if (receipt.status === "0x0") throw new Error("Approval transaction reverted");
    console.log("[Approve] Mined ✓");
  }

  /**
   * Read ERC-20 balanceOf via eth_call
   */
  async function getTokenBalance(tokenAddress: string, owner: string): Promise<string> {
    if (!window.ethereum) throw new Error("No wallet found");
    // balanceOf(address) — 0x70a08231
    const data = `0x70a08231${owner.replace("0x", "").padStart(64, "0")}`;
    const result = await window.ethereum.request({
      method: "eth_call",
      params: [{ to: tokenAddress, data }, "latest"],
    });
    return BigInt(result).toString();
  }

  /**
   * Standard ERC-20 transfer
   */
  async function transferToken(tokenAddress: string, to: string, amount: string) {
    if (!window.ethereum) throw new Error("No wallet found");
    const [from] = await window.ethereum.request({ method: "eth_requestAccounts" });

    // ERC-20 transfer(to, amount) — 0xa9059cbb
    const data = `0xa9059cbb${to.replace("0x", "").padStart(64, "0")}${BigInt(amount)
      .toString(16)
      .padStart(64, "0")}`;

    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{ from, to: tokenAddress, data }],
    });
    console.log("[Transfer] TX submitted:", txHash);

    let receipt = null;
    while (!receipt) {
      await new Promise(r => setTimeout(r, 2000));
      receipt = await window.ethereum.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      });
    }
    if (receipt.status === "0x0") throw new Error("Transfer transaction reverted");
    console.log("[Transfer] Mined ✓");
  }

  // ── LOGIC: WITHDRAW FLOW ──
  const handleWithdraw = async () => {
    if (!isReady || !destination) return setError("Check destination");
    setError(null);
    setStep("SIGNING_ACTION");

    try {
      const rawAmount = parseUnits(amount, USDC_DECIMALS).toString();

      setStep("SUBMITTING");
      await apiWithdraw(eoaAddress!, stealthAddress!, destination, rawAmount);

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
                {mode === "deposit"
                  ? (depositMethod === "bridge" ? "Bridge + Deposit" : "Direct Deposit")
                  : "Direct Withdrawal"}
              </Badge>
              <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">HL Mainnet</div>
            </div>

            {/* Deposit Method Selector */}
            {mode === "deposit" && (
              <div className="flex p-1 rounded-xl bg-white/5 border border-white/5">
                {([["bridge", "Bridge from Horizen"], ["direct", "Deposit Available"]] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setDepositMethod(key as DepositMethod)}
                    className={`flex-1 px-3 py-2 rounded-lg font-mono text-[10px] transition-all ${
                      depositMethod === key ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Available balance display for direct deposit */}
            {mode === "deposit" && depositMethod === "direct" && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-mono text-white/40 uppercase mb-1">Available to Deposit</div>
                <div className="text-lg font-bold font-mono text-white">{availableUSDC} <span className="text-xs text-white/40">USDC</span></div>
                <div className="text-[10px] font-mono text-white/30 mt-1">Funds held by server from previous bridges</div>
              </div>
            )}

            {/* Amount input — only for bridge and withdraw */}
            {(mode === "withdraw" || (mode === "deposit" && depositMethod === "bridge")) && (
              <Input label="Amount (USDC)" value={amount} onChange={setAmount} suffix="USDC" mono />
            )}

            {mode === "withdraw" && (
              <Input label="Recipient Address" value={destination} onChange={setDestination} placeholder="0x..." mono />
            )}

            <Btn
              variant={mode === "deposit" ? "success" : "primary"}
              full
              onClick={mode === "deposit" ? handleDeposit : handleWithdraw}
              disabled={step !== "IDLE" || !isReady}
            >
              {mode === "deposit"
                ? (depositMethod === "bridge" ? "Bridge & Deposit" : "Deposit USDC")
                : "Withdraw Funds"}
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
                {/* Bridge steps — only for bridge deposit method */}
                {mode === "deposit" && depositMethod === "bridge" && (
                  <>
                    <ProgressStep
                      label="Authorize Bridge"
                      sub="Sign EIP-712 on Horizen"
                      status={step === "SIGNING_BRIDGE" ? "active" : (step === "BRIDGING" || step === "SIGNING_ACTION" || step === "SUBMITTING" || step === "SUCCESS" ? "done" : "pending")}
                    />
                    <ProgressStep
                      label="Bridging Funds"
                      sub="Stargate V2: Horizen → Arbitrum"
                      status={step === "BRIDGING" ? "active" : (step === "SIGNING_ACTION" || step === "SUBMITTING" || step === "SUCCESS" ? "done" : "pending")}
                    />
                  </>
                )}

                <ProgressStep
                  label={mode === "withdraw" ? "Sign Withdrawal" : "Sign Deposit"}
                  sub={mode === "withdraw" ? "EIP-712 withdrawal authorization" : "EIP-712 deposit permit"}
                  status={step === "SIGNING_ACTION" ? "active" : (step === "SUBMITTING" || step === "SUCCESS" ? "done" : "pending")}
                />

                <ProgressStep
                  label="Settlement"
                  sub="Hyperliquid ledger update"
                  status={step === "SUBMITTING" ? "active" : (step === "SUCCESS" ? "done" : "pending")}
                />
              </div>

              {/* Error Message + Retry */}
              {step === "ERROR" && error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-3">
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <p className="text-[11px] text-red-400 font-mono leading-relaxed">{error}</p>
                  </div>
                  <div className="flex gap-2">
                    {mode === "deposit" && depositMethod === "bridge" && (
                      <Btn variant="primary" full onClick={async () => {
                        try {
                          await switchChain(HORIZEN_ID);
                          setStep("IDLE"); setError(null);
                          handleBridgeDeposit();
                        } catch { /* user rejected */ }
                      }}>
                        Switch to Horizen & Retry
                      </Btn>
                    )}
                    {mode === "deposit" && depositMethod === "direct" && (
                      <Btn variant="primary" full onClick={async () => {
                        try {
                          await switchChain(ARBITRUM_ID);
                          setStep("IDLE"); setError(null);
                          handleDirectDeposit();
                        } catch { /* user rejected */ }
                      }}>
                        Switch to Arbitrum & Retry
                      </Btn>
                    )}
                    <Btn variant="primary" full onClick={() => { setStep("IDLE"); setError(null); }}>
                      Dismiss
                    </Btn>
                  </div>
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

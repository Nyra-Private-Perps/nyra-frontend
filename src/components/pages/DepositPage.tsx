import { useState } from "react";
import { ArrowDownToLine, ArrowUpRight, RefreshCw, Check } from "lucide-react";
import { GlowCard, Badge, Btn, Input, FlowViz } from "@/components/ui";
import { C, TRANSACTIONS } from "@/lib/tokens";

export default function DepositPage() {
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("1000");
  const [status, setStatus] = useState<"idle" | "pending" | "confirmed">("idle");

  const go = () => {
    setStatus("pending");
    setTimeout(() => setStatus("confirmed"), 2500);
    setTimeout(() => setStatus("idle"), 5500);
  };

  return (
    <div className="anim-fade-up">
      <div className="flex gap-2 mb-7">
        <Btn variant={mode === "deposit" ? "primary" : "secondary"} onClick={() => setMode("deposit")}><ArrowDownToLine size={14} /> Deposit</Btn>
        <Btn variant={mode === "withdraw" ? "primary" : "secondary"} onClick={() => setMode("withdraw")}><ArrowUpRight size={14} /> Withdraw</Btn>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <GlowCard>
          <Badge variant={mode === "deposit" ? "success" : "warning"} pulse>{mode === "deposit" ? "Horizon → TEE → Proxy" : "Hyperliquid → Wallet"}</Badge>
          <div className="mt-5"><Input label="Amount" value={amount} onChange={setAmount} suffix="USDC" mono /></div>
          <div className="flex gap-1.5 mb-5">
            {["100", "500", "1000", "5000", "MAX"].map((v) => (
              <button key={v} onClick={() => v !== "MAX" && setAmount(v)} className="flex-1 py-2.5 font-mono text-[11px] font-semibold rounded-lg cursor-pointer transition-all duration-200"
                style={{ background: amount === v ? `${C.primary}22` : `${C.void}CC`, border: `1px solid ${amount === v ? C.primary + "45" : C.primary + "10"}`, color: amount === v ? C.accent : C.muted }}>{v}</button>
            ))}
          </div>
          {mode === "deposit" && (
            <div className="mb-5 rounded-xl" style={{ padding: 16, background: `${C.primary}06`, border: `1px solid ${C.primary}12` }}>
              <div className="font-mono text-[9px] tracking-[3px] uppercase mb-2.5" style={{ color: C.muted }}>Privacy Route</div>
              <FlowViz steps={["Horizon", "TEE Enclave", "Proxy Safe", "Hyperliquid"]} />
            </div>
          )}
          <Btn variant={mode === "deposit" ? "success" : "primary"} full onClick={go}>
            {status === "pending" ? <><RefreshCw size={14} className="anim-spin" /> Processing...</> : status === "confirmed" ? <><Check size={14} /> Confirmed</> : mode === "deposit" ? <><ArrowDownToLine size={14} /> Deposit via TEE</> : <><ArrowUpRight size={14} /> Withdraw</>}
          </Btn>
          {status === "pending" && (
            <div className="mt-3.5 flex items-center gap-2.5 rounded-lg anim-fade-up" style={{ padding: 12, background: `${C.warning}08`, border: `1px solid ${C.warning}12` }}>
              <RefreshCw size={13} color={C.warning} className="anim-spin" />
              <span className="font-mono text-[10px]" style={{ color: C.warning }}>Polling deposit status every 3s...</span>
            </div>
          )}
          {status === "confirmed" && (
            <div className="mt-3.5 flex items-center gap-2.5 rounded-lg anim-fade-up" style={{ padding: 12, background: `${C.success}08`, border: `1px solid ${C.success}15` }}>
              <Check size={14} color={C.success} />
              <span className="font-mono text-[10px]" style={{ color: C.success }}>Funds arrived in proxy safe. Ready to trade.</span>
            </div>
          )}
        </GlowCard>
        <div className="flex flex-col gap-3.5">
          <GlowCard glow={C.accent}>
            <div className="font-mono text-[9px] tracking-[3px] uppercase mb-3.5" style={{ color: C.muted }}>Proxy Safe Balance</div>
            <div className="font-head text-[44px] font-extrabold tracking-tighter" style={{ color: C.pure }}>$12,450<span className="text-2xl" style={{ color: C.glow }}>.00</span></div>
            <div className="mt-2.5 flex items-center gap-2"><Badge variant="success" pulse>Available</Badge><span className="font-body text-xs" style={{ color: C.muted }}>across 3 safes</span></div>
          </GlowCard>
          <GlowCard>
            <div className="font-mono text-[9px] tracking-[3px] uppercase mb-3.5" style={{ color: C.muted }}>Recent Activity</div>
            {TRANSACTIONS.map((tx, i) => (
              <div key={i} className="flex justify-between items-center anim-fade-up" style={{ padding: "12px 0", borderBottom: i < TRANSACTIONS.length - 1 ? `1px solid ${C.primary}06` : "none", animationDelay: `${i * 0.08}s` }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center" style={{ background: `${tx.color === "success" ? C.success : C.warning}0C`, border: `1px solid ${tx.color === "success" ? C.success : C.warning}18` }}>
                    {tx.type === "Deposit" ? <ArrowDownToLine size={13} color={C.success} /> : <ArrowUpRight size={13} color={C.warning} />}
                  </div>
                  <div><div className="font-body text-[13px] font-medium" style={{ color: C.white }}>{tx.type}</div><div className="font-mono text-[10px]" style={{ color: C.muted }}>{tx.time}</div></div>
                </div>
                <span className="font-mono text-[13px] font-bold" style={{ color: tx.color === "success" ? C.success : C.warning }}>{tx.amount}</span>
              </div>
            ))}
          </GlowCard>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, type FC, type ElementType, useEffect } from "react";
import { 
  ArrowDownToLine, ArrowUpRight, ArrowLeftRight, RefreshCw, Send, 
  ChevronDown, Lock, X, Wallet, BarChart3, Clock, History, 
  Percent, Activity, CreditCard, Filter, Loader2 
} from "lucide-react";
import { GlowCard, Badge, Btn, MiniChart } from "@/components/ui";
import { C } from "@/lib/tokens";
import { fetchHL, fmt, numFmt } from "@/lib/hyperliquid"; // Our TS helper
import { WalletState } from "../../App";

interface PortfolioProps {
  wallet: WalletState;
}

const PortfolioPage: FC<PortfolioProps> = ({ wallet }) => {
  const [tab, setTab] = useState("positions");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    const loadPortfolio = async () => {
      if (!wallet.stealthAddress) return;
      setLoading(true);
      try {
        // Fetch Metadata (for coin names/decimals) and User State in parallel
        const [clearinghouse, metadata] = await Promise.all([
          fetchHL("clearinghouseState", { user: wallet.stealthAddress }),
          fetchHL("meta")
        ]);

        setData(clearinghouse);
        setMeta(metadata);
      } catch (e) {
        console.error("Failed to load portfolio:", e);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, [wallet.stealthAddress]);

  if (!wallet.stealthAddress) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Lock size={40} className="text-muted mb-4 opacity-20" />
        <h3 className="text-xl font-bold">Steaalth Address Required</h3>
        <p className="text-muted">Create a Steaalth Address to view your private portfolio.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  // Extract Stats from API
  const marginSummary = data?.marginSummary || {};
  const positions = data?.assetPositions || [];
  const accountValue = parseFloat(marginSummary.accountValue || "0");
  const totalEquity = parseFloat(marginSummary.withdrawable || "0");
  const totalPnl = positions.reduce((acc: number, p: any) => acc + parseFloat(p.position.unrealizedPnl), 0);

  return (
    <div className="anim-fade-up">
      {/* 1. Header Stats */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "260px 1fr 1fr" }}>
        <div className="flex flex-col gap-3">
          <GlowCard>
            <div className="font-body text-xs mb-2.5" style={{ color: C.muted }}>Net Account Value</div>
            <div className="font-head text-4xl font-extrabold tracking-tight" style={{ color: C.pure }}>
              {fmt.format(accountValue)}
            </div>
            <div className="mt-2">
              <span className={`font-mono text-[11px] ${totalPnl >= 0 ? 'text-success' : 'text-danger'}`}>
                {totalPnl >= 0 ? "+" : ""}{fmt.format(totalPnl)} Unrealized
              </span>
            </div>
          </GlowCard>
          
          <GlowCard>
            <div className="font-body text-xs mb-1">Withdrawable Balance</div>
            <div className="font-head text-2xl font-bold tracking-tight" style={{ color: C.pure }}>
              {fmt.format(totalEquity)}
            </div>
          </GlowCard>
        </div>

        {/* 2. Clearinghouse Summary */}
        <GlowCard noPad>
          <div className="flex justify-between items-center" style={{ padding: "14px 20px 10px", borderBottom: `1px solid ${C.primary}08` }}>
            <span className="font-body text-xs text-silver">Account Health</span>
            <Badge variant={parseFloat(marginSummary.maintenanceMarginRatio) > 0.5 ? "danger" : "success"}>
              {numFmt(parseFloat(marginSummary.maintenanceMarginRatio || "0") * 100)}% Used
            </Badge>
          </div>
          <div style={{ padding: "6px 0" }}>
            <StatRow label="Total Margin Used" value={fmt.format(parseFloat(marginSummary.totalMarginUsed || "0"))} />
            <StatRow label="Maintenance Margin" value={fmt.format(parseFloat(marginSummary.maintenanceMargin || "0"))} />
            <StatRow label="Available to Open" value={fmt.format(parseFloat(marginSummary.withdrawable || "0"))} />
          </div>
        </GlowCard>

        {/* 3. Account Value History (Mocked colors based on real PNL) */}
        <GlowCard>
          <div className="font-body text-[13px] text-white mb-4">Account Value (30D)</div>
          <MiniChart data={[accountValue * 0.9, accountValue * 0.95, accountValue]} color={C.accent} w={320} h={100} />
          <div className="flex justify-between mt-4">
             <span className="text-[10px] text-muted uppercase font-mono">Real-time update</span>
             <Badge variant="active">Live</Badge>
          </div>
        </GlowCard>
      </div>

      {/* 4. Positions Table */}
      <div className="flex gap-0" style={{ borderBottom: `1px solid ${C.primary}10` }}>
         <button className="flex items-center gap-1.5 p-[11px_18px] text-white font-bold text-xs border-b-2 border-accent">
            <BarChart3 size={12} /> Positions ({positions.length})
         </button>
      </div>

      <GlowCard noPad className="!rounded-t-none !border-t-0">
        <div className="grid gap-2 items-center" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 0.5fr", padding: "12px 20px", borderBottom: `1px solid ${C.primary}08` }}>
          {["Asset", "Size", "Entry Price", "Mark Price", "PNL", "ROE", "Action"].map((h) => (
            <div key={h} className="font-mono text-[9px] font-semibold tracking-[2px] uppercase text-muted">{h}</div>
          ))}
        </div>
        
        {positions.length === 0 ? (
          <div className="py-20 text-center text-muted text-sm">No active positions</div>
        ) : (
          positions.map((item: any, i: number) => {
            const pos = item.position;
            const coinMeta = meta?.universe[pos.coinIndex];
            const pnl = parseFloat(pos.unrealizedPnl);
            const size = parseFloat(pos.szi);
            const entry = parseFloat(pos.entryPx);
            
            return (
              <div key={i} className="grid gap-2 items-center hover:bg-white/[0.02] p-[14px_20px] border-b border-white/5">
                <div className="font-body text-[13px] font-bold text-white">{pos.coin}</div>
                <div className={`font-mono text-xs ${size < 0 ? 'text-danger' : 'text-success'}`}>{size}</div>
                <div className="font-mono text-xs text-silver">{numFmt(entry)}</div>
                <div className="font-mono text-xs text-silver">{numFmt(pos.markPx)}</div>
                <div className={`font-mono text-xs font-bold ${pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                  {pnl >= 0 ? "+" : ""}{numFmt(pnl)}
                </div>
                <div className="font-mono text-xs text-muted">--</div>
                <Btn variant="danger" size="sm" className="!p-[4px_8px] !text-[10px]">Close</Btn>
              </div>
            );
          })
        )}
      </GlowCard>
    </div>
  );
};

const StatRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between p-[9px_20px] hover:bg-white/[0.02]">
    <span className="font-body text-[13px] text-muted">{label}</span>
    <span className="font-mono text-[13px] font-semibold text-white">{value}</span>
  </div>
);

export default PortfolioPage;

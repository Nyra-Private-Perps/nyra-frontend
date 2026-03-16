"use client";
import { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, Lock, ChevronDown, Search } from "lucide-react";
import { GlowCard, Badge, Btn, Input } from "@/components/ui";
import { C } from "@/lib/tokens";

interface AssetCtx {
  dayNiv: string;
  midPrice: string;
  prevDayPrice: string;
}

interface UniverseItem {
  name: string;
}

export default function TradePage() {
  const [side, setSide] = useState<"long" | "short">("long");
  const [lev, setLev] = useState("10");
  const [amt, setAmt] = useState("500");
  const [asset, setAsset] = useState("BTC");
  const [showDropdown, setShowDropdown] = useState(false);

  // Hyperliquid Data State
  const [universe, setUniverse] = useState<UniverseItem[]>([]);
  const [assetCtxs, setAssetCtxs] = useState<AssetCtx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://api.hyperliquid.xyz/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "metaAndAssetCtxs" }),
        });
        const data = await res.json();
        
        if (data && data[0] && data[1]) {
          setUniverse(data[0].universe);
          setAssetCtxs(data[1]);
          setLoading(false);
        }
      } catch (err) {
        console.error("Hyperliquid Fetch Error:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const marketData = useMemo(() => {
    const idx = universe.findIndex((u) => u.name === asset);
    if (idx === -1 || !assetCtxs[idx]) return { price: "0.00", change: "0.00%", isUp: true, rawPrice: 0 };

    const ctx = assetCtxs[idx];
    const price = parseFloat(ctx.midPrice || "0");
    const prevPrice = parseFloat(ctx.prevDayPrice || ctx.midPrice || "0");
    
    const diff = price - prevPrice;
    const changePct = prevPrice !== 0 ? ((diff / prevPrice) * 100).toFixed(2) : "0.00";
    
    return {
      price: price < 1 ? price.toFixed(5) : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      change: `${parseFloat(changePct) > 0 ? "+" : ""}${changePct}%`,
      isUp: parseFloat(changePct) >= 0,
      rawPrice: price
    };
  }, [asset, universe, assetCtxs]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="w-12 h-12 border-2 border-primary/20 border-t-accent rounded-full animate-spin" />
      <div className="font-mono text-[10px] text-muted tracking-[4px] uppercase">Syncing Hyperliquid Universe</div>
    </div>
  );

  return (
    <div className="anim-fade-up">
      <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 380px" }}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 py-2.5 px-4 rounded-xl font-mono text-sm font-bold transition-all"
                style={{ 
                  background: C.core, 
                  border: `1px solid ${showDropdown ? C.accent + "40" : C.primary + "20"}`, 
                  color: C.white,
                  boxShadow: showDropdown ? `0 0 20px ${C.accent}15` : 'none'
                }}
              >
                <span style={{ color: C.accent }}>{asset}</span>
                <span className="opacity-40">/ USDC</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDropdown && (
                <>
                  {/* Invisible backdrop to close dropdown when clicking outside */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                  
                  <div className="absolute top-full left-0 mt-2 w-64 max-h-[400px] overflow-y-auto z-50 rounded-2xl scrollbar-hide animate-in fade-in zoom-in duration-200"
                       style={{ 
                         background: "#0a0a0c", 
                         border: `1px solid ${C.primary}20`, 
                         boxShadow: `0 20px 50px ${C.black}, 0 0 0 1px ${C.white}05` 
                       }}>
                    <div className="sticky top-0 p-3 bg-[#0a0a0c] border-b border-white/5 flex items-center gap-2">
                      <Search size={12} className="text-muted" />
                      <span className="text-[9px] font-mono text-muted uppercase tracking-widest">Select Market</span>
                    </div>
                    {universe.map((u) => (
                      <div 
                        key={u.name}
                        onClick={() => {
                          setAsset(u.name);
                          setShowDropdown(false);
                        }}
                        className="group flex justify-between items-center p-3.5 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold" style={{ color: asset === u.name ? C.accent : C.white }}>{u.name}</span>
                          <span className="text-[10px] text-muted font-mono">/ USDC</span>
                        </div>
                        {asset === u.name && <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.accent }} />}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <Badge variant="active" pulse>Private Mode</Badge>
          </div>

          <div className="mb-5 flex items-baseline gap-4">
            <span className="font-head text-6xl font-extrabold tracking-tighter" style={{ color: C.white }}>
              ${marketData.price}
            </span>
            <span className="font-mono text-sm font-bold py-1 px-3 rounded-lg" 
              style={{ 
                color: marketData.isUp ? C.success : C.danger, 
                background: marketData.isUp ? `${C.success}15` : `${C.danger}15` 
              }}>
              {marketData.change}
            </span>
          </div>

          <GlowCard noPad style={{ height: 320, position: "relative", overflow: "hidden" }}>
             <div className="absolute inset-0 flex items-end gap-0.5" style={{ padding: "16px 12px 12px" }}>
              {Array.from({ length: 80 }, (_, i) => {
                const h = 20 + Math.sin(i * 0.25) * 35 + Math.random() * 50 + (i / 80) * 100;
                return <div key={i} className="flex-1 anim-grow-up" style={{ height: h, background: `linear-gradient(to top, ${C.primary}45, ${C.glow}12, transparent)`, borderRadius: "2px 2px 0 0", opacity: 0.4 + (i / 80) * 0.6, animationDelay: `${i * 0.008}s` }} />;
              })}
            </div>
            <div className="absolute h-px right-0" style={{ top: "28%", width: "100%", background: `linear-gradient(to right, transparent, ${C.glow}45)` }} />
            <div className="absolute font-mono text-[10px] font-bold rounded-[5px]" style={{ right: 14, top: "28%", transform: "translateY(-50%)", padding: "4px 10px", background: `linear-gradient(135deg, ${C.glow}, ${C.accent})`, color: C.void, boxShadow: `0 4px 14px ${C.glow}35` }}>
              ${marketData.price}
            </div>
            <div className="absolute top-3.5 left-[18px] font-mono text-[9px] tracking-widest uppercase opacity-40">Hyperliquid Live Stream</div>
          </GlowCard>
        </div>

        <GlowCard>
          <div className="grid grid-cols-2 gap-1 rounded-xl mb-5" style={{ padding: 3, background: `${C.void}CC` }}>
            {(["long", "short"] as const).map((s) => (
              <button key={s} onClick={() => setSide(s)} className="py-3 rounded-[9px] font-head text-sm font-bold cursor-pointer transition-all duration-200 uppercase tracking-wide"
                style={{ background: side === s ? (s === "long" ? `${C.success}0F` : `${C.danger}0F`) : "transparent", color: side === s ? (s === "long" ? C.success : C.danger) : C.muted, border: side === s ? `1px solid ${s === "long" ? C.success + "20" : C.danger + "20"}` : "1px solid transparent" }}>
                {s === "long" ? "Buy / Long" : "Sell / Short"}
              </button>
            ))}
          </div>

          <Input label="Size" value={amt} onChange={setAmt} suffix="USDC" mono />

          <div className="mb-4">
            <label className="block mb-[7px] font-mono text-[10px] font-medium tracking-[2.5px] uppercase" style={{ color: C.muted }}>Leverage</label>
            <div className="flex gap-1.5">
              {["2", "5", "10", "25", "50"].map((l) => (
                <button key={l} onClick={() => setLev(l)} className="flex-1 py-2.5 rounded-lg font-mono text-[13px] font-bold cursor-pointer transition-all duration-150"
                  style={{ background: lev === l ? `${C.primary}22` : `${C.void}CC`, border: `1px solid ${lev === l ? C.primary + "45" : C.primary + "0C"}`, color: lev === l ? C.accent : C.muted }}>{l}×</button>
              ))}
            </div>
          </div>

          <div className="rounded-xl mb-4" style={{ padding: 16, background: `${C.void}CC`, border: `1px solid ${C.primary}08` }}>
            {[
              ["Position Size", `$${(parseFloat(amt || "0") * parseFloat(lev)).toLocaleString()}`],
              ["Entry Price", `$${marketData.price}`],
              ["Leverage", `${lev}×`],
              ["Liq. Price", "🔒 Hidden"],
              ["Est. Fee", "~$0.45"]
            ].map(([k, v], i) => (
              <div key={i} className="flex justify-between py-2" style={{ borderBottom: i < 4 ? `1px solid ${C.primary}05` : "none" }}>
                <span className="font-body text-xs" style={{ color: C.muted }}>{k}</span>
                <span className="font-mono text-xs font-semibold" style={{ color: k.includes("Liq") ? C.accent : C.white }}>{v}</span>
              </div>
            ))}
          </div>

          <Btn variant={side === "long" ? "success" : "danger"} full>
            {side === "long" ? <><TrendingUp size={14} /> Buy / Long {asset}</> : <><TrendingDown size={14} /> Sell / Short {asset}</>}
          </Btn>
          <div className="mt-3 text-center font-mono text-[9px] flex items-center justify-center gap-1.5" style={{ color: C.muted }}><Lock size={10} /> Executes privately via TEE</div>
        </GlowCard>
      </div>
    </div>
  );
}

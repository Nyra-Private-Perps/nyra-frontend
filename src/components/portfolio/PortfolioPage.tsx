"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue, MotionValue } from 'framer-motion';
import {
  TrendingUp, RefreshCw, AlertCircle, Loader2,
  Activity, Target, Zap, ChevronDown,
  Eye, EyeOff, Layers, History, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';
import Header from '@/components/dashboard/Header';
// Ensure getHLUserFills is exported from your hyperStealth lib
import { apiStealthAddresses, getStoredEOA, getHLUserState, numFmt, getHLUserFills } from '@/lib/api/hyperStealth';

// ─── Types ───────────────────────────────────────────────────
interface NodeState {
  address: string;
  idx: number;
  status: 'pending' | 'loaded' | 'empty' | 'error';
  accountValue: number;
  unrealizedPnl: number;
  marginUsed: number;
  withdrawable: number;
  positions: any[];
  trades: any[]; 
}

interface Totals {
  accountValue: number;
  unrealizedPnl: number;
  marginUsed: number;
  withdrawable: number;
  positions: any[];
  history: any[]; 
  loadedCount: number;
  totalCount: number;
}

// ─── Corrected Animated Counter ───────────────────────────────
function AnimatedNumber({ value, prefix = '$', decimals = 2, className = '' }: { value: number, prefix?: string, decimals?: number, className?: string }) {
  // Use a MotionValue as the source to avoid "overload" ambiguity
  const mValue = useMotionValue(value);
  
  // Create the spring based on that motion value
  const spring = useSpring(mValue, { stiffness: 60, damping: 20 });
  
  // Explicitly define types for the transform to satisfy TS Overload 1 of 5
  const display: MotionValue<string> = useTransform(spring, (latest: number): string => {
    return `${prefix}${Math.abs(latest).toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })}`;
  });

  const [text, setText] = useState<string>(display.get());

  // Update motion value when prop changes
  useEffect(() => {
    mValue.set(value);
  }, [value, mValue]);

  // Subscribe to changes
  useEffect(() => {
    return display.on('change', (latestValue: string) => setText(latestValue));
  }, [display]);

  return <span className={className}>{text}</span>;
}

// ─── Main Component ───────────────────────────────────────────
export default function PortfolioPage({ onNavigate }: { onNavigate: (page: any) => void }) {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const [nodes, setNodes] = useState<NodeState[]>([]);
  const [totals, setTotals] = useState<Totals>({ 
    accountValue: 0, unrealizedPnl: 0, marginUsed: 0, withdrawable: 0, 
    positions: [], history: [], loadedCount: 0, totalCount: 0 
  });
  const [phase, setPhase] = useState<'idle' | 'auth' | 'streaming' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hideEmpty, setHideEmpty] = useState(true);
  const abortRef = useRef(false);

  // Aggregation Logic: Merges data from all nodes into global metrics
  const recomputeTotals = useCallback((nodeList: NodeState[], total: number) => {
    const loaded = nodeList.filter(n => n.status === 'loaded');
    
    // AGGREGATED TRADE HISTORY: Combine all trades from all nodes and sort by time
    const allHistory = loaded
      .flatMap(n => n.trades)
      .sort((a, b) => (b.time || 0) - (a.time || 0));

    setTotals({
      accountValue: loaded.reduce((s, n) => s + n.accountValue, 0),
      unrealizedPnl: loaded.reduce((s, n) => s + n.unrealizedPnl, 0),
      marginUsed: loaded.reduce((s, n) => s + n.marginUsed, 0),
      withdrawable: loaded.reduce((s, n) => s + n.withdrawable, 0),
      positions: loaded.flatMap(n => n.positions),
      history: allHistory,
      loadedCount: nodeList.filter(n => n.status !== 'pending').length,
      totalCount: total,
    });
  }, []);

  const load = useCallback(async () => {
    abortRef.current = false;
    setPhase('auth');
    setError(null);
    setNodes([]);
    
    const eoa = getStoredEOA() || address;
    if (!eoa || !signTypedDataAsync) { 
        setError('Wallet not connected'); 
        setPhase('error'); 
        return; 
    }

    try {
      const registry = await apiStealthAddresses(eoa, signTypedDataAsync);
      const addresses: string[] = registry.stealthAddresses.map((s: any) => s.address);
      
      if (!addresses.length) { 
        setError('No stealth identities in registry'); 
        setPhase('error'); 
        return; 
      }

      // Initialize skeletons
      const initial: NodeState[] = addresses.map((addr, idx) => ({
        address: addr, idx, status: 'pending',
        accountValue: 0, unrealizedPnl: 0, marginUsed: 0, withdrawable: 0, positions: [], trades: []
      }));
      setNodes(initial);
      setPhase('streaming');

      // Concurrent fetcher
      let finishedCount = 0;
      const concurrency = 6;
      let i = 0;

      const workers = Array.from({ length: Math.min(concurrency, addresses.length) }, async () => {
        while (i < addresses.length && !abortRef.current) {
          const idx = i++;
          const addr = addresses[idx];
          try {
            // Fetch both state and individual trade history for this specific node
            const [state, fills] = await Promise.all([
              getHLUserState(addr),
              getHLUserFills(addr)
            ]);

            const summary = state?.marginSummary;
            const nodePositions = (state?.assetPositions ?? [])
              .filter((p: any) => Number(p.position?.szi) !== 0)
              .map((p: any) => ({ ...p.position, parentProxy: addr }));

            const result: NodeState = {
              address: addr, idx, 
              status: (summary || fills?.length) ? 'loaded' : 'empty',
              accountValue: Number(summary?.accountValue ?? 0),
              unrealizedPnl: Number(summary?.unrealizedPnl ?? 0),
              marginUsed: Number(summary?.totalMarginUsed ?? 0),
              withdrawable: Number(state?.withdrawable ?? 0),
              positions: nodePositions,
              trades: (fills ?? []).map((f: any) => ({ ...f, parentProxy: addr })),
            };

            setNodes(prev => {
              const next = [...prev];
              next[idx] = result;
              recomputeTotals(next, addresses.length);
              return next;
            });
          } catch (e) {
            console.error(`Error loading node ${addr}`, e);
          }
        }
      });

      await Promise.all(workers);
      if (!abortRef.current) setPhase('done');
    } catch (err: any) {
      setError(err.message || 'Failed to load portfolio');
      setPhase('error');
    }
  }, [address, signTypedDataAsync, recomputeTotals]);

  useEffect(() => { load(); return () => { abortRef.current = true; }; }, [address]);

  const displayNodes = hideEmpty ? nodes.filter(n => n.status !== 'empty') : nodes;

  return (
    <div className="min-h-screen bg-[#07080C] text-white overflow-x-hidden">
      <Header onNavigate={onNavigate} currentPage="portfolio" />

      <main className="relative max-w-6xl mx-auto px-6 py-10 mt-16 space-y-10">
        
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Layers size={15} className="text-indigo-400" />
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">Aggregated Stealth Network</span>
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Global Ledger</h1>
          </div>
          
          <button onClick={load} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 font-bold text-[11px] uppercase tracking-widest">
            {phase === 'streaming' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Sync Network
          </button>
        </div>

        {/* AGGREGATED METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Value', value: totals.accountValue, icon: <TrendingUp size={18} /> },
            { label: 'Net PnL', value: totals.unrealizedPnl, icon: <Activity size={18} />, color: totals.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Active Nodes', value: nodes.filter(n => n.status === 'loaded').length, icon: <Target size={18} />, prefix: '', decimals: 0 },
            { label: 'Total Trades', value: totals.history.length, icon: <History size={18} />, prefix: '', decimals: 0 },
          ].map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white/[0.03] border border-white/10 rounded-[28px] p-6">
              <div className="flex justify-between mb-4 text-[10px] font-black uppercase text-white/20 tracking-widest">
                {m.label} <div className="text-indigo-400">{m.icon}</div>
              </div>
              <AnimatedNumber value={m.value} prefix={m.prefix} decimals={m.decimals} className={`text-2xl font-black ${m.color || 'text-white'}`} />
            </motion.div>
          ))}
        </div>

        {/* AGGREGATED TRADE HISTORY TABLE */}
        <div className="bg-[#0D0E14] border border-white/5 rounded-[32px] overflow-hidden">
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History size={18} className="text-indigo-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Aggregated History (All Nodes)</span>
            </div>
            <span className="text-[10px] font-mono text-white/20">{totals.history.length} Fills across network</span>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-[#0D0E14] z-10">
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  {['Time', 'Asset', 'Side', 'Price', 'Size', 'Source Node'].map(h => (
                    <th key={h} className="px-8 py-4 text-[10px] font-black uppercase text-white/20 tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {totals.history.map((fill, i) => (
                  <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-8 py-4 font-mono text-[10px] text-white/30">
                      {new Date(fill.time).toLocaleTimeString()}
                    </td>
                    <td className="px-8 py-4 font-bold text-sm">{fill.coin}</td>
                    <td className="px-8 py-4">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${fill.side === 'B' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                        {fill.side === 'B' ? 'BUY' : 'SELL'}
                      </span>
                    </td>
                    <td className="px-8 py-4 font-mono text-sm">${numFmt(fill.px)}</td>
                    <td className="px-8 py-4 font-mono text-sm">{numFmt(fill.sz)}</td>
                    <td className="px-8 py-4 text-[10px] font-mono text-indigo-400/50 italic">
                      Node_{fill.parentProxy.slice(-6)}
                    </td>
                  </tr>
                ))}
                {totals.history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-white/10 font-mono text-xs uppercase tracking-[0.3em]">
                      {phase === 'streaming' ? 'Scanning Nodes...' : 'No network history found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* NODE STATUS RIVER */}
        <div className="space-y-4">
            <div className="flex justify-between items-center px-4">
               <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Identity Node Infrastructure</h2>
               <button onClick={() => setHideEmpty(!hideEmpty)} className="text-[10px] font-mono text-indigo-400 flex items-center gap-2">
                 {hideEmpty ? <EyeOff size={12}/> : <Eye size={12}/>} {hideEmpty ? 'Hiding Empty' : 'Show All Nodes'}
               </button>
            </div>
            <div className="grid gap-2">
               {displayNodes.map((node) => (
                 <div key={node.address} className="flex items-center gap-6 px-8 py-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="w-8 font-mono text-[10px] text-white/20">{node.idx + 1}</div>
                    <div className="flex-1 font-mono text-[11px] text-white/40 truncate">{node.address}</div>
                    <div className="text-right">
                        <p className="text-xs font-bold">${numFmt(node.accountValue)}</p>
                        <p className="text-[8px] font-black text-white/10 uppercase">Value</p>
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'loaded' ? 'bg-indigo-500' : 'bg-white/10'}`} />
                 </div>
               ))}
            </div>
        </div>
      </main>
    </div>
  );
}

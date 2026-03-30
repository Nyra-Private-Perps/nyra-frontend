"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useSignTypedData, useSwitchChain } from 'wagmi';
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue, type MotionValue } from 'framer-motion';
import {
  TrendingUp, RefreshCw, AlertCircle, Loader2,
  Activity, Target, Zap, Eye, EyeOff, Layers, History,
  ChevronDown, ExternalLink, BarChart2, Clock, Shield,
  Lock, ArrowRight
} from 'lucide-react';
import Header from '@/components/dashboard/Header';
import { apiStealthAddresses, getStoredEOA, getHLUserState, numFmt, getHLUserFills, getUserSettledBalances, getHLSpotState } from '@/lib/api/hyperStealth';

const ARBITRUM_ID = 42161;

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

/* ─── Animated counter ──────────────────────────────────── */
function AnimatedNumber({ value, prefix = '$', decimals = 2, className = '' }: { value: number; prefix?: string; decimals?: number; className?: string }) {
  const mValue = useMotionValue(value);
  const spring = useSpring(mValue, { stiffness: 60, damping: 20 });
  const display: MotionValue<string> = useTransform(spring, (latest: number): string =>
    `${prefix}${Math.abs(latest).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
  );
  const [text, setText] = useState<string>(display.get());
  useEffect(() => { mValue.set(value); }, [value, mValue]);
  useEffect(() => display.on('change', (v: string) => setText(v)), [display]);
  return <span className={className}>{text}</span>;
}

/* ─── Expandable node row ───────────────────────────────── */
function NodeRow({ node, index }: { node: NodeState; index: number }) {
  const [open, setOpen] = useState(false);
  const isLoaded = node.status === 'loaded';
  const isPending = node.status === 'pending';
  const pnlPos = node.unrealizedPnl >= 0;

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}
      className={`rounded-2xl border overflow-hidden transition-all ${isLoaded ? 'glass-card' : isPending ? 'bg-white/1 border-white/4' : 'bg-white/1 border-white/3 opacity-50'}`}>

      <button className="w-full flex items-center gap-3 px-3 sm:px-5 py-3.5 text-left hover:bg-white/2 transition-colors"
        onClick={() => isLoaded && setOpen(o => !o)} disabled={!isLoaded}>
        <div className="w-5 text-[10px] font-mono text-gray-700 flex-shrink-0">{node.idx + 1}</div>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isLoaded ? 'bg-purple-500' : isPending ? 'bg-white/15 animate-pulse' : 'bg-white/8'}`} />
        <div className="flex-1 font-mono text-xs text-gray-600 truncate min-w-0">
          <span className="hidden sm:inline">{node.address}</span>
          <span className="sm:hidden">{node.address.slice(0,10)}...{node.address.slice(-6)}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {isPending && <Loader2 size={12} className="text-purple-400/40 animate-spin" />}
          {isLoaded && (
            <div className="text-right">
              <p className="text-sm font-semibold text-white">${numFmt(node.accountValue)}</p>
              <p className={`text-[10px] ${pnlPos ? 'text-emerald-400' : 'text-red-400'}`}>{pnlPos ? '+' : ''}{numFmt(node.unrealizedPnl)}</p>
            </div>
          )}
          {node.status === 'empty' && <span className="text-[10px] text-gray-700">Empty</span>}
          {isLoaded && (
            <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${open ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-600'}`}>
              <ChevronDown size={13} />
            </motion.div>
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && isLoaded && (
          <motion.div key="detail" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ overflow: 'hidden' }}>
            <div className="border-t border-white/5 px-3 sm:px-5 py-4 space-y-4" style={{ background: 'rgba(15,10,28,0.5)' }}>
              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Account Value', val: `$${numFmt(node.accountValue)}`, color: 'text-white' },
                  { label: 'Unrealized PnL', val: `${pnlPos?'+':''}${numFmt(node.unrealizedPnl)}`, color: pnlPos ? 'text-emerald-400' : 'text-red-400' },
                  { label: 'Margin Used', val: `$${numFmt(node.marginUsed)}`, color: 'text-amber-400' },
                  { label: 'Withdrawable', val: `$${numFmt(node.withdrawable)}`, color: 'text-purple-400' },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl bg-white/3 border border-white/5">
                    <p className="text-[10px] text-gray-600 mb-1">{s.label}</p>
                    <p className={`text-sm font-semibold ${s.color}`}>{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Open Positions */}
              {node.positions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 size={12} className="text-purple-400" />
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Open Positions ({node.positions.length})</p>
                  </div>
                  <div className="space-y-1.5">
                    {node.positions.map((pos: any, i: number) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/2 border border-white/5 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${Number(pos.szi) > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                            {Number(pos.szi) > 0 ? 'L' : 'S'}
                          </span>
                          <span className="text-xs font-semibold text-white truncate">{pos.coin}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="hidden sm:block text-right">
                            <p className="text-[10px] text-gray-600">Entry</p>
                            <p className="text-xs font-mono text-gray-400">${numFmt(pos.entryPx)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-600">Size</p>
                            <p className="text-xs font-mono text-gray-400">{numFmt(Math.abs(pos.szi))}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-600">PnL</p>
                            <p className={`text-xs font-semibold font-mono ${Number(pos.unrealizedPnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {Number(pos.unrealizedPnl) >= 0 ? '+' : ''}{numFmt(pos.unrealizedPnl)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trade History */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={12} className="text-purple-400" />
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Trade History ({node.trades.length})</p>
                </div>
                {node.trades.length === 0 ? (
                  <p className="text-xs text-gray-600 py-3 text-center">No trades recorded for this node</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                    {node.trades.slice(0, 20).map((fill: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/2 border border-white/4 text-xs">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] flex-shrink-0 ${fill.side === 'B' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                          {fill.side === 'B' ? 'BUY' : 'SELL'}
                        </span>
                        <span className="font-semibold text-white flex-shrink-0">{fill.coin}</span>
                        <span className="font-mono text-gray-500 flex-shrink-0">{numFmt(fill.sz)}</span>
                        <span className="font-mono text-gray-500 hidden sm:inline">@ ${numFmt(fill.px)}</span>
                        <span className="font-mono text-gray-700 ml-auto text-[10px] flex-shrink-0">
                          {new Date(fill.time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                    {node.trades.length > 20 && <p className="text-[10px] text-gray-700 text-center py-2">+{node.trades.length - 20} more</p>}
                  </div>
                )}
              </div>

              <a href={`https://app.hyperliquid.xyz/portfolio/${node.address}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-purple-500/8 border border-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/15 transition-colors">
                <ExternalLink size={12} /> View on Hyperliquid
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function PortfolioPage({ onNavigate }: { onNavigate: (page: any) => void }) {
  const { address, chain } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChain } = useSwitchChain();

  const [nodes, setNodes] = useState<NodeState[]>([]);
  const [totals, setTotals] = useState<Totals>({
    accountValue: 0, unrealizedPnl: 0, marginUsed: 0, withdrawable: 0,
    positions: [], history: [], loadedCount: 0, totalCount: 0,
  });
  // Phase: 'idle' = not started, user must click button
  const [phase, setPhase] = useState<'idle' | 'auth' | 'streaming' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hideEmpty, setHideEmpty] = useState(true);
  const abortRef = useRef(false);

  // Enforce Arbitrum on portfolio
  useEffect(() => {
    if (chain?.id && chain.id !== ARBITRUM_ID) {
      switchChain({ chainId: ARBITRUM_ID });
    }
  }, [chain?.id]);

  const recomputeTotals = useCallback((nodeList: NodeState[], total: number) => {
    const loaded = nodeList.filter(n => n.status === 'loaded');
    const allHistory = loaded.flatMap(n => n.trades).sort((a, b) => (b.time || 0) - (a.time || 0));
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
    setPhase('auth'); setError(null); setNodes([]);
    const eoa = getStoredEOA() || address;
    if (!eoa || !signTypedDataAsync) { setError('Wallet not connected'); setPhase('error'); return; }
    try {
      const registry = await apiStealthAddresses(eoa, signTypedDataAsync);
      const addresses: string[] = registry.stealthAddresses.map((s: any) => s.address);
      if (!addresses.length) { setError('No stealth identities found in registry'); setPhase('error'); return; }

      const initial: NodeState[] = addresses.map((addr, idx) => ({
        address: addr, idx, status: 'pending',
        accountValue: 0, unrealizedPnl: 0, marginUsed: 0, withdrawable: 0, positions: [], trades: [],
      }));
      setNodes(initial);
      setPhase('streaming');

      let i = 0;
      const workers = Array.from({ length: Math.min(6, addresses.length) }, async () => {
        while (i < addresses.length && !abortRef.current) {
          const idx = i++;
          const addr = addresses[idx];
          try {
            const [state, fills,balances] = await Promise.all([getHLUserState(addr), getHLUserFills(addr),getHLSpotState(addr)]);
            console.log(`Loaded node ${idx + 1}/${addresses.length}:`, { state, fills,balances });
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
            setNodes(prev => { const next = [...prev]; next[idx] = result; recomputeTotals(next, addresses.length); return next; });
          } catch (e) { console.error(`Error loading node ${addr}`, e); }
        }
      });
      await Promise.all(workers);
      if (!abortRef.current) setPhase('done');
    } catch (err: any) { setError(err.message || 'Failed to load portfolio'); setPhase('error'); }
  }, [address, signTypedDataAsync, recomputeTotals]);

  // Don't auto-load — user must click the button
  useEffect(() => { return () => { abortRef.current = true; }; }, [address]);

  const displayNodes = hideEmpty ? nodes.filter(n => n.status !== 'empty') : nodes;
  const isLoading = phase === 'auth' || phase === 'streaming';

  const metrics = [
    { label: 'Total Value',  value: totals.accountValue,                             prefix: '$', decimals: 2, color: 'text-white',       icon: <TrendingUp size={14} /> },
    { label: 'Net PnL',      value: totals.unrealizedPnl,                            prefix: '',  decimals: 2, color: totals.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400', icon: <Activity size={14} /> },
    { label: 'Active Nodes', value: nodes.filter(n => n.status === 'loaded').length, prefix: '',  decimals: 0, color: 'text-purple-400',   icon: <Target size={14} /> },
    { label: 'Total Trades', value: totals.history.length,                           prefix: '',  decimals: 0, color: 'text-white',        icon: <History size={14} /> },
  ];

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative" style={{ background: '#0d0a12' }}>
      <div className="fixed inset-0 pointer-events-none">
        <motion.div className="absolute top-0 right-1/3 w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-[140px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.13, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="absolute inset-0 grid-pattern" />
      </div>

      <Header onNavigate={onNavigate} currentPage="portfolio" />

      <main className="relative z-10 max-w-6xl mx-auto px-3 sm:px-6 pt-20 sm:pt-24 pb-16 space-y-5 sm:space-y-8">

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers size={13} className="text-purple-400" />
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Aggregated Stealth Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Global Ledger</h1>
          </div>
          {phase !== 'idle' && (
            <div className="flex items-center gap-2">
              {isLoading && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/8 border border-purple-500/20">
                  <Loader2 size={12} className="text-purple-400 animate-spin" />
                  <span className="text-xs text-purple-400">{phase === 'auth' ? 'Signing…' : `${totals.loadedCount}/${totals.totalCount} nodes`}</span>
                </div>
              )}
              <motion.button onClick={load} disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-full btn-purple text-white text-xs font-medium disabled:opacity-50"
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                {isLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Sync
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* ── IDLE STATE — gated load prompt ── */}
        <AnimatePresence>
          {phase === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center py-16 sm:py-24"
            >
              {/* Visual */}
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Shield size={32} className="text-purple-400" />
                </div>
                {/* Orbiting dots */}
                {[0, 1, 2].map(i => (
                  <motion.div key={i}
                    className="absolute w-2 h-2 rounded-full bg-purple-500/50"
                    style={{ top: '50%', left: '50%', marginTop: -4, marginLeft: -4 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3 + i, repeat: Infinity, ease: 'linear', delay: i * 0.8 }}
                  >
                    <div className="absolute" style={{ transform: `translateX(${32 + i * 10}px)`, width: 6, height: 6, borderRadius: '50%', background: `rgba(168,85,247,${0.4 - i * 0.1})` }} />
                  </motion.div>
                ))}
              </div>

              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">Your Portfolio Awaits</h2>
              <p className="text-sm text-gray-400 max-w-sm leading-relaxed mb-2">
                Nyra needs to verify your identity to fetch your stealth addresses from the registry.
              </p>
              <p className="text-xs text-gray-600 max-w-xs leading-relaxed mb-10">
                This requires a wallet signature — no transaction, no gas. It simply proves you own this wallet so we can retrieve your private proxy accounts.
              </p>

              {/* What you'll see */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-10 w-full max-w-lg opacity-40">
                {[
                  { icon: <Activity size={14} />, label: 'Positions' },
                  { icon: <TrendingUp size={14} />, label: 'PnL' },
                  { icon: <History size={14} />, label: 'Trade History' },
                  { icon: <Target size={14} />, label: 'Node Status' },
                ].map(f => (
                  <div key={f.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/6 bg-white/2">
                    <div className="text-purple-400">{f.icon}</div>
                    <span className="text-[10px] text-gray-500">{f.label}</span>
                  </div>
                ))}
              </div>

              {/* Security note */}
              <div className="flex items-center gap-2 mb-8 px-4 py-2.5 rounded-full border border-white/6" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <Lock size={12} className="text-green-400 flex-shrink-0" />
                <p className="text-[11px] text-white/35">Signature only · No transaction · No gas cost</p>
              </div>

              {/* Load button */}
              <motion.button
                onClick={load}
                className="relative inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-semibold text-base overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#9333ea 0%,#7c3aed 50%,#4f46e5 100%)', boxShadow: '0 0 0 1px rgba(168,85,247,0.3), 0 8px 32px rgba(147,51,234,0.3)' }}
                whileHover={{ scale: 1.04, boxShadow: '0 0 60px rgba(147,51,234,0.55),0 0 0 1px rgba(168,85,247,0.5)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.18 }}
              >
                <motion.span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent -skew-x-12 pointer-events-none"
                  initial={{ x: '-120%' }} whileHover={{ x: '220%' }} transition={{ duration: 0.55 }} />
                <Shield size={16} className="relative z-10" />
                <span className="relative z-10">Show Portfolio</span>
                <motion.span className="relative z-10" animate={{ x: [0, 4, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
                  <ArrowRight size={16} />
                </motion.span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── LOADED STATE ── */}
        {phase !== 'idle' && (
          <>
            {/* Error */}
            <AnimatePresence>
              {phase === 'error' && error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-red-500/8 border border-red-500/20">
                  <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                  <button onClick={load} className="ml-auto text-xs text-red-400 border border-red-400/30 px-3 py-1 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0">Retry</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {metrics.map((m, i) => (
                <motion.div key={m.label}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="glass-card rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="text-[10px] text-gray-600 font-medium">{m.label}</span>
                    <div className="text-purple-400/60">{m.icon}</div>
                  </div>
                  {isLoading && m.value === 0 ? (
                    <div className="h-6 w-20 rounded-lg shimmer" />
                  ) : (
                    <AnimatedNumber value={m.value} prefix={m.prefix} decimals={m.decimals} className={`text-xl sm:text-2xl font-semibold ${m.color}`} />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Open Positions */}
            {totals.positions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-white/5 flex items-center gap-3">
                  <Zap size={14} className="text-purple-400" />
                  <span className="text-sm font-medium text-gray-300">Open Positions</span>
                  <span className="ml-auto text-xs text-gray-600">{totals.positions.length} active</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[440px]">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['Asset','Side','Size','Entry','PnL','Node'].map(h => (
                          <th key={h} className="px-4 sm:px-6 py-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {totals.positions.map((pos: any, i: number) => (
                        <tr key={i} className="border-b border-white/2 hover:bg-white/2 transition-colors">
                          <td className="px-4 sm:px-6 py-3 text-sm font-semibold text-white">{pos.coin}</td>
                          <td className="px-4 sm:px-6 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${Number(pos.szi) > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {Number(pos.szi) > 0 ? 'Long' : 'Short'}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-xs font-mono text-gray-400">{numFmt(Math.abs(pos.szi))}</td>
                          <td className="px-4 sm:px-6 py-3 text-xs font-mono text-gray-400">${numFmt(pos.entryPx)}</td>
                          <td className={`px-4 sm:px-6 py-3 text-xs font-mono font-semibold ${Number(pos.unrealizedPnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {Number(pos.unrealizedPnl) >= 0 ? '+' : ''}{numFmt(pos.unrealizedPnl)}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-[10px] font-mono text-purple-400/50">…{pos.parentProxy?.slice(-6)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Trade History */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-white/5 flex items-center gap-3">
                <History size={14} className="text-purple-400" />
                <span className="text-sm font-medium text-gray-300">Trade History</span>
                <span className="text-[10px] text-gray-600 ml-auto">{totals.history.length} fills · all nodes</span>
              </div>
              <div className="max-h-64 sm:max-h-96 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left min-w-[380px]">
                  <thead className="sticky top-0 z-10" style={{ background: 'rgba(15,10,28,0.96)' }}>
                    <tr className="border-b border-white/5">
                      {['Time','Asset','Side','Price','Size','Node'].map(h => (
                        <th key={h} className="px-3 sm:px-6 py-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {totals.history.map((fill: any, i: number) => (
                      <tr key={i} className="border-b border-white/2 hover:bg-white/2 transition-colors">
                        <td className="px-3 sm:px-6 py-2.5 text-[10px] font-mono text-gray-600 whitespace-nowrap">{new Date(fill.time).toLocaleTimeString()}</td>
                        <td className="px-3 sm:px-6 py-2.5 text-xs font-semibold text-white">{fill.coin}</td>
                        <td className="px-3 sm:px-6 py-2.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${fill.side === 'B' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {fill.side === 'B' ? 'Buy' : 'Sell'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-2.5 text-xs font-mono text-gray-400">${numFmt(fill.px)}</td>
                        <td className="px-3 sm:px-6 py-2.5 text-xs font-mono text-gray-400">{numFmt(fill.sz)}</td>
                        <td className="px-3 sm:px-6 py-2.5 text-[10px] font-mono text-purple-400/50">…{fill.parentProxy?.slice(-6)}</td>
                      </tr>
                    ))}
                    {totals.history.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <History size={20} className="mx-auto mb-2 text-gray-700" />
                          <p className="text-sm text-gray-600">{isLoading ? 'Scanning nodes…' : 'No trade history found'}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Node Infrastructure — expandable rows */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-500">Node Infrastructure</h2>
                <motion.button onClick={() => setHideEmpty(!hideEmpty)}
                  className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  whileHover={{ scale: 1.04 }}>
                  {hideEmpty ? <EyeOff size={12} /> : <Eye size={12} />}
                  {hideEmpty ? 'Show empty' : 'Hide empty'}
                </motion.button>
              </div>
              <div className="space-y-2">
                {displayNodes.length === 0 && !isLoading && <div className="text-center py-8 text-gray-600 text-sm">No nodes to display</div>}
                {isLoading && displayNodes.length === 0 && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 rounded-2xl shimmer" />)}
                {displayNodes.map((node, i) => <NodeRow key={node.address} node={node} index={i} />)}
              </div>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}

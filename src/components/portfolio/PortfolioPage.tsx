"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue, type MotionValue } from 'framer-motion';
import {
  TrendingUp, RefreshCw, AlertCircle, Loader2,
  Activity, Target, Zap, Eye, EyeOff, Layers, History,
  ChevronDown, ExternalLink, BarChart2, Clock, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import Header from '@/components/dashboard/Header';
import { apiStealthAddresses, getStoredEOA, getHLUserState, numFmt, getHLUserFills } from '@/lib/api/hyperStealth';

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

/* ─── Expandable Node Row ───────────────────────────────────── */
function NodeRow({ node, index }: { node: NodeState; index: number }) {
  const [open, setOpen] = useState(false);

  const isLoaded = node.status === 'loaded';
  const isPending = node.status === 'pending';
  const pnlPos = node.unrealizedPnl >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`rounded-2xl border overflow-hidden transition-all ${
        isLoaded ? 'glass-card' :
        isPending ? 'bg-white/1 border-white/4' :
        'bg-white/1 border-white/3 opacity-50'
      }`}
    >
      {/* Row header — always visible */}
      <button
        className="w-full flex items-center gap-3 px-3 sm:px-5 py-3.5 text-left hover:bg-white/2 transition-colors"
        onClick={() => isLoaded && setOpen(o => !o)}
        disabled={!isLoaded && !isPending}
      >
        {/* Index */}
        <div className="w-5 text-[10px] font-mono text-gray-700 flex-shrink-0">{node.idx + 1}</div>

        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          isLoaded ? 'bg-purple-500' :
          isPending ? 'bg-white/15 animate-pulse' : 'bg-white/8'
        }`} />

        {/* Address */}
        <div className="flex-1 font-mono text-xs text-gray-600 truncate min-w-0">
          <span className="hidden sm:inline">{node.address}</span>
          <span className="sm:hidden">{node.address.slice(0, 8)}...{node.address.slice(-6)}</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isPending && <Loader2 size={12} className="text-purple-400/40 animate-spin" />}
          {isLoaded && (
            <div className="text-right">
              <p className="text-sm font-semibold text-white">${numFmt(node.accountValue)}</p>
              <p className={`text-[10px] ${pnlPos ? 'text-emerald-400' : 'text-red-400'}`}>
                {pnlPos ? '+' : ''}{numFmt(node.unrealizedPnl)}
              </p>
            </div>
          )}
          {node.status === 'empty' && <span className="text-[10px] text-gray-700">Empty</span>}

          {/* Expand arrow — only when loaded */}
          {isLoaded && (
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                open ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-600'
              }`}
            >
              <ChevronDown size={13} />
            </motion.div>
          )}
        </div>
      </button>

      {/* Expanded detail panel */}
      <AnimatePresence initial={false}>
        {open && isLoaded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-white/5 px-3 sm:px-5 py-4 space-y-4"
              style={{ background: 'rgba(15, 10, 28, 0.5)' }}>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Account Value',  val: `$${numFmt(node.accountValue)}`,    color: 'text-white' },
                  { label: 'Unrealized PnL', val: `${pnlPos?'+':''}${numFmt(node.unrealizedPnl)}`, color: pnlPos ? 'text-emerald-400' : 'text-red-400' },
                  { label: 'Margin Used',    val: `$${numFmt(node.marginUsed)}`,      color: 'text-amber-400' },
                  { label: 'Withdrawable',   val: `$${numFmt(node.withdrawable)}`,    color: 'text-purple-400' },
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
                        <div className="flex items-center gap-3 flex-shrink-0 text-right">
                          <div className="hidden sm:block">
                            <p className="text-[10px] text-gray-600">Entry</p>
                            <p className="text-xs font-mono text-gray-400">${numFmt(pos.entryPx)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-600">Size</p>
                            <p className="text-xs font-mono text-gray-400">{numFmt(Math.abs(pos.szi))}</p>
                          </div>
                          <div>
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
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Trade History ({node.trades.length})
                  </p>
                </div>
                {node.trades.length === 0 ? (
                  <p className="text-xs text-gray-600 py-3 text-center">No trades recorded for this node</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                    {node.trades.slice(0, 20).map((fill: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/2 border border-white/4 text-xs">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] flex-shrink-0 ${
                          fill.side === 'B' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                        }`}>
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
                    {node.trades.length > 20 && (
                      <p className="text-[10px] text-gray-700 text-center py-2">+{node.trades.length - 20} more trades</p>
                    )}
                  </div>
                )}
              </div>

              {/* View on HL link */}
              <a
                href={`https://app.hyperliquid.xyz/portfolio/${node.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-purple-500/8 border border-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/15 transition-colors"
              >
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
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const [nodes, setNodes] = useState<NodeState[]>([]);
  const [totals, setTotals] = useState<Totals>({
    accountValue: 0, unrealizedPnl: 0, marginUsed: 0, withdrawable: 0,
    positions: [], history: [], loadedCount: 0, totalCount: 0,
  });
  const [phase, setPhase] = useState<'idle' | 'auth' | 'streaming' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hideEmpty, setHideEmpty] = useState(true);
  const abortRef = useRef(false);

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
      if (!addresses.length) { setError('No stealth identities in registry'); setPhase('error'); return; }
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
            const [state, fills] = await Promise.all([getHLUserState(addr), getHLUserFills(addr)]);
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
              const next = [...prev]; next[idx] = result;
              recomputeTotals(next, addresses.length); return next;
            });
          } catch (e) { console.error(`Error loading node ${addr}`, e); }
        }
      });
      await Promise.all(workers);
      if (!abortRef.current) setPhase('done');
    } catch (err: any) { setError(err.message || 'Failed to load portfolio'); setPhase('error'); }
  }, [address, signTypedDataAsync, recomputeTotals]);

  useEffect(() => { load(); return () => { abortRef.current = true; }; }, [address]);

  const displayNodes = hideEmpty ? nodes.filter(n => n.status !== 'empty') : nodes;
  const isLoading = phase === 'auth' || phase === 'streaming';

  const metrics = [
    { label: 'Total Value',   value: totals.accountValue,                              prefix: '$', decimals: 2, color: 'text-white',       icon: <TrendingUp size={14} /> },
    { label: 'Net PnL',       value: totals.unrealizedPnl,                             prefix: '',  decimals: 2, color: totals.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400', icon: <Activity size={14} /> },
    { label: 'Active Nodes',  value: nodes.filter(n => n.status === 'loaded').length,  prefix: '',  decimals: 0, color: 'text-purple-400',   icon: <Target size={14} /> },
    { label: 'Total Trades',  value: totals.history.length,                            prefix: '',  decimals: 0, color: 'text-white',        icon: <History size={14} /> },
  ];

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative" style={{ background: '#0d0a12' }}>
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 right-1/3 w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-[140px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.13, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 grid-pattern" />
      </div>

      <Header onNavigate={onNavigate} currentPage="portfolio" />

      <main className="relative z-10 max-w-6xl mx-auto px-3 sm:px-6 pt-20 sm:pt-24 pb-16 space-y-5 sm:space-y-8">

        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers size={13} className="text-purple-400" />
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Aggregated Stealth Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Global Ledger</h1>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/8 border border-purple-500/20">
                <Loader2 size={12} className="text-purple-400 animate-spin" />
                <span className="text-xs text-purple-400">
                  {phase === 'auth' ? 'Authenticating...' : `${totals.loadedCount}/${totals.totalCount} nodes`}
                </span>
              </div>
            )}
            <motion.button onClick={load} disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-full btn-purple text-white text-xs font-medium disabled:opacity-50"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              {isLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Sync
            </motion.button>
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {phase === 'error' && error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-red-500/8 border border-red-500/20">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metric Cards */}
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
                <AnimatedNumber value={m.value} prefix={m.prefix} decimals={m.decimals}
                  className={`text-xl sm:text-2xl font-semibold ${m.color}`} />
              )}
            </motion.div>
          ))}
        </div>

        {/* Open Positions (aggregated) */}
        {totals.positions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-white/5 flex items-center gap-3">
              <Zap size={14} className="text-purple-400" />
              <span className="text-sm font-medium text-gray-300">Open Positions</span>
              <span className="ml-auto text-xs text-gray-600">{totals.positions.length} active</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[440px]">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Asset', 'Side', 'Size', 'Entry', 'PnL', 'Node'].map(h => (
                      <th key={h} className="px-4 sm:px-6 py-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {totals.positions.map((pos: any, i: number) => (
                    <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/2 hover:bg-white/2 transition-colors">
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
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Aggregated Trade History */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-white/5 flex items-center gap-3">
            <History size={14} className="text-purple-400" />
            <span className="text-sm font-medium text-gray-300">Trade History</span>
            <span className="text-[10px] text-gray-600 ml-auto">{totals.history.length} fills · all nodes</span>
          </div>
          <div className="max-h-64 sm:max-h-96 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left min-w-[380px]">
              <thead className="sticky top-0 z-10" style={{ background: 'rgba(15, 10, 28, 0.95)' }}>
                <tr className="border-b border-white/5">
                  {['Time', 'Asset', 'Side', 'Price', 'Size', 'Node'].map(h => (
                    <th key={h} className="px-3 sm:px-6 py-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {totals.history.map((fill: any, i: number) => (
                  <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.01, 0.3) }}
                    className="border-b border-white/2 hover:bg-white/2 transition-colors">
                    <td className="px-3 sm:px-6 py-2.5 text-[10px] font-mono text-gray-600 whitespace-nowrap">
                      {new Date(fill.time).toLocaleTimeString()}
                    </td>
                    <td className="px-3 sm:px-6 py-2.5 text-xs font-semibold text-white">{fill.coin}</td>
                    <td className="px-3 sm:px-6 py-2.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${fill.side === 'B' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {fill.side === 'B' ? 'Buy' : 'Sell'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-2.5 text-xs font-mono text-gray-400">${numFmt(fill.px)}</td>
                    <td className="px-3 sm:px-6 py-2.5 text-xs font-mono text-gray-400">{numFmt(fill.sz)}</td>
                    <td className="px-3 sm:px-6 py-2.5 text-[10px] font-mono text-purple-400/50">…{fill.parentProxy?.slice(-6)}</td>
                  </motion.tr>
                ))}
                {totals.history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <History size={20} className="mx-auto mb-2 text-gray-700" />
                      <p className="text-sm text-gray-600">{isLoading ? 'Scanning nodes...' : 'No trade history found'}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Node Infrastructure — expandable rows */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="space-y-3">
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
            {displayNodes.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-600 text-sm">No nodes to display</div>
            )}
            {isLoading && displayNodes.length === 0 &&
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 rounded-2xl shimmer" />)
            }
            {displayNodes.map((node, i) => (
              <NodeRow key={node.address} node={node} index={i} />
            ))}
          </div>
        </motion.div>

      </main>
    </div>
  );
}

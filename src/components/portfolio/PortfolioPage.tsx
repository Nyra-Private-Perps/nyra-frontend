"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue, type MotionValue } from 'framer-motion';
import {
  TrendingUp, RefreshCw, AlertCircle, Loader2,
  Activity, Target, Zap, Eye, EyeOff, Layers, History, ArrowDownLeft, ArrowUpRight
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
    setPhase('auth');
    setError(null);
    setNodes([]);
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
              const next = [...prev];
              next[idx] = result;
              recomputeTotals(next, addresses.length);
              return next;
            });
          } catch (e) { console.error(`Error loading node ${addr}`, e); }
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
  const isLoading = phase === 'auth' || phase === 'streaming';

  const metrics = [
    { label: 'Total Value', value: totals.accountValue, icon: <TrendingUp size={16} />, prefix: '$', decimals: 2, color: 'text-white' },
    { label: 'Net PnL', value: totals.unrealizedPnl, icon: <Activity size={16} />, prefix: '', decimals: 2, color: totals.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
    { label: 'Active Nodes', value: nodes.filter(n => n.status === 'loaded').length, icon: <Target size={16} />, prefix: '', decimals: 0, color: 'text-purple-400' },
    { label: 'Total Trades', value: totals.history.length, icon: <History size={16} />, prefix: '', decimals: 0, color: 'text-white' },
  ];

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative" style={{ background: '#0d0a12' }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 right-1/3 w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-[140px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.13, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 grid-pattern" />
      </div>

      <Header onNavigate={onNavigate} currentPage="portfolio" />

      <main className="relative z-10 max-w-6xl mx-auto px-3 sm:px-6 pt-20 sm:pt-24 pb-16 space-y-6 sm:space-y-8">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Layers size={14} className="text-purple-400" />
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Aggregated Stealth Network</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Global Ledger</h1>
          </div>

          <div className="flex items-center gap-3">
            {isLoading && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/8 border border-purple-500/20">
                <Loader2 size={13} className="text-purple-400 animate-spin" />
                <span className="text-xs text-purple-400">
                  {phase === 'auth' ? 'Authenticating...' : `Scanning ${totals.loadedCount}/${totals.totalCount} nodes`}
                </span>
              </div>
            )}
            <motion.button
              onClick={load}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full btn-purple text-white text-sm font-medium disabled:opacity-50"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Sync
            </motion.button>
          </div>
        </motion.div>

        {/* Error state */}
        <AnimatePresence>
          {phase === 'error' && error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-500/8 border border-red-500/20"
            >
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="glass-card rounded-2xl p-5 card-hover"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-600 font-medium">{m.label}</span>
                <div className="text-purple-400/60">{m.icon}</div>
              </div>
              {isLoading && m.value === 0 ? (
                <div className="h-7 w-24 rounded-lg shimmer" />
              ) : (
                <AnimatedNumber
                  value={m.value}
                  prefix={m.prefix}
                  decimals={m.decimals}
                  className={`text-2xl font-semibold ${m.color}`}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Positions */}
        {totals.positions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
              <Zap size={15} className="text-purple-400" />
              <span className="text-sm font-medium text-gray-300">Open Positions</span>
              <span className="ml-auto text-xs text-gray-600">{totals.positions.length} active</span>
            </div>
            <div className="overflow-x-auto -mx-0">
              <table className="w-full text-left min-w-[480px]">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Asset', 'Size', 'Entry', 'PnL', 'Node'].map(h => (
                      <th key={h} className="px-4 sm:px-6 py-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {totals.positions.map((pos: any, i: number) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/3 hover:bg-white/2 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3.5 font-semibold text-sm text-white">{pos.coin}</td>
                      <td className={`px-4 sm:px-6 py-3.5 text-sm font-mono ${Number(pos.szi) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {numFmt(Math.abs(pos.szi))}
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-sm font-mono text-gray-400">${numFmt(pos.entryPx)}</td>
                      <td className={`px-4 sm:px-6 py-3.5 text-sm font-mono font-semibold ${Number(pos.unrealizedPnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {Number(pos.unrealizedPnl) >= 0 ? '+' : ''}{numFmt(pos.unrealizedPnl)}
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-[10px] font-mono text-purple-400/50">
                        …{pos.parentProxy?.slice(-6)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Trade History */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
            <History size={15} className="text-purple-400" />
            <span className="text-sm font-medium text-gray-300">Trade History</span>
            <span className="text-[10px] text-gray-600 ml-auto">{totals.history.length} fills across all nodes</span>
          </div>

          <div className="max-h-[480px] overflow-y-auto overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[480px]">
              <thead className="sticky top-0 z-10" style={{ background: 'rgba(15, 10, 28, 0.95)' }}>
                <tr className="border-b border-white/5">
                  {['Time', 'Asset', 'Side', 'Price', 'Size', 'Node'].map(h => (
                    <th key={h} className="px-4 sm:px-6 py-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {totals.history.map((fill: any, i: number) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.01, 0.3) }}
                    className="border-b border-white/2 hover:bg-white/2 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 text-[10px] font-mono text-gray-600">
                      {new Date(fill.time).toLocaleTimeString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm font-semibold text-white">{fill.coin}</td>
                    <td className="px-4 sm:px-6 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        fill.side === 'B'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {fill.side === 'B' ? 'Buy' : 'Sell'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-xs font-mono text-gray-400">${numFmt(fill.px)}</td>
                    <td className="px-4 sm:px-6 py-3 text-xs font-mono text-gray-400">{numFmt(fill.sz)}</td>
                    <td className="px-4 sm:px-6 py-3 text-[10px] font-mono text-purple-400/50">
                      …{fill.parentProxy?.slice(-6)}
                    </td>
                  </motion.tr>
                ))}
                {totals.history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <History size={24} className="mx-auto mb-3 text-gray-700" />
                      <p className="text-sm text-gray-600">
                        {isLoading ? 'Scanning nodes...' : 'No trade history found'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Node Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Node Infrastructure</h2>
            <motion.button
              onClick={() => setHideEmpty(!hideEmpty)}
              className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              whileHover={{ scale: 1.04 }}
            >
              {hideEmpty ? <EyeOff size={12} /> : <Eye size={12} />}
              {hideEmpty ? 'Show empty' : 'Hide empty'}
            </motion.button>
          </div>

          <div className="grid gap-2">
            {displayNodes.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-600 text-sm">No nodes to display</div>
            )}
            {isLoading && displayNodes.length === 0 &&
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-2xl shimmer" />
              ))
            }
            {displayNodes.map((node, i) => (
              <motion.div
                key={node.address}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border transition-all ${
                  node.status === 'loaded'
                    ? 'glass-card'
                    : node.status === 'pending'
                    ? 'bg-white/1 border-white/4'
                    : 'bg-white/1 border-white/3 opacity-50'
                }`}
              >
                <div className="w-6 text-[10px] font-mono text-gray-700">{node.idx + 1}</div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  node.status === 'loaded' ? 'bg-purple-500' :
                  node.status === 'pending' ? 'bg-white/15 animate-pulse' :
                  'bg-white/8'
                }`} />
                <div className="flex-1 font-mono text-xs text-gray-600 truncate">{node.address}</div>
                {node.status === 'pending' && <Loader2 size={12} className="text-purple-400/40 animate-spin flex-shrink-0" />}
                {node.status === 'loaded' && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-white">${numFmt(node.accountValue)}</p>
                    <p className={`text-[10px] ${node.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {node.unrealizedPnl >= 0 ? '+' : ''}{numFmt(node.unrealizedPnl)}
                    </p>
                  </div>
                )}
                {node.status === 'empty' && (
                  <span className="text-[10px] text-gray-700">Empty</span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

      </main>
    </div>
  );
}

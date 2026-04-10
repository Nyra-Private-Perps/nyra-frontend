"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useSignTypedData, useSwitchChain } from 'wagmi';
import {
  motion, AnimatePresence,
  useSpring, useTransform, useMotionValue, type MotionValue
} from 'framer-motion';
import {
  TrendingUp, RefreshCw, AlertCircle, Loader2, Activity,
  Target, Zap, Eye, EyeOff, Layers, History, ChevronDown,
  ExternalLink, BarChart2, Clock, Shield, Lock, ArrowRight,
  Wallet, DollarSign, ShieldCheck, Ban, Leaf, Circle
} from 'lucide-react';
import Header from '@/components/dashboard/Header';
import {
  apiStealthAddresses, getStoredEOA, getHLUserState,
  getHLSpotState, numFmt, getHLUserFills,
  apiGetMetrics
} from '@/lib/api/hyperStealth';

const ARBITRUM_ID = 42161;

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
interface NodeState {
  address: string;
  idx: number;
  status: 'pending' | 'loaded' | 'empty' | 'error';
  accountValue: number;   // HL perp account value
  unrealizedPnl: number;
  marginUsed: number;
  withdrawable: number;
  spotUsdc: number;       // USDC balance on HL spot (after closing perps)
  positions: any[];
  trades: any[];
}

interface Totals {
  accountValue: number;
  unrealizedPnl: number;
  marginUsed: number;
  withdrawable: number;
  spotUsdc: number;       // aggregated spot USDC across all nodes
  positions: any[];
  history: any[];
  loadedCount: number;
  totalCount: number;
}

/* ─────────────────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────────────────── */
function AnimatedNumber({
  value, prefix = '$', decimals = 2, className = '', suffix = '',
}: {
  value: number; prefix?: string; decimals?: number; className?: string; suffix?: string;
}) {
  const mValue = useMotionValue(0);
  const spring = useSpring(mValue, { stiffness: 40, damping: 25 });
  const display: MotionValue<string> = useTransform(
    spring,
    (v: number) => `${prefix}${Math.abs(v).toLocaleString('en-US', {
      minimumFractionDigits: decimals, maximumFractionDigits: decimals,
    })}`,
  );
  const [text, setText] = useState(display.get());
  useEffect(() => { mValue.set(value); }, [value, mValue]);
  useEffect(() => display.on('change', setText), [display]);
  return <span className={className}>{text}{suffix && <span className="text-sm text-gray-500 ml-1">{suffix}</span>}</span>;
}

/* ─────────────────────────────────────────────────────────
/* ─────────────────────────────────────────────────────────
   GLOBE / SPHERE VISUAL  (Enhanced)
───────────────────────────────────────────────────────── */
function GlobeSphere() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
      {/* Deep ambient glow */}
      <div className="absolute w-[280px] h-[280px] bg-purple-600/20 blur-[60px] rounded-full pointer-events-none" />

      {/* Outer pulsing ring */}
      <motion.div
        className="absolute rounded-full border border-purple-500/10"
        style={{ width: 210, height: 210 }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Counter-rotating dashed ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 170, height: 170,
          border: '1px dashed rgba(168,85,247,0.3)',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />

      {/* Core sphere container */}
      <motion.div
        className="relative z-10 overflow-hidden rounded-full"
        style={{
          width: 130, height: 130,
          background: 'radial-gradient(circle at 30% 30%, #4c1d95 0%, #2e1065 40%, #03030a 100%)',
          boxShadow: '0 0 40px rgba(124,58,237,0.3), inset -10px -10px 30px rgba(0,0,0,0.8), inset 2px 2px 10px rgba(255,255,255,0.2)',
          border: '1px solid rgba(168,85,247,0.2)',
        }}
        animate={{ rotateZ: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        {/* Dynamic wireframe grid */}
        <motion.div
          className="absolute inset-0"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          style={{ width: '200%' }}
        >
          <svg className="w-full h-full" viewBox="0 0 260 130" opacity="0.3">
            <defs>
              <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            {/* Horizontal lines */}
            {[20, 45, 65, 85, 110].map(y => (
              <line key={`h-${y}`} x1="0" y1={y} x2="260" y2={y} stroke="url(#gridGrad)" strokeWidth="0.8" />
            ))}
            {/* Curved vertical lines mimicking rotation */}
            {[0, 26, 52, 78, 104, 130, 156, 182, 208, 234, 260].map(x => (
              <path
                key={`v-${x}`}
                d={`M ${x} 0 Q ${x + 20} 65 ${x} 130`}
                fill="none"
                stroke="url(#gridGrad)"
                strokeWidth="0.8"
              />
            ))}
          </svg>
        </motion.div>

        {/* Glossy overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%)',
            borderRadius: '50%',
          }}
        />
      </motion.div>

      {/* Orbiting element (Comet) */}
      <motion.div
        className="absolute"
        style={{ width: 190, height: 190 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      >
        <div
          className="absolute rounded-full"
          style={{
            top: 0, left: '50%',
            width: 8, height: 8,
            marginLeft: -4, marginTop: -4,
            background: '#c084fc',
            boxShadow: '0 0 15px 4px rgba(168,85,247,0.8), 0 0 30px rgba(192,132,252,0.6)',
          }}
        />
        {/* Tail */}
        <div
          className="absolute origin-right"
          style={{
            top: 0, left: '50%',
            width: 40, height: 2,
            marginLeft: -44, marginTop: -1,
            background: 'linear-gradient(90deg, transparent, rgba(192,132,252,0.8))',
            filter: 'blur(1px)',
          }}
        />
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   EXPANDABLE NODE ROW
───────────────────────────────────────────────────────── */
function NodeRow({ node, index }: { node: NodeState; index: number }) {
  const [open, setOpen] = useState(false);
  const isLoaded = node.status === 'loaded';
  const isPending = node.status === 'pending';
  const pnlPos = node.unrealizedPnl >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className={`rounded-2xl border overflow-hidden transition-colors ${isLoaded ? 'glass-card' :
        isPending ? 'bg-white/1 border-white/4' :
          'bg-white/1 border-white/3 opacity-50'
        }`}
    >
      {/* Row header */}
      <button
        className="w-full flex items-center gap-3 px-3 sm:px-5 py-3.5 text-left hover:bg-white/2 transition-colors disabled:cursor-default"
        onClick={() => isLoaded && setOpen(o => !o)}
        disabled={!isLoaded}
      >
        <div className="w-5 text-[10px] font-mono text-gray-700 flex-shrink-0">{node.idx + 1}</div>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isLoaded ? 'bg-purple-500' :
          isPending ? 'bg-white/15 animate-pulse' : 'bg-white/8'
          }`} />
        <div className="flex-1 font-mono text-xs text-gray-600 truncate min-w-0">
          <span className="hidden sm:inline">{node.address}</span>
          <span className="sm:hidden">{node.address.slice(0, 10)}…{node.address.slice(-6)}</span>
        </div>
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
          {isLoaded && (
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${open ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-600'
                }`}
            >
              <ChevronDown size={13} />
            </motion.div>
          )}
        </div>
      </button>

      {/* Expanded panel */}
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
              style={{ background: 'rgba(15,10,28,0.5)' }}>

              {/* Stats grid — including spot USDC */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Account Value', val: `$${numFmt(node.accountValue)}`, color: 'text-white' },
                  { label: 'Unrealized PnL', val: `${pnlPos ? '+' : ''}${numFmt(node.unrealizedPnl)}`, color: pnlPos ? 'text-emerald-400' : 'text-red-400' },
                  { label: 'Margin Used', val: `$${numFmt(node.marginUsed)}`, color: 'text-amber-400' },
                  { label: 'Withdrawable', val: `$${numFmt(node.withdrawable)}`, color: 'text-purple-400' },
                  { label: 'Spot USDC', val: `$${numFmt(node.spotUsdc)}`, color: 'text-cyan-400' },
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
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Open Positions ({node.positions.length})
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {node.positions.map((pos: any, i: number) => (
                      <div key={i}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/2 border border-white/5 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${Number(pos.szi) > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                            }`}>
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
                  <p className="text-xs text-gray-600 py-3 text-center">No trades for this node</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                    {node.trades.slice(0, 20).map((fill: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/2 border border-white/4 text-xs">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] flex-shrink-0 ${fill.side === 'B' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                          }`}>
                          {fill.side === 'B' ? 'BUY' : 'SELL'}
                        </span>
                        <span className="font-semibold text-white flex-shrink-0">{fill.coin}</span>
                        <span className="font-mono text-gray-500 flex-shrink-0">{numFmt(fill.sz)}</span>
                        <span className="font-mono text-gray-500 hidden sm:inline">@ ${numFmt(fill.px)}</span>
                        <span className="font-mono text-gray-700 ml-auto text-[10px] flex-shrink-0">
                          {new Date(fill.time).toLocaleString(undefined, {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                    {node.trades.length > 20 && (
                      <p className="text-[10px] text-gray-700 text-center py-2">
                        +{node.trades.length - 20} more
                      </p>
                    )}
                  </div>
                )}
              </div>

              <a
                href={`https://app.hyperliquid.xyz/portfolio/${node.address}`}
                target="_blank" rel="noopener noreferrer"
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

/* ─────────────────────────────────────────────────────────
   PORTFOLIO UNLOCK SCREEN  (matches screenshot style)
───────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────
   NODE/LOCK VISUAL  (Minimal Concentric Rings)
───────────────────────────────────────────────────────── */
function NodeGlowLock() {
  return (
    <div className="relative flex items-center justify-center p-8">
      {/* Deep ambient glow */}
      <div className="absolute w-[180px] h-[180px] bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />

      {/* Ring 3 (Outer) */}
      <motion.div className="absolute rounded-full border border-white/5" style={{ width: 140, height: 140 }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.4, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />

      {/* Ring 2 (Middle) */}
      <motion.div className="absolute rounded-full border border-purple-500/10" style={{ width: 90, height: 90 }}
        animate={{ scale: [1, 1.02, 1], opacity: [0.5, 0.7, 0.5] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />

      {/* Ring 1 (Inner Glowing Line) */}
      <div className="absolute rounded-full border border-purple-400/30" style={{ width: 50, height: 50, boxShadow: '0 0 15px rgba(168,85,247,0.2)' }} />

      {/* Core Dot */}
      <motion.div className="relative z-10 rounded-full bg-[#d8b4fe]"
        style={{ width: 12, height: 12, boxShadow: '0 0 20px 4px rgba(168,85,247,0.8), 0 0 40px 8px rgba(147,51,234,0.4)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function PortfolioUnlockScreen({ onUnlock }: { onUnlock: () => void }) {
  const featureCards = [
    { icon: <Wallet size={16} className="text-purple-400" />, title: 'POSITIONS', value: 'Locked' },
    { icon: <TrendingUp size={16} className="text-purple-400" />, title: 'PNL', value: 'Locked' },
    { icon: <History size={16} className="text-purple-400" />, title: 'TRADE HISTORY', value: 'Locked' },
    { icon: <Activity size={16} className="text-purple-400" />, title: 'NODE STATUS', status: 'Active' },
  ];

  return (
    <div className="relative h-screen min-h-[700px] w-full flex flex-col justify-center overflow-hidden pt-24 pb-12"
      style={{ background: '#08080A' }}>

      {/* Background Grid */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

      {/* Main Container to keep content centered vertically */}
      <div className="relative z-10 flex-1 flex flex-col items-center">

        {/* Core Card */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.23, 0.86, 0.39, 0.96] }}
          className="w-full max-w-[640px] rounded-[32px] overflow-hidden p-[1px] relative mx-4 pb-8 mt-4"
          style={{ background: 'rgba(255,255,255,0.03)', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}
        >
          {/* Subtle inner top-light overlay */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />

          <div className="w-full h-full rounded-[32px] bg-[#0c0c11]/80 backdrop-blur-3xl px-8 py-12 flex flex-col items-center relative z-10">

            {/* Top Left Text */}
            {/* <div className="absolute top-8 left-8">
              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-1">Vault ID: NYRA-001-X</p>
              <p className="text-[10px] text-purple-400/70 font-mono tracking-widest uppercase flex items-center gap-1.5">
                <Lock size={10} />
                Status: Encrypted
              </p>
            </div> */}

            {/* Glowing Dot Visual */}
            <div className="mt-8 mb-6">
              <NodeGlowLock />
            </div>

            {/* Pill */}
            <div className="px-3.5 py-1.5 rounded-full mb-8 flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span className="text-[9px] font-bold tracking-[0.2em] text-white/50 uppercase">Aggregated Stealth Node</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Your Portfolio Awaits</h1>

            {/* Subtext */}
            <p className="text-[13px] text-gray-400 max-w-sm text-center mb-10 leading-relaxed font-light">
              NYRA needs to verify your identity to fetch your stealth addresses from the registry.
            </p>

            {/* Button */}
            <motion.button
              onClick={onUnlock}
              className="w-64 h-14 pos-relative rounded-full font-semibold text-[15px] text-white/90 mb-8 border border-white/10"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 50%, #6d28d9 100%)', boxShadow: '0 0 30px rgba(168,85,247,0.3)' }}
              whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(168,85,247,0.5)' }} whileTap={{ scale: 0.98 }}
            >
              Show Portfolio
            </motion.button>

            {/* Badges */}
            <div className="flex flex-wrap justify-center items-center gap-6">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-gray-500" />
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Signature Only</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Ban size={12} className="text-gray-500" />
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">No Transaction</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Leaf size={12} className="text-gray-500" />
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">No Gas Cost</span>
              </div>
            </div>

          </div>
        </motion.div>

        {/* 4 Bottom Cards below the Core Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-[640px] px-4 relative z-20 -mt-12"
        >
          {featureCards.map((card, i) => (
            <div key={i} className="rounded-3xl bg-[#0c0c11]/95 border border-white/10 p-5 flex flex-col gap-6 backdrop-blur-3xl shadow-2xl">
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                {card.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">{card.title}</p>
                {card.status ? (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-white font-medium">{card.status}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 font-medium tracking-wide flex items-center gap-1.5">
                    <Lock size={10} className="text-gray-500" />
                    {card.value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Footer System Specs */}

    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────── */
export default function PortfolioPage({
  onNavigate,
}: {
  onNavigate: (page: any) => void;
}) {
  const { address, chain } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChain } = useSwitchChain();

  const [nodes, setNodes] = useState<NodeState[]>([]);
  const [totals, setTotals] = useState<Totals>({
    accountValue: 0, unrealizedPnl: 0, marginUsed: 0, withdrawable: 0, spotUsdc: 0,
    positions: [], history: [], loadedCount: 0, totalCount: 0,
  });
  const [phase, setPhase] = useState<'idle' | 'auth' | 'streaming' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hideEmpty, setHideEmpty] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20; // or your preferred number
  const [totalPages, setTotalPages] = useState(1);
  const [grandTotal, setGrandTotal] = useState(0);
  const pageOffset = (page - 1) * pageSize;
  const allNodesRef = useRef<Map<string, NodeState>>(new Map());
  const [globalCount, setGlobalCount] = useState<{ totalStealthAddresses: number } | null>(null);

  const abortRef = useRef(false);
  useEffect(() => {
    apiGetMetrics().then(res => { setGlobalCount(res); console.log(res, "response") }).catch(console.error);
  }, []);
  // Enforce Arbitrum
  useEffect(() => {
    if (chain?.id && chain.id !== ARBITRUM_ID) {
      switchChain({ chainId: ARBITRUM_ID });
    }
  }, [chain?.id]);

  useEffect(() => {
    if (phase !== 'idle') {  // only auto-reload if already authenticated
      load();
    }
  }, [page]);

  const recomputeTotals = useCallback((nodeList: NodeState[], total: number) => {
    const loaded = nodeList.filter(n => n.status === 'loaded');
    const allHistory = loaded
      .flatMap(n => n.trades)
      .sort((a, b) => (b.time || 0) - (a.time || 0));
    setTotals({
      accountValue: loaded.reduce((s, n) => s + n.accountValue, 0),
      unrealizedPnl: loaded.reduce((s, n) => s + n.unrealizedPnl, 0),
      marginUsed: loaded.reduce((s, n) => s + n.marginUsed, 0),
      withdrawable: loaded.reduce((s, n) => s + n.withdrawable, 0),
      spotUsdc: loaded.reduce((s, n) => s + n.spotUsdc, 0),
      positions: loaded.flatMap(n => n.positions),
      history: allHistory,
      loadedCount: loaded.length,
      totalCount: total, // this is now grandTotal passed in
    });
  }, []);
  const load = useCallback(async () => {
    abortRef.current = false;
    setPhase('auth'); setError(null);

    // Only clear accumulated data on fresh load (page 1 or manual sync)
    if (page === 1) {
      allNodesRef.current = new Map();
      setNodes([]);
    }

    const eoa = getStoredEOA() || address;
    if (!eoa || !signTypedDataAsync) {
      setError('Wallet not connected'); setPhase('error'); return;
    }
    try {
      const registry = await apiStealthAddresses(eoa, signTypedDataAsync, page, pageSize);
      setGrandTotal(registry.total);
      setTotalPages(Math.ceil(registry.total / registry.pageSize));

      const addresses: string[] = registry.stealthAddresses.map((s: any) => s.address);
      if (!addresses.length) {
        setError('No stealth identities found in registry'); setPhase('error'); return;
      }

      const pageOffset = (page - 1) * pageSize;

      // Add pending placeholders for this page into the map
      addresses.forEach((addr, idx) => {
        allNodesRef.current.set(addr, {
          address: addr, idx: pageOffset + idx, status: 'pending',
          accountValue: 0, unrealizedPnl: 0, marginUsed: 0, withdrawable: 0, spotUsdc: 0,
          positions: [], trades: [],
        });
      });
      setNodes(Array.from(allNodesRef.current.values()).sort((a, b) => a.idx - b.idx));
      setPhase('streaming');

      let i = 0;
      const concurrency = Math.min(6, addresses.length);
      const workers = Array.from({ length: concurrency }, async () => {
        while (i < addresses.length && !abortRef.current) {
          const idx = i++;
          const addr = addresses[idx];
          try {
            const [perpState, fills, spotState] = await Promise.all([
              getHLUserState(addr),
              getHLUserFills(addr),
              getHLSpotState(addr).catch(() => null),
            ]);

            const summary = perpState?.marginSummary;
            const nodePositions = (perpState?.assetPositions ?? [])
              .filter((p: any) => Number(p.position?.szi) !== 0)
              .map((p: any) => ({ ...p.position, parentProxy: addr }));

            const spotBalances: any[] = spotState?.balances ?? [];
            const usdcSpot = spotBalances.find(
              (b: any) => b.coin === 'USDC' || b.coin === 'USDC:0xe3b'
            );
            const spotUsdc = usdcSpot ? Number(usdcSpot.total ?? 0) : 0;

            const result: NodeState = {
              address: addr, idx: pageOffset + idx,
              status: (summary || fills?.length || spotUsdc > 0) ? 'loaded' : 'empty',
              accountValue: Number(summary?.accountValue ?? 0),
              unrealizedPnl: Number(summary?.unrealizedPnl ?? 0),
              marginUsed: Number(summary?.totalMarginUsed ?? 0),
              withdrawable: Number(perpState?.withdrawable ?? 0),
              spotUsdc,
              positions: nodePositions,
              trades: (fills ?? []).map((f: any) => ({ ...f, parentProxy: addr })),
            };

            // Update the map and recompute from ALL accumulated nodes
            allNodesRef.current.set(addr, result);
            const allSorted = Array.from(allNodesRef.current.values()).sort((a, b) => a.idx - b.idx);
            setNodes(allSorted);
            recomputeTotals(allSorted, registry.total);
          } catch (e) {
            console.error(`Error loading node ${addr}`, e);
          }
        }
      });

      await Promise.all(workers);
      if (!abortRef.current) {
        const currentTotalPages = Math.ceil(registry.total / registry.pageSize);
        if (page < currentTotalPages) {
          setPage(p => p + 1); // triggers useEffect → loads next page automatically
        } else {
          setPhase('done'); // all pages loaded
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load portfolio');
      setPhase('error');
    }
  }, [address, signTypedDataAsync, recomputeTotals, page]);

  useEffect(() => { return () => { abortRef.current = true; }; }, [address]);

  const handleSync = useCallback(() => {
    allNodesRef.current = new Map();
    if (page !== 1) {
      setPage(1); // this triggers the useEffect which calls load()
    } else {
      load(); // already page 1, call directly
    }
  }, [page, load]);

  // This already works correctly since nodes state now holds all accumulated nodes
  const displayNodes = hideEmpty ? nodes.filter(n => n.status !== 'empty') : nodes;
  const isLoading = phase === 'auth' || phase === 'streaming';

  const metrics = [
    {
      label: 'Total Value', value: totals.accountValue, prefix: '$', decimals: 2,
      color: 'text-white', icon: <TrendingUp size={14} />
    },
    {
      label: 'Net PnL', value: totals.unrealizedPnl, prefix: '', decimals: 2,
      color: totals.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400', icon: <Activity size={14} />
    },
    {
      label: 'Spot USDC', value: totals.spotUsdc, prefix: '$', decimals: 2,
      color: 'text-cyan-400', icon: <DollarSign size={14} />
    },
    {
      label: 'Active Nodes',
      value: totals.loadedCount,  // 👈 loaded so far, not grandTotal
      suffix: `/ ${grandTotal}`,
      prefix: '', decimals: 0,
      color: 'text-purple-400', icon: <Target size={14} />
    },
    {
      label: 'Total Trades', value: totals.history.length, prefix: '', decimals: 0,
      color: 'text-white', icon: <History size={14} />
    },
  ];

  /* ── IDLE: show unlock screen ── */
  if (phase === 'idle') {
    return (
      <>
        {/* Keep header accessible even on unlock screen */}
        <Header onNavigate={onNavigate} currentPage="portfolio" />
        <PortfolioUnlockScreen onUnlock={load} />
      </>
    );
  }

  /* ── ACTIVE: portfolio data ── */
  return (
    <motion.div
      className="min-h-screen text-white overflow-x-hidden relative"
      style={{ background: '#0d0a12' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background */}
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

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers size={13} className="text-purple-400" />
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                Aggregated Stealth Network
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Global Ledger</h1>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/8 border border-purple-500/20">
                <Loader2 size={12} className="text-purple-400 animate-spin" />
                <span className="text-xs text-purple-400">
                  {phase === 'auth' ? 'Signing…' : `${totals.loadedCount}/${totals.totalCount} nodes`}
                </span>
              </div>
            )}
            <motion.button
              onClick={handleSync} disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-full btn-purple text-white text-xs font-medium disabled:opacity-50"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            >
              {isLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Sync
            </motion.button>
          </div>
        </motion.div>
        {/* Global Social Proof Banner */}
        {globalCount?.totalStealthAddresses && globalCount?.totalStealthAddresses > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-3 px-5 py-3 rounded-2xl border border-purple-500/10 bg-purple-500/5"
          >
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Network</span>
            </div>
            <div className="h-3 w-px bg-white/10" />

            <AnimatedNumber
              value={globalCount?.totalStealthAddresses ?? 0}
              prefix=""
              decimals={0}
              className="text-sm font-semibold text-white tabular-nums"
            />

            <span className="text-xs text-gray-500">stealth addresses secured globally</span>
          </motion.div>
        )}

        {/* Error */}
        <AnimatePresence>
          {phase === 'error' && error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-red-500/8 border border-red-500/20"
            >
              <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={load}
                className="ml-auto text-xs text-red-400 border border-red-400/30 px-3 py-1 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0"
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="glass-card rounded-2xl p-4 sm:p-5"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] text-gray-600 font-medium">{m.label}</span>
                <div className="text-purple-400/60">{m.icon}</div>
              </div>
              {isLoading && m.value === 0 ? (
                <div className="h-6 w-20 rounded-lg shimmer" />
              ) : (
                <AnimatedNumber
                  value={m.value} prefix={m.prefix} decimals={m.decimals}
                  suffix={m.suffix}
                  className={`text-lg sm:text-2xl font-semibold ${m.color}`}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Open Positions */}
        {totals.positions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl overflow-hidden"
          >
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
                    <tr key={i} className="border-b border-white/2 hover:bg-white/2 transition-colors">
                      <td className="px-4 sm:px-6 py-3 text-sm font-semibold text-white">{pos.coin}</td>
                      <td className="px-4 sm:px-6 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${Number(pos.szi) > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                          {Number(pos.szi) > 0 ? 'Long' : 'Short'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-xs font-mono text-gray-400">{numFmt(Math.abs(pos.szi))}</td>
                      <td className="px-4 sm:px-6 py-3 text-xs font-mono text-gray-400">${numFmt(pos.entryPx)}</td>
                      <td className={`px-4 sm:px-6 py-3 text-xs font-mono font-semibold ${Number(pos.unrealizedPnl) >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                        {Number(pos.unrealizedPnl) >= 0 ? '+' : ''}{numFmt(pos.unrealizedPnl)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-[10px] font-mono text-purple-400/50">
                        …{pos.parentProxy?.slice(-6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Trade History */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          <div className="px-4 sm:px-6 py-4 border-b border-white/5 flex items-center gap-3">
            <History size={14} className="text-purple-400" />
            <span className="text-sm font-medium text-gray-300">Trade History</span>
            <span className="text-[10px] text-gray-600 ml-auto">
              {totals.history.length} fills · all nodes
            </span>
          </div>
          <div className="max-h-64 sm:max-h-96 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left min-w-[380px]">
              <thead className="sticky top-0 z-10" style={{ background: 'rgba(15,10,28,0.96)' }}>
                <tr className="border-b border-white/5">
                  {['Time', 'Asset', 'Side', 'Price', 'Size', 'Node'].map(h => (
                    <th key={h} className="px-3 sm:px-6 py-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {totals.history.map((fill: any, i: number) => (
                  <tr key={i} className="border-b border-white/2 hover:bg-white/2 transition-colors">
                    <td className="px-3 sm:px-6 py-2.5 text-[10px] font-mono text-gray-600 whitespace-nowrap">
                      {new Date(fill.time).toLocaleTimeString()}
                    </td>
                    <td className="px-3 sm:px-6 py-2.5 text-xs font-semibold text-white">{fill.coin}</td>
                    <td className="px-3 sm:px-6 py-2.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${fill.side === 'B' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                        {fill.side === 'B' ? 'Buy' : 'Sell'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-2.5 text-xs font-mono text-gray-400">${numFmt(fill.px)}</td>
                    <td className="px-3 sm:px-6 py-2.5 text-xs font-mono text-gray-400">{numFmt(fill.sz)}</td>
                    <td className="px-3 sm:px-6 py-2.5 text-[10px] font-mono text-purple-400/50">
                      …{fill.parentProxy?.slice(-6)}
                    </td>
                  </tr>
                ))}
                {totals.history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <History size={20} className="mx-auto mb-2 text-gray-700" />
                      <p className="text-sm text-gray-600">
                        {isLoading ? 'Scanning nodes…' : 'No trade history found'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Node Infrastructure */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Node Infrastructure</h2>
            <motion.button
              onClick={() => setHideEmpty(h => !h)}
              className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              whileHover={{ scale: 1.04 }}
            >
              {hideEmpty ? <EyeOff size={12} /> : <Eye size={12} />}
              {hideEmpty ? 'Show empty' : 'Hide empty'}
            </motion.button>
          </div>
          <div className="space-y-2">
            {displayNodes.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-600 text-sm">No nodes to display</div>
            )}
            {isLoading && displayNodes.length === 0 &&
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-2xl shimmer" />
              ))
            }
            {displayNodes.map((node, i) => (
              <NodeRow key={node.address} node={node} index={i} />
            ))}
          </div>
        </motion.div>

        {/* Replace the Pagination block with this progress bar */}
        {grandTotal > 0 && (
          <div className="flex flex-col items-center gap-2 pt-4">
            <div className="w-full max-w-sm h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                animate={{ width: `${(totals.loadedCount / grandTotal) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] text-gray-600 font-mono">
              {totals.loadedCount} / {grandTotal} nodes indexed
            </span>
          </div>
        )}


      </main>
    </motion.div>
  );
}

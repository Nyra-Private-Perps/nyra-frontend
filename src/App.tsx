"use client";
import { useState, useRef, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Shield, Lock, Eye, Zap, ArrowRight, ChevronDown,
  Activity, Globe, Check
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Providers } from './providers'
import DashboardLayout from './components/dashboard/DashboardLayout'
import PortfolioPage from './components/portfolio/PortfolioPage'
import { onPendingRequest, resolveRequest, type PendingRequest } from '@/lib/walletController'

type Page = 'dashboard' | 'portfolio'

/* ═══════════════════════════════════════════════════════════
   ANIMATED SHAPES — guaranteed to float continuously
═══════════════════════════════════════════════════════════ */
function ElegantShape({
  className, delay = 0, width = 400, height = 100, rotate = 0, gradient = 'from-purple-500/[0.10]',
}: {
  className?: string; delay?: number; width?: number; height?: number; rotate?: number; gradient?: string;
}) {
  return (
    <motion.div
      className={cn('absolute pointer-events-none select-none', className)}
      initial={{ opacity: 0, y: -120, rotate: rotate - 12 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{
        duration: 2.2,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.0, delay },
      }}
    >
      {/* Continuous float — inner element so it keeps looping regardless of outer */}
      <motion.div
        style={{ width, height }}
        animate={{ y: [0, 18, 0] }}
        transition={{
          duration: 8 + delay * 2,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'easeInOut',
          delay: delay * 0.5,
        }}
        className="relative"
      >
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            'bg-gradient-to-r to-transparent',
            gradient,
            'border border-white/[0.08]',
            'after:absolute after:inset-0 after:rounded-full',
            'after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_70%)]',
          )}
          style={{
            boxShadow: '0 8px 40px 0 rgba(147,51,234,0.08)',
            backdropFilter: 'blur(1px)',
          }}
        />
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   GLOBAL SIGNING MODAL — untouched functionality
═══════════════════════════════════════════════════════════ */
function GlobalSigningModal() {
  const [pendingReq, setPendingReq] = useState<PendingRequest | null>(null)
  const [signing, setSigning] = useState(false)
  const [done, setDone] = useState(false)
  const handledRef = useRef(false)

  useEffect(() => {
    const unsub = onPendingRequest((req: any) => {
      if (req && !req.missingKeys) {
        handledRef.current = false
        setTimeout(() => { if (!handledRef.current) { flushSync(() => setPendingReq(req)) } }, 80)
      } else if (!req) {
        if (!handledRef.current) { setPendingReq(null); setSigning(false); setDone(false) }
      }
    })
    return () => unsub()
  }, [])

  const handleApprove = () => {
    if (!pendingReq) return
    handledRef.current = true; setSigning(true); resolveRequest(true)
    setTimeout(() => {
      setDone(true)
      setTimeout(() => { setSigning(false); setDone(false); setPendingReq(null); handledRef.current = false }, 1800)
    }, 400)
  }
  const handleReject = () => {
    handledRef.current = true; resolveRequest(false)
    setPendingReq(null); setSigning(false); setDone(false)
  }

  if (!pendingReq) return null

  return (
    <AnimatePresence>
      <motion.div
        key="gsm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-0"
        style={{ background: 'rgba(3,3,10,0.88)', backdropFilter: 'blur(16px)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="w-full max-w-sm rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(20,12,40,0.97)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 0 80px rgba(147,51,234,0.25), 0 32px 64px rgba(0,0,0,0.8)',
          }}
        >
          <div className="px-6 py-5 flex items-center gap-3 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
              <Shield size={16} className="text-purple-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">Signature Request</p>
              <p className="text-[9px] font-mono text-white/25">Hyperliquid · Active Session</p>
            </div>
          </div>
          <div className="p-6 space-y-5">
            {done ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl mx-auto bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                  <Shield size={24} className="text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-white">Identity Authenticated</p>
                <p className="text-[10px] font-mono text-white/30">Trading session active</p>
              </motion.div>
            ) : (
              <>
                <p className="text-[11px] leading-relaxed text-center text-white/50">
                  Hyperliquid is requesting your stealth identity to authorise a new trading session.
                </p>
                <div className="px-4 py-3 rounded-2xl flex items-center justify-between bg-white/3 border border-white/7">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">Method</span>
                  <Badge variant="outline" className="text-[9px] font-mono border-purple-500/30 text-purple-400">
                    {pendingReq.params.request.method}
                  </Badge>
                </div>
                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleApprove} disabled={signing}
                    className="w-full h-12 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 btn-purple transition-all"
                  >
                    {signing
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing...</>
                      : 'Confirm & Sign'
                    }
                  </button>
                  <button onClick={handleReject} className="w-full py-2.5 text-[10px] font-medium text-white/25 hover:text-white/50 transition-colors uppercase tracking-widest">
                    Reject
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD PANEL — slides up from bottom, covers everything.
   NO close button, NO backdrop click-to-dismiss.
   Once open it IS the app. Portfolio navigates within it.
═══════════════════════════════════════════════════════════ */
function DashboardPanel({
  open, onNavigate,
}: {
  open: boolean;
  onNavigate: (p: Page) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="dashboard-panel"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 34,
            mass: 0.9,
          }}
          className="fixed inset-x-0 bottom-0 z-[80] flex flex-col"
          style={{
            height: '100dvh',
            background: '#0d0a12',
            boxShadow: '0 -32px 100px rgba(147,51,234,0.20), 0 -1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Top edge pill — purely decorative, shows the panel is open */}
          <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/10" />
          </div>

          {/* Scrollable dashboard fills 100% */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
            <DashboardLayout
              onNavigate={(p) => onNavigate(p as Page)}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════
   LANDING HERO — shown always when panel is not open
═══════════════════════════════════════════════════════════ */
const STEPS = [
  'Connect your wallet to Nyra',
  'Create a stealth address (as many as you need)',
  'Deposit funds from your main wallet into any stealth address',
  'Trade on Hyperliquid directly through the stealth address',
  'Track all positions across stealth addresses in one portfolio view',
  'Withdraw back to your connected wallet anytime',
];

function LandingHero({
  onGetStarted,
  isConnected,
}: {
  onGetStarted: () => void;
  isConnected: boolean;
}) {
  /* word-by-word reveal variants */
  const wordReveal = {
    hidden: { opacity: 0, y: 36, filter: 'blur(6px)' },
    visible: (i: number) => ({
      opacity: 1, y: 0, filter: 'blur(0px)',
      transition: {
        duration: 0.7,
        delay: 0.3 + i * 0.11,
        ease: [0.23, 0.86, 0.39, 0.96] as const,
      },
    }),
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.7, delay: 0.5 + i * 0.14, ease: [0.25, 0.4, 0.25, 1] as const },
    }),
  };

  // headline split for animation
  const h1words = ['Trade', 'on', 'Hyperliquid.'];
  const h2words = ["Nobody", "knows", "it's", 'you.'];

  return (
    <div
      className="relative min-h-screen w-full flex flex-col overflow-hidden"
      style={{ background: '#030308' }}
    >
      {/* ── Background ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-transparent to-indigo-950/20" />

        {/* Floating shapes */}
        <ElegantShape
          delay={0.1}  width={680} height={160} rotate={10}
          gradient="from-purple-500/[0.13]"
          className="left-[-14%] top-[16%]"
        />
        <ElegantShape
          delay={0.4}  width={500} height={120} rotate={-13}
          gradient="from-violet-500/[0.10]"
          className="right-[-8%] top-[60%]"
        />
        <ElegantShape
          delay={0.55} width={240} height={60}  rotate={20}
          gradient="from-indigo-400/[0.12]"
          className="right-[16%] top-[10%]"
        />
        <ElegantShape
          delay={0.25} width={320} height={78}  rotate={-6}
          gradient="from-purple-400/[0.08]"
          className="left-[5%] bottom-[10%]"
        />
        <ElegantShape
          delay={0.7}  width={160} height={40}  rotate={-25}
          gradient="from-fuchsia-400/[0.10]"
          className="left-[28%] top-[6%]"
        />

        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030308]/60 via-transparent to-[#030308]/80" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Minimal top nav */}
        <nav className="flex items-center justify-between px-6 sm:px-10 pt-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Shield size={15} className="text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-wide">NYRA</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-white/40 font-medium uppercase tracking-widest">Protocol v2 · Arbitrum</span>
          </div>
        </nav>

        {/* Hero body — vertically centered in remaining space */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-12 text-center max-w-3xl mx-auto w-full">

          {/* Headline — word by word */}
          <div className="mb-5 w-full">
            {/* Line 1 */}
            <div className="flex flex-wrap items-baseline justify-center gap-x-[0.3em] gap-y-0">
              {h1words.map((word, i) => (
                <motion.span
                  key={`h1-${i}`}
                  custom={i}
                  variants={wordReveal}
                  initial="hidden"
                  animate="visible"
                  className="text-[clamp(2.6rem,8vw,5.5rem)] font-bold tracking-tight leading-none inline-block"
                  style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.75) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </div>
            {/* Line 2 — "Nobody" gets purple */}
            <div className="flex flex-wrap items-baseline justify-center gap-x-[0.3em] gap-y-0 mt-1 sm:mt-2">
              {h2words.map((word, i) => (
                <motion.span
                  key={`h2-${i}`}
                  custom={h1words.length + i}
                  variants={wordReveal}
                  initial="hidden"
                  animate="visible"
                  className={cn(
                    'text-[clamp(2.6rem,8vw,5.5rem)] font-bold tracking-tight leading-none inline-block',
                    i === 0
                      ? 'bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-300 to-violet-400'
                      : '',
                  )}
                  style={i !== 0 ? {
                    background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.75) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  } : {}}
                >
                  {word}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Subline */}
          <motion.p
            custom={0} variants={fadeUp} initial="hidden" animate="visible"
            className="text-base sm:text-lg text-white/38 mb-10 max-w-md leading-relaxed font-light"
          >
            Nyra creates stealth addresses linked to your wallet.{' '}
            <span className="text-white/55">Deposit, trade, withdraw.</span>{' '}
            Your positions stay private.
          </motion.p>

          {/* How it works steps */}
          <motion.div
            custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="w-full mb-10"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-2xl mx-auto">
              {STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.09, duration: 0.5 }}
                  className="flex items-start gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.045)' }}
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                    style={{ background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(168,85,247,0.25)' }}>
                    <span className="text-[9px] font-bold text-purple-400">{i + 1}</span>
                  </div>
                  <p className="text-[12px] text-white/45 leading-relaxed">{step}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer line + CTA */}
          <motion.div
            custom={2} variants={fadeUp} initial="hidden" animate="visible"
            className="flex flex-col items-center gap-4"
          >
            {/* Footer tagline */}
            <p className="text-[11px] text-white/25 tracking-[0.18em] uppercase font-medium">
              Your trades. Your keys. Zero public trail.
            </p>

            {/* CTA button */}
            <ConnectButton.Custom>
              {({ openConnectModal, mounted }) => (
                <div {...(!mounted && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none' as const } })}>
                  <motion.button
                    onClick={() => {
                      if (!isConnected) {
                        openConnectModal();
                      } else {
                        onGetStarted();
                      }
                    }}
                    className="relative inline-flex items-center gap-3 px-9 py-4 rounded-full text-white font-semibold text-base sm:text-lg overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 50%, #4f46e5 100%)',
                      boxShadow: '0 0 0 1px rgba(168,85,247,0.3), 0 8px 32px rgba(147,51,234,0.3)',
                    }}
                    whileHover={{
                      scale: 1.04,
                      boxShadow: '0 0 60px rgba(147,51,234,0.6), 0 0 0 1px rgba(168,85,247,0.5)',
                    }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                  >
                    {/* Shimmer on hover */}
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.13] to-transparent -skew-x-12 pointer-events-none"
                      initial={{ x: '-120%' }}
                      whileHover={{ x: '220%' }}
                      transition={{ duration: 0.55, ease: 'easeInOut' }}
                    />
                    <span className="relative z-10">Get Started</span>
                    <motion.span
                      className="relative z-10"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight size={18} />
                    </motion.span>
                  </motion.button>
                </div>
              )}
            </ConnectButton.Custom>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8, duration: 1 }}
          className="flex flex-col items-center gap-1.5 pb-6 text-white/15"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={16} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   APP CONTENT
   Flow:
   - Not connected → landing with "Get Started" → opens wallet modal
   - Wallet connects → panel slides UP covering full screen
   - Panel IS the app. No close. No going back.
   - Portfolio from panel → full page. Back to dashboard → panel shows again.
═══════════════════════════════════════════════════════════ */
function AppContent() {
  const { isConnected } = useAccount()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [panelOpen, setPanelOpen] = useState(false)

  // When wallet first connects, slide the panel up
  // Use a ref to only trigger once on first connection
  const hasOpenedRef = useRef(false)
  useEffect(() => {
    if (isConnected && !hasOpenedRef.current) {
      hasOpenedRef.current = true
      // Small delay so the wallet modal closes first, then panel slides up
      setTimeout(() => setPanelOpen(true), 350)
    }
    if (!isConnected) {
      hasOpenedRef.current = false
      setPanelOpen(false)
    }
  }, [isConnected])

  return (
    <div className="min-h-screen text-white selection:bg-purple-500/30" style={{ background: '#030308' }}>
      {isConnected && <GlobalSigningModal />}

      {/* Landing — always mounted behind the panel so shapes keep animating */}
      {currentPage !== 'portfolio' && (
        <LandingHero
          onGetStarted={() => setPanelOpen(true)}
          isConnected={isConnected}
        />
      )}

      {/* Portfolio — z-[90] sits ABOVE the dashboard panel (z-[80]).
          We switch currentPage to 'portfolio' first so portfolio mounts
          and covers the panel instantly. The panel then exits behind it.
          No flash possible because portfolio is always on top during transition. */}
      <AnimatePresence>
        {currentPage === 'portfolio' && (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-0 z-[90] overflow-y-auto"
            style={{ background: '#0d0a12' }}
          >
            <PortfolioPage
              onNavigate={(p) => {
                if (p === 'dashboard') {
                  // Portfolio exits, panel is already mounted below (just closed),
                  // re-open it after a brief exit animation
                  setCurrentPage('dashboard')
                  setTimeout(() => setPanelOpen(true), 80)
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard panel — z-[80], always mounted when on dashboard page.
          When navigating to portfolio: setCurrentPage('portfolio') first →
          portfolio mounts at z-[90] covering everything → then we close panel. */}
      {currentPage === 'dashboard' && (
        <DashboardPanel
          open={panelOpen}
          onNavigate={(p) => {
            if (p === 'portfolio') {
              // 1. Switch page first — portfolio mounts at z-[90] above panel
              setCurrentPage('portfolio')
              // 2. Now close panel behind portfolio (user never sees landing)
              setPanelOpen(false)
            }
          }}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  )
}

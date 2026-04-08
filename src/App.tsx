"use client";
import { useState, useRef, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useAccount, useSwitchChain } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Shield, Lock, Eye, Zap, ArrowRight, ChevronDown, Activity, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Providers } from './providers'
import DashboardLayout from './components/dashboard/DashboardLayout'
import PortfolioPage from './components/portfolio/PortfolioPage'
import { onPendingRequest, resolveRequest, type PendingRequest } from '@/lib/walletController'
import { apiGetMetrics } from '@/lib/api/hyperStealth'
import Nyralogo from "../public/nyra-logo.png";

const ARBITRUM_ID = 42161
const HORIZEN_ID = 26514;

/* ─── Floating pill shape ──────────────────────────────── */
function ElegantShape({
  className, delay = 0, width = 400, height = 100, rotate = 0, gradient = 'from-purple-500/[0.10]',
}: {
  className?: string; delay?: number; width?: number; height?: number; rotate?: number; gradient?: string;
}) {
  return (
    <motion.div
      className={cn('absolute pointer-events-none select-none', className)}
      initial={{ opacity: 0, y: -100, rotate: rotate - 12 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ duration: 2.0, delay, ease: [0.23, 0.86, 0.39, 0.96], opacity: { duration: 1.0, delay } }}
    >
      <motion.div
        style={{ width, height }}
        animate={{ y: [0, 18, 0] }}
        transition={{ duration: 8 + delay * 2, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut', delay: delay * 0.4 }}
        className="relative"
      >
        <div
          className={cn('absolute inset-0 rounded-full bg-gradient-to-r to-transparent', gradient, 'border border-white/[0.07]', 'after:absolute after:inset-0 after:rounded-full after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.07),transparent_70%)]')}
          style={{ boxShadow: '0 8px 40px 0 rgba(147,51,234,0.07)', backdropFilter: 'blur(1px)' }}
        />
      </motion.div>
    </motion.div>
  )
}

/* ─── Shared animated background ──────────────────────── */
function PageBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/35 via-transparent to-indigo-950/20" />
      <ElegantShape delay={0.1} width={680} height={160} rotate={10} gradient="from-purple-500/[0.12]" className="left-[-14%] top-[16%]" />
      <ElegantShape delay={0.4} width={500} height={120} rotate={-13} gradient="from-violet-500/[0.09]" className="right-[-8%]  top-[58%]" />
      <ElegantShape delay={0.55} width={240} height={60} rotate={20} gradient="from-indigo-400/[0.11]" className="right-[16%] top-[9%]" />
      <ElegantShape delay={0.25} width={320} height={78} rotate={-6} gradient="from-purple-400/[0.07]" className="left-[5%]   bottom-[9%]" />
      <ElegantShape delay={0.7} width={160} height={40} rotate={-25} gradient="from-fuchsia-400/[0.09]" className="left-[28%]  top-[6%]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#030308]/55 via-transparent to-[#030308]/75" />
    </div>
  )
}

/* ─── Global Signing Modal ──────────────────────────────── */
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
    handledRef.current = true; resolveRequest(false); setPendingReq(null); setSigning(false); setDone(false)
  }

  if (!pendingReq) return null
  return (
    <AnimatePresence>
      <motion.div key="gsm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-0"
        style={{ background: 'rgba(3,3,10,0.88)', backdropFilter: 'blur(16px)' }}>
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="w-full max-w-sm rounded-3xl overflow-hidden"
          style={{ background: 'rgba(20,12,40,0.97)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 0 80px rgba(147,51,234,0.25), 0 32px 64px rgba(0,0,0,0.8)' }}>
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
                <p className="text-[11px] leading-relaxed text-center text-white/50">Hyperliquid is requesting your stealth identity to authorise a new trading session.</p>
                <div className="px-4 py-3 rounded-2xl flex items-center justify-between bg-white/3 border border-white/7">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/25">Method</span>
                  <Badge variant="outline" className="text-[9px] font-mono border-purple-500/30 text-purple-400">{pendingReq.params.request.method}</Badge>
                </div>
                <div className="space-y-2 pt-1">
                  <button onClick={handleApprove} disabled={signing}
                    className="w-full h-12 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 btn-purple transition-all">
                    {signing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing...</> : 'Confirm & Sign'}
                  </button>
                  <button onClick={handleReject} className="w-full py-2.5 text-[10px] font-medium text-white/25 hover:text-white/50 transition-colors uppercase tracking-widest">Reject</button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ─── Landing sections ──────────────────────────────────── */
/* ─── Landing Page ──────────────────────────────────────── */
function LandingPage() {
  const navigate = useNavigate()
  const { isConnected } = useAccount()
  const { switchChain } = useSwitchChain()
  const hasNavigatedRef = useRef(false)
  const [metrics, setMetrics] = useState<{ totalStealthAddresses: number } | null>(null)

  useEffect(() => {
    apiGetMetrics().then(res => setMetrics(res)).catch(console.error)
  }, [])

  // If already connected, open dashboard immediately
  useEffect(() => {
    if (isConnected && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true
      switchChain({ chainId: HORIZEN_ID })
      setTimeout(() => navigate('/dashboard'), 300)
    }
  }, [isConnected])

  /* Word reveal variants */
  const wordVariant = {
    hidden: { opacity: 0, y: 38, filter: 'blur(6px)' },
    visible: (i: number) => ({
      opacity: 1, y: 0, filter: 'blur(0px)',
      transition: { duration: 0.65, delay: 0.2 + i * 0.1, ease: [0.23, 0.86, 0.39, 0.96] as const },
    }),
  }

  const h1 = ['Trade', 'on', 'Hyperliquid.']
  const h2 = ['Nobody', 'knows', "it's", 'you.']

  return (
    <div className="relative h-screen min-h-[600px] w-full overflow-hidden flex flex-col" style={{ background: '#030308' }}>
      <PageBackground />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 sm:px-10 pt-8 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <img src={Nyralogo} width={"150px"} height={"100px"} alt="nyra logo" />
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-white/40 font-medium uppercase tracking-widest hidden sm:inline">Protocol v2 · Horizen</span>
          </div>
        </nav>

        {/* HERO */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-5 sm:px-8 max-w-4xl mx-auto w-full -mt-12">

          {/* Subtle user count pill */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex items-center gap-3 px-4 py-1.5 rounded-full mb-8"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex -space-x-2">
              {['bg-purple-500', 'bg-blue-500', 'bg-fuchsia-500'].map((color, i) => (
                <div key={i} className={`w-5 h-5 rounded-full ${color} opacity-80 border-2 border-[#030308]`} />
              ))}
            </div>
            <span className="text-[11px] font-medium text-gray-400 tracking-wide uppercase">Trusted by <span className="text-white font-bold tracking-wider">{metrics ? `${metrics.totalStealthAddresses}+` : '...'}</span> participants</span>
          </motion.div>

          {/* Headline */}
          <div className="mb-12 w-full">
            <div className="flex flex-wrap items-baseline justify-center gap-x-[0.45em]">
              {h1.map((w, i) => (
                <motion.span key={`h1-${i}`} custom={i} variants={wordVariant} initial="hidden" animate="visible"
                  className="text-[clamp(2.8rem,8.5vw,6rem)] font-bold tracking-tight leading-none inline-block"
                  style={{ background: 'linear-gradient(180deg,#fff 0%,rgba(255,255,255,0.72) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {w}
                </motion.span>
              ))}
            </div>
            <div className="flex flex-wrap items-baseline justify-center gap-x-[0.45em] mt-1 sm:mt-2">
              {h2.map((w, i) => (
                <motion.span key={`h2-${i}`} custom={h1.length + i} variants={wordVariant} initial="hidden" animate="visible"
                  className={cn('text-[clamp(2.8rem,8.5vw,6rem)] font-bold tracking-tight leading-none inline-block',
                    i === 0 ? 'bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-300 to-violet-400' : '')}
                  style={i !== 0 ? { background: 'linear-gradient(180deg,#fff 0%,rgba(255,255,255,0.72) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } : {}}>
                  {w}
                </motion.span>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.8 }}
            className="flex flex-col items-center">

            <ConnectButton.Custom>
              {({ openConnectModal, mounted }) => (
                <div {...(!mounted && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none' as const } })}>
                  <motion.button
                    onClick={() => {
                      if (isConnected) {
                        switchChain({ chainId: HORIZEN_ID })
                        navigate('/dashboard')
                      } else {
                        openConnectModal()
                      }
                    }}
                    className="relative inline-flex items-center gap-3 px-9 py-4 sm:py-5 rounded-full text-white font-semibold text-base sm:text-lg overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg,#9333ea 0%,#7c3aed 50%,#4f46e5 100%)',
                      boxShadow: '0 0 0 1px rgba(168,85,247,0.3), 0 8px 32px rgba(147,51,234,0.35)',
                    }}
                    whileHover={{ scale: 1.04, boxShadow: '0 0 60px rgba(147,51,234,0.6),0 0 0 1px rgba(168,85,247,0.5)' }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.18 }}>
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.13] to-transparent -skew-x-12 pointer-events-none"
                      initial={{ x: '-120%' }} whileHover={{ x: '220%' }}
                      transition={{ duration: 0.55, ease: 'easeInOut' }} />
                    <span className="relative z-10">Get Started</span>
                    <motion.span className="relative z-10"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
                      <ArrowRight size={18} />
                    </motion.span>
                  </motion.button>
                </div>
              )}
            </ConnectButton.Custom>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

/* ─── Dashboard Route ─────────────────────────────────── */
function DashboardRoute() {
  const { isConnected } = useAccount()
  const { switchChain } = useSwitchChain()
  const navigate = useNavigate()

  // Enforce Arbitrum on dashboard
  useEffect(() => {
    if (!isConnected) { navigate('/') }
    else switchChain({ chainId: HORIZEN_ID })
  }, [isConnected])

  if (!isConnected) return null

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="min-h-screen"
      style={{ background: '#0d0a12' }}
    >
      <DashboardLayout onNavigate={(p) => navigate(`/${p}`)} />
    </motion.div>
  )
}

/* ─── Portfolio Route ─────────────────────────────────── */
function PortfolioRoute() {
  const { isConnected } = useAccount()
  const { switchChain } = useSwitchChain()
  const navigate = useNavigate()

  // Enforce Arbitrum on portfolio
  useEffect(() => {
    if (!isConnected) { navigate('/') }
    else switchChain({ chainId: ARBITRUM_ID })
  }, [isConnected])

  if (!isConnected) return null

  return (
    <motion.div
      key="portfolio"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="min-h-screen"
      style={{ background: '#0d0a12' }}
    >
      <PortfolioPage onNavigate={(p) => navigate(`/${p}`)} />
    </motion.div>
  )
}

/* ─── AppContent with routing ─────────────────────────── */
function AppContent() {
  const { isConnected } = useAccount()
  const location = useLocation()
  const navigate = useNavigate()
  const { switchChain } = useSwitchChain()

  // On wallet connect: switch to Arbitrum + go to dashboard
  const hasConnectedRef = useRef(false)
  useEffect(() => {
    if (isConnected && !hasConnectedRef.current) {
      hasConnectedRef.current = true
      switchChain({ chainId: HORIZEN_ID })
      if (location.pathname === '/' || location.pathname === '') {
        setTimeout(() => navigate('/dashboard'), 350)
      }
    }
    if (!isConnected) {
      hasConnectedRef.current = false
      navigate('/')
    }
  }, [isConnected])

  return (
    <div className="min-h-screen text-white selection:bg-purple-500/30">
      {isConnected && <GlobalSigningModal />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/portfolio" element={<PortfolioRoute />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </AnimatePresence>
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

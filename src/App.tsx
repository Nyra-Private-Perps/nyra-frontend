"use client";
import { useState, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Shield, Zap, Lock, Activity, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Providers } from './providers'
import DashboardLayout from './components/dashboard/DashboardLayout'
import PortfolioPage from './components/portfolio/PortfolioPage'
import { onPendingRequest, resolveRequest, type PendingRequest } from '@/lib/walletController'

type Page = 'dashboard' | 'portfolio'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const statCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

// ── Global Signing Modal ──────────────────────────────────────
function GlobalSigningModal() {
  const [pendingReq, setPendingReq] = useState<PendingRequest | null>(null)
  const [signing, setSigning] = useState(false)
  const [done, setDone] = useState(false)
  const handledRef = useRef(false)

  useEffect(() => {
    const unsub = onPendingRequest((req: any) => {
      if (req && !req.missingKeys) {
        handledRef.current = false
        setTimeout(() => {
          if (!handledRef.current) {
            flushSync(() => setPendingReq(req))
          }
        }, 80)
      } else if (!req) {
        if (!handledRef.current) {
          setPendingReq(null)
          setSigning(false)
          setDone(false)
        }
      }
    })
    return () => unsub()
  }, [])

  const handleApprove = () => {
    if (!pendingReq) return
    handledRef.current = true
    setSigning(true)
    resolveRequest(true)
    setTimeout(() => {
      setDone(true)
      setTimeout(() => {
        setSigning(false)
        setDone(false)
        setPendingReq(null)
        handledRef.current = false
      }, 1800)
    }, 400)
  }

  const handleReject = () => {
    handledRef.current = true
    resolveRequest(false)
    setPendingReq(null)
    setSigning(false)
    setDone(false)
  }

  if (!pendingReq) return null

  return (
    <AnimatePresence>
      <motion.div
        key="global-sign-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-0"
        style={{ background: 'rgba(13, 10, 18, 0.8)', backdropFilter: 'blur(16px)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="w-full max-w-sm rounded-3xl overflow-hidden glass-card"
          style={{ boxShadow: '0 0 60px rgba(147,51,234,0.2), 0 24px 48px rgba(0,0,0,0.6)' }}
        >
          {/* Header */}
          <div className="px-6 py-5 flex items-center gap-3 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-500/15 border border-purple-500/25">
              <Shield size={16} className="text-purple-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">Signature Request</p>
              <p className="text-[9px] font-mono text-white/25">Hyperliquid · Active Session</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {done ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-emerald-500/10 border border-emerald-500/25">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                    <Shield size={24} className="text-emerald-400" />
                  </motion.div>
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
                    onClick={handleApprove}
                    disabled={signing}
                    className="w-full h-12 rounded-2xl font-semibold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 btn-purple"
                  >
                    {signing
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing...</>
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

// ── App Content ───────────────────────────────────────────────
function AppContent() {
  const { isConnected } = useAccount()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  return (
    <div className="min-h-screen text-white selection:bg-purple-500/30" style={{ background: '#0d0a12' }}>
      {isConnected && <GlobalSigningModal />}

      <AnimatePresence mode="wait">
        {!isConnected ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen relative overflow-hidden"
          >
            {/* Subtle grid overlay on landing */}
            <div className="fixed inset-0 pointer-events-none grid-pattern" />

            {/* Floating navbar */}
            <nav className="relative z-10 flex items-center justify-between px-4 sm:px-8 pt-6 sm:pt-8 max-w-6xl mx-auto">
              <motion.div
                className="flex items-center gap-2.5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                  <Shield size={16} className="text-white" />
                </div>
                <span className="text-lg font-bold tracking-wide">NYRA</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2"
              >
                <div className="hidden sm:flex items-center gap-4 text-xs text-white/30 mr-4">
                  <span className="flex items-center gap-1"><Globe size={11} /> Arbitrum</span>
                  <span className="flex items-center gap-1"><Lock size={11} /> Non-custodial</span>
                </div>
              </motion.div>
            </nav>

            {/* Hero content */}
            <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
              <motion.div
                className="text-center max-w-3xl mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Status pill */}
                <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-8">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/8 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Protocol_v2 · System Online
                  </div>
                </motion.div>

                {/* Headline */}
                <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold text-white mb-5 leading-tight tracking-tight">
                  Trade with{' '}
                  <motion.span
                    className="text-purple-400 inline-block"
                    animate={{
                      textShadow: [
                        '0 0 20px rgba(168, 85, 247, 0)',
                        '0 0 35px rgba(168, 85, 247, 0.5)',
                        '0 0 20px rgba(168, 85, 247, 0)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    stealth
                  </motion.span>
                </motion.h1>

                <motion.p variants={itemVariants} className="text-lg text-gray-400 mb-10 max-w-md mx-auto">
                  <span className="text-white font-semibold">Privacy-first</span> perpetual trading via unlinkable stealth identities on Hyperliquid
                </motion.p>

                {/* Stats */}
                <motion.div variants={itemVariants} className="flex items-center justify-center gap-4 mb-10 flex-wrap">
                  {[
                    { value: 'EIP-712', label: 'Secure' },
                    { value: 'ARB', label: 'Native' },
                    { value: 'Non-Custodial', label: 'Always' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      className="px-6 py-4 rounded-2xl glass-card cursor-default"
                      variants={statCardVariants}
                      whileHover={{ scale: 1.05, borderColor: 'rgba(168, 85, 247, 0.35)', transition: { duration: 0.2 } }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.5 + i * 0.1, duration: 0.5 } }}
                    >
                      <motion.div
                        className="text-xl font-bold text-white"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1, transition: { delay: 0.7 + i * 0.1, duration: 0.4, type: "spring" } }}
                      >
                        {stat.value}
                      </motion.div>
                      <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Feature cards */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8 sm:mb-10">
                  {[
                    { icon: <Shield size={18} className="text-purple-400" />, title: 'Stealth', desc: 'Unlinkable nodes' },
                    { icon: <Zap size={18} className="text-amber-400" />, title: 'Permit', desc: 'EIP-712 Secure' },
                    { icon: <Activity size={18} className="text-emerald-400" />, title: 'Direct', desc: 'Arbitrum Native' },
                  ].map((f, i) => (
                    <motion.div
                      key={f.title}
                      className="p-5 rounded-2xl glass-card hover:border-purple-500/25 transition-all card-hover"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.6 + i * 0.1 } }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                        {f.icon}
                      </div>
                      <p className="text-xs font-bold text-white/80 mb-1">{f.title}</p>
                      <p className="text-[10px] text-gray-600">{f.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA */}
                <motion.div variants={itemVariants}>
                  <ConnectButton.Custom>
                    {({ openConnectModal, mounted }) => (
                      <div {...(!mounted && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none' as const } })}>
                        <motion.button
                          onClick={openConnectModal}
                          className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-full btn-purple text-white font-semibold text-base sm:text-lg relative overflow-hidden"
                          whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(147, 51, 234, 0.5)' }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.2 }}
                        >
                          <motion.span
                            className="absolute inset-0 bg-white/10 opacity-0"
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                          <span className="relative z-10">Get started</span>
                        </motion.button>
                      </div>
                    )}
                  </ConnectButton.Custom>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {currentPage === 'dashboard' && <DashboardLayout onNavigate={setCurrentPage} />}
            {currentPage === 'portfolio' && <PortfolioPage onNavigate={setCurrentPage} />}
          </motion.div>
        )}
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

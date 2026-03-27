"use client";
import { useState, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Zap, Lock, Activity, Terminal, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Providers } from './providers'
import DashboardLayout from './components/dashboard/DashboardLayout'
import PortfolioPage from './components/portfolio/PortfolioPage'
import { onPendingRequest, resolveRequest, type PendingRequest } from '@/lib/walletController'

type Page = 'dashboard' | 'portfolio'

// ─────────────────────────────────────────────────────────────
// GlobalSigningModal — always mounted, catches session_request
// from ANY page. The DashboardLayout's own listener is still
// present but this one acts as the catch-all fallback so the
// user is never stuck when they navigate away mid-session.
// ─────────────────────────────────────────────────────────────
function GlobalSigningModal() {
  const [pendingReq, setPendingReq] = useState<PendingRequest | null>(null)
  const [signing, setSigning] = useState(false)
  const [done, setDone] = useState(false)
  const handledRef = useRef(false)

  useEffect(() => {
    const unsub = onPendingRequest((req: any) => {
      if (req && !req.missingKeys) {
        // Only take over if DashboardLayout is NOT showing the modal
        // We use a small delay so DashboardLayout's flushSync fires first.
        // If the view was already set to SIGNING_REQUIRED by DashboardLayout,
        // this modal stays hidden (pendingReq stays null on that path).
        // On any other page, DashboardLayout is unmounted so its listener
        // is unregistered — this modal is the only listener, fires immediately.
        handledRef.current = false
        setTimeout(() => {
          // If still unhandled after 80ms, we own it
          if (!handledRef.current) {
            flushSync(() => setPendingReq(req))
          }
        }, 80)
      } else if (!req) {
        // null broadcast — clear if we're showing
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
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="w-full max-w-sm rounded-[32px] overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, rgba(18,14,36,0.99) 0%, rgba(10,8,20,1) 100%)',
            border: '1px solid rgba(245,158,11,0.2)',
            boxShadow: '0 0 60px rgba(245,158,11,0.12), 0 24px 48px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div className="px-6 py-5 flex items-center gap-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <Shield size={16} style={{ color: '#F59E0B' }} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em]"
                style={{ color: '#F59E0B' }}>Signature Request</p>
              <p className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Hyperliquid · Active Session
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 text-center space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                  style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                    <Shield size={24} style={{ color: '#6EE7B7' }} />
                  </motion.div>
                </div>
                <p className="text-sm font-bold text-white">Identity Authenticated</p>
                <p className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Trading session active
                </p>
              </motion.div>
            ) : (
              <>
                <p className="text-[11px] leading-relaxed text-center"
                  style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Hyperliquid is requesting your stealth identity to authorise a new trading session.
                </p>

                <div className="px-4 py-3 rounded-2xl flex items-center justify-between"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-[9px] font-black uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.25)' }}>Method</span>
                  <Badge variant="outline"
                    className="text-[9px] font-mono"
                    style={{ borderColor: 'rgba(245,158,11,0.3)', color: '#F59E0B' }}>
                    {pendingReq.params.request.method}
                  </Badge>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleApprove}
                    disabled={signing}
                    className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{
                      background: signing ? 'rgba(245,158,11,0.3)' : '#F59E0B',
                      color: '#000',
                    }}
                  >
                    {signing
                      ? <><span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Signing...</>
                      : 'Confirm & Sign'
                    }
                  </button>
                  <button
                    onClick={handleReject}
                    className="w-full py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
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

// ─────────────────────────────────────────────────────────────
// AppContent
// ─────────────────────────────────────────────────────────────
function AppContent() {
  const { isConnected } = useAccount()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  return (
    <div className="min-h-screen bg-[#08090B] text-white selection:bg-indigo-500/30 font-sans">
      {/* Global signing modal — always mounted when connected */}
      {isConnected && <GlobalSigningModal />}

      <AnimatePresence mode="wait">
        {!isConnected ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
          >
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-xl text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-12"
              >
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl mb-8">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase text-white/50">
                    System_Online // Protocol_v2
                  </span>
                </div>

                <h1 className="text-7xl font-black tracking-[-0.05em] uppercase italic mb-4 leading-none">
                  NYRA
                </h1>
                <p className="text-white/40 font-mono text-xs uppercase tracking-[0.4em] max-w-xs mx-auto">
                  Encrypted Perpetual Liquidity
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                <FeatureCard icon={<Shield className="text-indigo-400" size={20} />} title="Stealth" desc="Unlinkable nodes" delay={0.1} />
                <FeatureCard icon={<Zap className="text-amber-400" size={20} />} title="Permit" desc="EIP-712 Secure" delay={0.2} />
                <FeatureCard icon={<Terminal className="text-emerald-400" size={20} />} title="Direct" desc="Arbitrum Native" delay={0.3} />
              </div>

              <div className="space-y-6">
                <ConnectButton.Custom>
                  {({ openConnectModal, mounted }) => (
                    <div {...(!mounted && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none' as const } })}>
                      <Button
                        onClick={openConnectModal}
                        className="bg-white text-black hover:bg-neutral-200 font-black text-xs uppercase tracking-[0.2em] h-16 px-10 rounded-[24px] transition-all shadow-xl shadow-white/5 group"
                      >
                        Initiate Session Handshake
                        <Activity className="ml-3 w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </div>
                  )}
                </ConnectButton.Custom>

                <div className="flex items-center justify-center gap-6 opacity-30">
                  <div className="flex items-center gap-2">
                    <Globe size={12} />
                    <span className="text-[10px] font-mono uppercase tracking-tighter">ARB_ONE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock size={12} />
                    <span className="text-[10px] font-mono uppercase tracking-tighter">NON_CUSTODIAL</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {currentPage === 'dashboard' && <DashboardLayout onNavigate={setCurrentPage} />}
            {currentPage === 'portfolio' && <PortfolioPage onNavigate={setCurrentPage} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FeatureCard({ icon, title, desc, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] hover:bg-white/[0.04] transition-colors"
    >
      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-1">{title}</p>
      <p className="text-[9px] font-mono text-white/30 uppercase tracking-tighter">{desc}</p>
    </motion.div>
  )
}

export default function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  )
}

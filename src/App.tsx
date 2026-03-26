"use client";
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Zap, Lock, TrendingUp, Activity, Terminal, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Providers } from './providers'
import DashboardLayout from './components/dashboard/DashboardLayout'
import PortfolioPage from './components/portfolio/PortfolioPage'

type Page = 'dashboard' | 'portfolio'

function AppContent() {
  const { isConnected } = useAccount()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  return (
    <div className="min-h-screen bg-[#08090B] text-white selection:bg-indigo-500/30 font-sans">
      <AnimatePresence mode="wait">
        {!isConnected ? (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 w-full max-w-xl text-center">
              {/* Branding Section */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-12"
              >
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl mb-8">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase text-white/50">System_Online // Protocol_v2</span>
                </div>
                
                <h1 className="text-7xl font-black tracking-[-0.05em] uppercase italic mb-4 leading-none">
                  NYRA
                </h1>
                <p className="text-white/40 font-mono text-xs uppercase tracking-[0.4em] max-w-xs mx-auto">
                  Encrypted Perpetual Liquidity
                </p>
              </motion.div>

              {/* Technical Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                <FeatureCard 
                  icon={<Shield className="text-indigo-400" size={20} />} 
                  title="Stealth" 
                  desc="Unlinkable nodes" 
                  delay={0.1}
                />
                <FeatureCard 
                  icon={<Zap className="text-amber-400" size={20} />} 
                  title="Permit" 
                  desc="EIP-712 Secure" 
                  delay={0.2}
                />
                <FeatureCard 
                  icon={<Terminal className="text-emerald-400" size={20} />} 
                  title="Direct" 
                  desc="Arbitrum Native" 
                  delay={0.3}
                />
              </div>

              {/* Entrance Interaction */}
              <div className="space-y-6">
                <ConnectButton.Custom>
                  {({ account, chain, openConnectModal, mounted }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;
                    return (
                      <div {...(!ready && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none' } })}>
                        <Button
                          onClick={openConnectModal}
                          className="bg-white text-black hover:bg-neutral-200 font-black text-xs uppercase tracking-[0.2em] h-16 px-10 rounded-[24px] transition-all shadow-xl shadow-white/5 group"
                        >
                          Initiate Session Handshake
                          <Activity className="ml-3 w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      </div>
                    );
                  }}
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
            className="animate-in fade-in duration-700"
          >
            {currentPage === 'dashboard' && <DashboardLayout onNavigate={setCurrentPage} />}
            {currentPage === 'portfolio' && <PortfolioPage onNavigate={setCurrentPage} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* HELPER: Feature Card Component */
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
  );
}

export default function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  )
}

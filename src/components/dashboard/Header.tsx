"use client";
import { Shield, Activity, Menu, X, Layers, Globe, AlertTriangle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useSwitchChain } from 'wagmi'

interface HeaderProps {
  currentPage: 'dashboard' | 'portfolio'
  onNavigate: (page: 'dashboard' | 'portfolio') => void
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { chain } = useAccount();
const { switchChain } = useSwitchChain();

const ARBITRUM_ID = 42161;
const HORIZEN_ID = 26514;

// Status Helpers
const isArbitrum = chain?.id === ARBITRUM_ID;
const isHorizen = chain?.id === HORIZEN_ID;
// If on Portfolio, only Arb is allowed. If on Dashboard, Arb or Horizen are allowed.
const isWrongNetwork = currentPage === 'portfolio' ? !isArbitrum : (!isArbitrum && !isHorizen);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#12141B]/80 backdrop-blur-2xl border border-white/5 rounded-[24px] px-6 py-3 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          
          {/* LOGO AREA */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => onNavigate('dashboard')}
          >
            <div className="relative">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 group-hover:border-indigo-500/40 transition-all">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
              {/* Active Signal Pulse */}
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#12141B] animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black tracking-[0.2em] uppercase italic text-white/90">NYRA</h1>
              <div className="flex items-center gap-1">
                 <span className="text-[9px] text-indigo-400 font-mono uppercase tracking-tighter">Protocol_v2</span>
              </div>
            </div>
          </div>

          {/* CENTRAL NAVIGATION (Jumper Style) */}
          <nav className="hidden md:flex items-center bg-black/40 border border-white/5 rounded-2xl p-1 relative">
            <NavPill 
              isActive={currentPage === 'dashboard'} 
              onClick={() => onNavigate('dashboard')}
              label="Registry"
              icon={<Layers size={14} />}
            />
            <NavPill 
              isActive={currentPage === 'portfolio'} 
              onClick={() => onNavigate('portfolio')}
              label="Portfolio"
              icon={<Activity size={14} />}
            />
            
            {/* The "River" Indicator */}
            <motion.div 
              layoutId="nav-bg"
              className="absolute bg-white/5 border border-white/10 rounded-xl z-0"
              initial={false}
              animate={{
                left: currentPage === 'dashboard' ? '4px' : '50%',
                width: 'calc(50% - 4px)',
                height: 'calc(100% - 8px)'
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          </nav>

          {/* WALLET & ACTION AREA */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
            <button 
        onClick={() => switchChain({ chainId: ARBITRUM_ID })}
        className={`px-3 py-1.5 border rounded-xl flex items-center gap-2 transition-all ${
          isWrongNetwork 
            ? 'bg-red-500/10 border-red-500/20 text-red-400' 
            : isHorizen 
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : 'bg-white/5 border-white/5 text-white/40'
        }`}
      >
        {isWrongNetwork ? (
          <AlertTriangle size={12} className="animate-pulse" />
        ) : (
          <Globe className={isArbitrum ? "text-indigo-400" : "text-amber-400"} size={12} />
        )}
        
        <span className="text-[10px] font-black uppercase tracking-widest">
          {chain?.name || 'No Network'}
        </span>

        {isWrongNetwork && (
          <span className="text-[8px] bg-red-500 text-white px-1 rounded ml-1">Switch</span>
        )}
      </button>
               <ConnectButton.Custom>
                 {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                   const ready = mounted;
                   const connected = ready && account && chain;

                   return (
                     <div {...(!ready && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' } })}>
                       {(() => {
                         if (!connected) {
                           return (
                             <Button 
                               onClick={openConnectModal}
                               className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest h-9 px-5 shadow-lg shadow-indigo-500/20"
                             >
                               Init Session
                             </Button>
                           );
                         }

                         return (
                           <button 
                             onClick={openAccountModal}
                             className="bg-white/5 border border-white/10 hover:bg-white/10 px-4 h-9 rounded-xl flex items-center gap-2 transition-all"
                           >
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                             <span className="text-[10px] font-mono font-bold text-white/70">
                               {account.displayName}
                             </span>
                           </button>
                         );
                       })()}
                     </div>
                   );
                 }}
               </ConnectButton.Custom>
            </div>
            
            <Button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              variant="ghost"
              className="md:hidden p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* MOBILE OVERLAY */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden absolute left-6 right-6 mt-4 p-4 bg-[#12141B] border border-white/10 rounded-[32px] shadow-2xl space-y-3 z-50 overflow-hidden"
            >
              <MobileTab 
                isActive={currentPage === 'dashboard'} 
                onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
                label="Registry Terminal"
                icon={<Layers />}
              />
              <MobileTab 
                isActive={currentPage === 'portfolio'} 
                onClick={() => { onNavigate('portfolio'); setMobileMenuOpen(false); }}
                label="Shadow Portfolio"
                icon={<Activity />}
              />
              <div className="pt-4 border-t border-white/5 flex justify-center">
                <ConnectButton label="Authenticate" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

/* HELPER: Central Navigation Pill */
function NavPill({ label, icon, isActive, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-500 ${
        isActive ? 'text-white font-bold' : 'text-white/40 hover:text-white/60'
      }`}
    >
      <span className={`transition-transform duration-500 ${isActive ? 'scale-110 text-indigo-400' : ''}`}>
        {icon}
      </span>
      <span className="text-[10px] uppercase font-black tracking-[0.15em]">{label}</span>
    </button>
  );
}

/* HELPER: Mobile Navigation Row */
function MobileTab({ label, icon, isActive, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
        isActive ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-black/20 border-white/5 text-white/40'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={isActive ? 'text-indigo-400' : 'text-white/10'}>{icon}</div>
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      {isActive && <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />}
    </button>
  );
}

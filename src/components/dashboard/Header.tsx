"use client";
import { Shield, Activity, Menu, X, Layers, Globe, AlertTriangle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useSwitchChain, useBalance } from 'wagmi'

interface HeaderProps {
  currentPage: 'dashboard' | 'portfolio'
  onNavigate: (page: 'dashboard' | 'portfolio') => void
}

const navItems = [
  { label: 'Registry', value: 'dashboard' as const, icon: <Layers size={14} /> },
  { label: 'Portfolio', value: 'portfolio' as const, icon: <Activity size={14} /> },
];

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();

  const ARBITRUM_ID = 42161;
  const HORIZEN_ID = 26514;
  
  // USDC Addresses
  const ARB_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
  const HZ_USDC = (import.meta as any).env?.VITE_HORIZEN_USDC_ADDRESS;

  // Balances
  const { data: arbBal } = useBalance({ address, token: ARB_USDC as `0x${string}`, chainId: ARBITRUM_ID });
  const { data: hzBal } = useBalance({ address, token: HZ_USDC as `0x${string}`, chainId: HORIZEN_ID });

  // Network Helpers
  const isArbitrum = chain?.id === ARBITRUM_ID;
  const isHorizen = chain?.id === HORIZEN_ID;
  const isWrongNetwork = currentPage === 'portfolio' ? !isArbitrum : (!isArbitrum && !isHorizen);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-[100] px-4 py-4 pointer-events-none"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <div className="glass-card backdrop-blur-2xl border border-white/10 rounded-[24px] px-4 md:px-6 py-2.5 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          
          {/* 1. LOGO */}
          <div 
            className="flex items-center gap-3 cursor-pointer group flex-shrink-0" 
            onClick={() => onNavigate('dashboard')}
          >
          
            <div className=" sm:block">
              <h1 className="text-sm font-black tracking-widest text-white/90">NYRA</h1>
              <p className="text-[8px] text-purple-400 font-mono uppercase leading-none">Stealth_V2</p>
            </div>
          </div>

          {/* 2. CENTRAL NAV (Hidden on Mobile) */}
          <nav className="hidden md:flex items-center bg-black/40 border border-white/5 rounded-2xl p-1 relative mx-4">
            {navItems.map((item) => (
              <button
                key={item.value}
                onClick={() => onNavigate(item.value)}
                className={`relative z-10 flex items-center gap-2 px-5 py-2 rounded-xl transition-all duration-300 ${
                  currentPage === item.value ? 'text-white font-bold' : 'text-white/40 hover:text-white/60'
                }`}
              >
                <span className={currentPage === item.value ? 'text-purple-400' : ''}>{item.icon}</span>
                <span className="text-[10px] uppercase font-black tracking-widest">{item.label}</span>
              </button>
            ))}
            
            <motion.div 
              layoutId="nav-indicator"
              className="absolute bg-white/10 border border-white/10 rounded-xl z-0"
              initial={false}
              animate={{
                left: currentPage === 'dashboard' ? '4px' : '50%',
                width: 'calc(50% - 4px)',
                height: 'calc(100% - 8px)'
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          </nav>

          {/* 3. RIGHT AREA (Balances + Network + Wallet) */}
          <div className="flex items-center gap-2 md:gap-3">
            
            {/* Multi-Chain Balances (Hidden on small screens) */}
            {address && (
              <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-black/30 border border-white/5">
                <div className="text-right">
                  <p className="text-[8px] text-gray-500 font-bold uppercase leading-none">Arb</p>
                  <p className="text-[10px] text-white font-mono">${Number(arbBal?.formatted || 0).toFixed(2)}</p>
                </div>
                <div className="w-[1px] h-6 bg-white/10" />
                <div className="text-right">
                  <p className="text-[8px] text-gray-500 font-bold uppercase leading-none">HORIZEN</p>
                  <p className="text-[10px] text-white font-mono">${Number(hzBal?.formatted || 0).toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Network Badge */}
            <button 
              onClick={() => switchChain({ chainId: ARBITRUM_ID })}
              className={`hidden md:flex items-center gap-2 px-3 h-9 border rounded-xl transition-all ${
                isWrongNetwork 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                  : isHorizen 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : 'bg-white/5 border-white/5 text-white/40'
              }`}
            >
              {isWrongNetwork ? <AlertTriangle size={12} className="animate-pulse" /> : <Globe size={12} className={isArbitrum ? "text-purple-400" : "text-amber-400"} />}
              <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">
                {chain?.name || 'No Network'}
              </span>
              {isWrongNetwork && <span className="text-[8px] bg-red-500 text-white px-1 rounded">Switch</span>}
            </button>

            {/* Wallet Button */}
            <ConnectButton.Custom>
              {({ account, chain: wChain, openAccountModal, openConnectModal, mounted }) => {
                const connected = mounted && account && wChain;
                return (
                  <div className="flex items-center gap-2">
                    {!connected ? (
                      <button 
                        onClick={openConnectModal}
                        className="btn-purple px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest h-9 shadow-lg shadow-purple-500/20 text-white"
                      >
                        Init Session
                      </button>
                    ) : (
                      <button 
                        onClick={openAccountModal}
                        className="bg-white/5 border border-white/10 hover:bg-white/10 px-3 md:px-4 h-9 rounded-xl flex items-center gap-2 transition-all"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-mono font-bold text-white/70">
                          {account.displayName}
                        </span>
                      </button>
                    )}
                  </div>
                );
              }}
            </ConnectButton.Custom>

            {/* Mobile Burger */}
            <Button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              variant="ghost"
              className="md:hidden p-2 h-9 w-9 rounded-xl text-white/50 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        {/* MOBILE OVERLAY */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden absolute left-4 right-4 mt-3 p-4 glass-card border border-white/10 rounded-[24px] shadow-2xl space-y-3 z-50 overflow-hidden"
            >
              {/* Balances in Mobile Menu */}
              {address && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-gray-500 font-bold uppercase">Arbitrum</p>
                    <p className="text-sm text-white font-mono">${Number(arbBal?.formatted || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-gray-500 font-bold uppercase">Horizen</p>
                    <p className="text-sm text-white font-mono">${Number(hzBal?.formatted || 0).toFixed(2)}</p>
                  </div>
                </div>
              )}

              {navItems.map(item => (
                <button
                  key={item.value}
                  onClick={() => { onNavigate(item.value); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    currentPage === item.value 
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                      : 'bg-black/20 border-white/5 text-white/40'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={currentPage === item.value ? 'text-purple-400' : 'text-white/20'}>{item.icon}</span>
                    <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                  </div>
                  {currentPage === item.value && <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />}
                </button>
              ))}

              <div className="pt-4 border-t border-white/10 space-y-3">
                 {/* Mobile Network Switcher */}
                {isWrongNetwork && (
                  <button 
                    onClick={() => { switchChain({ chainId: ARBITRUM_ID }); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold"
                  >
                    <AlertTriangle size={14} /> Switch to {currentPage === 'portfolio' ? 'Arbitrum' : 'Correct Network'}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}

"use client";
import { Activity, Menu, X, Layers, Globe, AlertTriangle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useSwitchChain, useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import Horizen from '../../../public/horizen2.png';
import Arbitrum from '../../../public/arb.png';
import Nyralogo from '../../../public/Nyra.png';

interface HeaderProps {
  currentPage: 'dashboard' | 'portfolio'
  onNavigate: (page: 'dashboard' | 'portfolio') => void
}

const navItems = [
  { label: 'Registry', value: 'dashboard' as const, icon: <Layers size={14} /> },
  { label: 'Portfolio', value: 'portfolio' as const, icon: <Activity size={14} /> },
];

const ARBITRUM_ID = 42161;
const HORIZEN_ID = 26514;
// USDC on Arbitrum
const ARB_USDC = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as const;
// USDC.e on Horizen EON (if applicable — falls back to native)
const HORIZEN_USDC = (import.meta as any).env?.VITE_HORIZEN_USDC_ADDRESS as `0x${string}` | undefined;

// Wallet balance dropdown shown when user clicks their address
function WalletBalanceDropdown({
  account,
  arbUsdcBalance,
  arbEthBalance,
  horizenBalance,
  onOpenAccountModal,
}: {
  account: { displayName: string; address: string };
  arbUsdcBalance: string;
  arbEthBalance: string;
  horizenBalance: string;
  onOpenAccountModal: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-white text-sm font-medium hover:bg-white/8 transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
        <span className="text-gray-300 text-xs font-mono hidden sm:inline">{account.displayName}</span>
        <ChevronDown size={12} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute right-0 top-full mt-2 w-72 z-50 rounded-2xl overflow-hidden glass-card"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,85,247,0.12)' }}
            >
              {/* Address */}
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-[10px] text-gray-600 font-medium uppercase tracking-wider mb-1">Connected Wallet</p>
                <p className="font-mono text-xs text-gray-300 truncate">{account.address}</p>
              </div>

              {/* Balances */}
              <div className="px-4 py-3 space-y-2">
                <p className="text-[10px] text-gray-600 font-medium uppercase tracking-wider mb-2">Balances</p>

                {/* Arbitrum USDC */}
                <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white/3 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-indigo-400">ARB</span>
                    </div>
                    <span className="text-xs text-gray-400">USDC <span className="text-gray-700">Arbitrum</span></span>
                  </div>
                  <span className="text-xs font-semibold text-white tabular-nums">{arbUsdcBalance}</span>
                </div>

                {/* Arbitrum ETH */}
                <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white/3 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-indigo-400">Ξ</span>
                    </div>
                    <span className="text-xs text-gray-400">ETH <span className="text-gray-700">Arbitrum</span></span>
                  </div>
                  <span className="text-xs font-semibold text-white tabular-nums">{arbEthBalance}</span>
                </div>

                {/* Horizen balance */}
                <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-white/3 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-amber-400">HZ</span>
                    </div>
                    <span className="text-xs text-gray-400">USDC.e <span className="text-gray-700">Horizen</span></span>
                  </div>
                  <span className="text-xs font-semibold text-white tabular-nums">{horizenBalance}</span>
                </div>
              </div>

              {/* Manage button */}
              <div className="px-4 pb-3">
                <button
                  onClick={() => { setOpen(false); onOpenAccountModal(); }}
                  className="w-full py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/18 transition-all"
                >
                  Manage Wallet
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { chain, address } = useAccount();
  const { switchChain } = useSwitchChain();

  const isArbitrum = chain?.id === ARBITRUM_ID;
  const isHorizen = chain?.id === HORIZEN_ID;
  const isWrongNetwork = currentPage === 'portfolio' ? !isArbitrum : (!isArbitrum && !isHorizen);

  // Arbitrum USDC balance
  const { data: arbUsdc } = useBalance({
    address,
    chainId: ARBITRUM_ID,
    token: ARB_USDC,
  });

  // Arbitrum ETH balance
  const { data: arbEth } = useBalance({
    address,
    chainId: ARBITRUM_ID,
  });

  // Horizen native / USDC.e balance
  const { data: horizenBal } = useBalance({
    address,
    chainId: HORIZEN_ID,
    ...(HORIZEN_USDC ? { token: HORIZEN_USDC } : {}),
  });

  const fmtBalance = (data: typeof arbUsdc) => {
    if (!data) return '—';
    const num = Number(formatUnits(data.value, data.decimals));
    if (num === 0) return '0.00';
    if (num < 0.001) return '<0.001';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-[100] glass border-b border-white/5"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="max-w-[1400px] mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-2">

        {/* LOGO + NAV */}
        <motion.div
          className="flex items-center gap-4 md:gap-8 min-w-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
            onClick={() => onNavigate('dashboard')}
            whileHover={{ scale: 1.02 }}
          >
            <img src={Nyralogo} width={"50px"} height={"50px"} alt="nyra logo" />
            <span className="font-head font-extrabold text-[17px] tracking-[4px] uppercase">
              NYRA
            </span>
          </motion.div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item, index) => (
              <motion.button
                key={item.value}
                onClick={() => onNavigate(item.value)}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 ${currentPage === item.value ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                {currentPage === item.value && (
                  <motion.div
                    className="absolute inset-0 bg-white/8 rounded-full"
                    layoutId="activeNavBg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <span className="relative z-10">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* RIGHT SIDE */}
        <motion.div
          className="flex items-center gap-1.5 md:gap-2 flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          {/* Network badge — desktop only */}
          <motion.button
            onClick={() => switchChain({ chainId: ARBITRUM_ID })}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${isWrongNetwork
              ? 'bg-red-500/10 border-red-500/25 text-red-400'
              : isHorizen
                ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                : 'bg-white/5 border-white/8 text-gray-400 hover:text-white hover:bg-white/8'
              }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {isWrongNetwork
              ? <AlertTriangle size={12} className="animate-pulse" />
              : isArbitrum ? <img src={Arbitrum} width={'20px'} height={'20px'} alt="Arbitrum Network" /> : <img className='rounded-full' src={Horizen} width={'20px'} height={'20px'} alt="Horizen Network" />
            }
            <span className="text-xs font-semibold">{chain?.name || 'No Network'}</span>
            {isWrongNetwork && <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full ml-1">Switch</span>}
          </motion.button>

          {/* Wallet — custom dropdown with balances */}
          <ConnectButton.Custom>
            {({ account, chain: wChain, openAccountModal, openConnectModal, mounted }) => {
              const ready = mounted;
              const connected = ready && account && wChain;
              return (
                <div {...(!ready && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' } })}>
                  {!connected ? (
                    <motion.button
                      onClick={openConnectModal}
                      className="btn-purple px-3 md:px-4 py-1.5 md:py-2 rounded-full text-white text-xs md:text-sm font-semibold"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Connect
                    </motion.button>
                  ) : (
                    <WalletBalanceDropdown
                      account={account as { displayName: string; address: string }}
                      arbUsdcBalance={fmtBalance(arbUsdc)}
                      arbEthBalance={fmtBalance(arbEth)}
                      horizenBalance={fmtBalance(horizenBal)}
                      onOpenAccountModal={openAccountModal}
                    />
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>

          {/* Mobile burger */}
          <Button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            variant="ghost"
            className="md:hidden p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </motion.div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="md:hidden border-t border-white/5 px-4 py-4 space-y-2"
          >
            {/* Network on mobile */}
            <button
              onClick={() => switchChain({ chainId: ARBITRUM_ID })}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium transition-all ${isWrongNetwork
                ? 'bg-red-500/10 border-red-500/25 text-red-400'
                : 'bg-white/3 border-white/8 text-gray-400'
                }`}
            >
              <Globe size={14} className={isArbitrum ? 'text-purple-400' : isHorizen ? 'text-amber-400' : 'text-gray-600'} />
              {chain?.name || 'No Network'}
              {isWrongNetwork && <span className="ml-auto text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">Switch</span>}
            </button>

            {navItems.map(item => (
              <button
                key={item.value}
                onClick={() => { onNavigate(item.value); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium transition-all ${currentPage === item.value
                  ? 'bg-purple-500/10 border-purple-500/25 text-purple-300'
                  : 'bg-white/3 border-white/8 text-gray-400'
                  }`}
              >
                <span className={currentPage === item.value ? 'text-purple-400' : 'text-gray-600'}>{item.icon}</span>
                {item.label}
              </button>
            ))}
            <div className="pt-2 border-t border-white/5 flex justify-center">
              <ConnectButton label="Connect" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

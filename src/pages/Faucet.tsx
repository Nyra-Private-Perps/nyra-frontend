"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useAccount, useSwitchChain } from "wagmi";
import Confetti from 'react-confetti';
import {
  Globe, Activity, Droplets, Copy, Loader, PartyPopper, Shield,
  Check, Info, Hash, ArrowRight, ExternalLink, Cpu, Terminal
} from "lucide-react";
import { contractService } from "../services/contractService";
import { Link } from "react-router-dom";
import { Header } from "../components/Header/Header";

// --- STYLES & CONSTANTS ---
const glassPanel = "bg-white/65 backdrop-blur-xl border border-white/80 shadow-[0_4px_30px_rgba(0,0,0,0.05)]";

// --- ANIMATED BACKGROUND COMPONENTS ---
const GatewayBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-[#f0f4f8]">
    {/* Tech Grid Pattern */}
    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.05)_1px,transparent_0)] bg-[size:24px_24px]" />
    <div 
      className="absolute inset-0 opacity-10" 
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40' fill='%232563eb' fill-opacity='0.2'/%3E%3C/svg%3E")` }} 
    />

    {/* Dynamic Blobs */}
    <motion.div 
      animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }} 
      transition={{ duration: 8, repeat: Infinity }}
      className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-blue-200/40 rounded-full blur-[120px]" 
    />
    <motion.div 
      animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }} 
      transition={{ duration: 10, repeat: Infinity, delay: 1 }}
      className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-200/40 rounded-full blur-[120px]" 
    />

    {/* Side Data Streams */}
    <div className="absolute right-10 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-blue-300/20 to-transparent hidden lg:block">
      <motion.div 
        animate={{ y: ["-100%", "500%"] }} 
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="h-40 w-full bg-gradient-to-b from-transparent via-blue-500/50 to-transparent blur-sm" 
      />
    </div>
  </div>
);

// --- MODALS ---
const MintingProgressModal = ({ step }: { step: number }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white/90 backdrop-blur-3xl border border-white rounded-[2.5rem] p-10 shadow-2xl w-full max-w-sm text-center"
  >
    <div className="relative size-32 mx-auto mb-8">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-4 border-blue-100 border-t-blue-600 rounded-full" />
      <div className="absolute inset-0 flex items-center justify-center text-blue-600">
        <Cpu size={40} className="animate-pulse" />
      </div>
    </div>
    <h2 className="text-2xl font-bold text-slate-900 mb-2">Protocol Action</h2>
    <p className="text-slate-500 text-sm mb-8">Step {step}: {step === 1 ? "Authorizing Security Tunnel" : "Dispensing NYRA Tokens"}</p>
    <div className="flex justify-center gap-2">
      {[1, 2].map((i) => (
        <div key={i} className={`h-1.5 w-12 rounded-full transition-colors duration-500 ${step >= i ? "bg-blue-600" : "bg-slate-100"}`} />
      ))}
    </div>
  </motion.div>
);

const SuccessModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/90 backdrop-blur-3xl border border-white rounded-[3rem] p-10 text-center shadow-2xl w-full max-w-sm"
  >
    <div className="size-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
      <PartyPopper size={36} />
    </div>
    <h2 className="text-3xl font-bold text-slate-950 mb-4 tracking-tight">Mint Complete</h2>
    <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">1,000 $NYRA tokens successfully dispensed to your vault identity.</p>
    <div className="space-y-3">
      <Link to="/vaults" className="block w-full bg-slate-950 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-black transition-all">Enter Vaults</Link>
      <button onClick={onClose} className="w-full text-slate-400 font-bold py-3 hover:text-slate-600 transition-colors uppercase tracking-widest text-xs">Close Gateway</button>
    </div>
  </motion.div>
);

export default function FaucetPage() {
  const { address, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();
  const [isMinting, setIsMinting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mintStep, setMintStep] = useState(1);

  useEffect(() => {
    const handleMintConfirmed = () => {
      setMintStep(2);
      setTimeout(() => { setIsMinting(false); setIsSuccess(true); setMintStep(1); }, 3000);
    };
    contractService.on("mintConfirmed", handleMintConfirmed);
    return () => { contractService.off("mintConfirmed", handleMintConfirmed); };
  }, []);

  const handleMint = async () => {
    setIsMinting(true); setMintStep(1);
    try { await contractService.mintToken(); } catch (error) { setIsMinting(false); setMintStep(1); }
  };

  return (
    <div className="min-h-screen relative font-sans text-slate-800 selection:bg-blue-100">
      <GatewayBackground />
      <Header />

      {isSuccess && <Confetti recycle={false} numberOfPieces={300} colors={['#2563eb', '#06b6d4', '#10b981']} />}

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 pt-32">
        {/* Hero Title Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em]">
            <Shield size={12} /> Restricted Access // Testnet Environment
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-slate-900 leading-none">
            Initialize <span className="text-blue-600">Protocol</span>
          </h1>
        </motion.div>

        <div className="relative w-full max-w-6xl h-[600px] flex items-center justify-center">
          {/* Corner Floating Panels (Desktop Only) */}
          <div className="hidden lg:block">
            {/* Top Left: Network */}
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className={`absolute top-10 left-0 w-64 p-6 rounded-3xl border-l-4 border-l-blue-600 ${glassPanel}`}>
               <div className="absolute top-4 right-4 text-slate-100 opacity-20"><Globe size={64} /></div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Network Identity</p>
               <h3 className="text-xl font-bold text-slate-800">Horizen Gobi</h3>
               <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <span className="size-1.5 rounded-full bg-emerald-500" /> Active System
               </div>
            </motion.div>

            {/* Top Right: Chain ID */}
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className={`absolute top-10 right-0 w-48 p-6 rounded-3xl border-r-4 border-r-cyan-400 text-right ${glassPanel}`}>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Chain Designation</p>
               <h3 className="text-4xl font-black font-mono text-slate-800">1663</h3>
            </motion.div>

            {/* Bottom Left: RPC */}
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={`absolute bottom-10 left-0 flex items-center gap-3 p-4 rounded-2xl cursor-pointer hover:scale-105 transition-transform ${glassPanel}`}>
               <Terminal size={18} className="text-slate-400" />
               <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Secure RPC Tunnel</p>
                  <p className="text-xs font-mono font-bold text-blue-600">gobi-testnet.horizenlabs.io</p>
               </div>
               <Copy size={14} className="text-slate-300 ml-4" />
            </motion.div>

            {/* Bottom Right: Explorer */}
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className={`absolute bottom-10 right-0 flex items-center gap-3 p-4 rounded-2xl hover:text-blue-600 transition-colors cursor-pointer group ${glassPanel}`}>
               <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Block Explorer</p>
                  <p className="text-xs font-bold text-slate-700 group-hover:text-blue-600">View on Horizen Scan</p>
               </div>
               <ArrowRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </motion.div>
          </div>

          {/* Central Core Mint Button */}
          <div className="relative group">
            {/* Spinning Orbits */}
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute -inset-20 rounded-full border border-dashed border-slate-300 opacity-60" />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 35, repeat: Infinity, ease: "linear" }} className="absolute -inset-32 rounded-full border border-dotted border-slate-300 opacity-40" />
            
            {/* Glow Aura */}
            <motion.div 
              animate={{ opacity: [0.1, 0.25, 0.1], scale: [1, 1.2, 1] }} 
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -inset-10 bg-blue-500 rounded-full blur-[60px]" 
            />

            <button 
              onClick={handleMint}
              disabled={!isConnected || isMinting}
              className="relative size-72 rounded-full bg-white shadow-[0_20px_60px_rgba(37,99,235,0.15)] border border-white flex flex-col items-center justify-center transition-all duration-700 hover:scale-105 active:scale-95 disabled:opacity-50 overflow-hidden"
            >
              {/* SVG Progress Circle (On Hover effect) */}
              <svg className="absolute inset-0 size-full -rotate-90 pointer-events-none p-2" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                <motion.circle 
                  cx="50" cy="50" r="48" 
                  fill="none" stroke="#2563eb" strokeWidth="1.5" 
                  strokeDasharray="301.6" 
                  initial={{ strokeDashoffset: 301.6 }}
                  whileHover={{ strokeDashoffset: 0 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>

              <div className="relative z-10 flex flex-col items-center">
                 <div className="size-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 group-hover:rotate-[360deg]">
                    <Droplets size={32} />
                 </div>
                 <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-blue-600 transition-colors">Initiate Mint</span>
                 <h4 className="text-4xl font-black text-slate-900 tracking-tighter mt-1">1,000 $NYRA</h4>
                 <span className="text-[10px] font-bold text-slate-400 mt-2">Testnet Liquidity</span>
              </div>
            </button>

            {/* Ready Status Label */}
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
               <div className="h-10 w-[1px] bg-gradient-to-b from-slate-300 to-transparent" />
               <div className="px-5 py-2 rounded-full bg-white/50 backdrop-blur-md border border-white shadow-sm text-sm font-bold text-slate-500">
                  Ready to Dispense
               </div>
            </motion.div>
          </div>
        </div>

        {/* Footer Protocol Note */}
        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          className="mt-24 w-full max-w-2xl px-4"
        >
          <div className={`${glassPanel} p-8 rounded-[2rem] flex items-start gap-6`}>
             <div className="size-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Info size={24} />
             </div>
             <div>
                <h5 className="font-bold text-slate-900 uppercase tracking-wide text-sm mb-2">Protocol Transparency Note</h5>
                <p className="text-slate-600 text-sm leading-relaxed">
                   You are accessing the <span className="font-black text-blue-600">Nyra Institutional Privacy Aggregator</span> testnet gateway. 
                   Tokens dispensed here are cryptographic simulation assets with no extrinsic financial value. 
                   Interaction requires valid Horizen Gobi network configurations.
                </p>
             </div>
          </div>
        </motion.div>
      </main>

      <AnimatePresence>
        {isMinting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/10 backdrop-blur-xl p-4">
            <MintingProgressModal step={mintStep} />
          </div>
        )}
        {isSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/10 backdrop-blur-xl p-4">
            <SuccessModal onClose={() => setIsSuccess(false)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
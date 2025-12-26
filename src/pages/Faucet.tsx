import { useState, useEffect } from "react";
import { Header } from "../components/Header/Header";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useAccount, useSwitchChain } from "wagmi";
import { horizenGobi } from "../lib/chains"; 
import Confetti from 'react-confetti';
import {
  ArrowRight, Wallet, Globe, Activity, Droplets, Copy, Loader, PartyPopper, Shield,
  Check, AlertCircle, Info, Hash, Network, FileCode,
  Layers
} from "lucide-react";
import { contractService } from "../services/contractService";
import { Link } from "react-router-dom";

// --- 1. THE ELITE LIGHT BACKGROUND ---
const ApexBackground = () => (
  <>
    <div 
      className="fixed inset-0 -z-20"
      style={{
        backgroundColor: '#F8F7FF',
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
          radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.12) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.08) 0px, transparent 50%)
        `,
        backgroundAttachment: 'fixed'
      }}
    />
    <div className="fixed inset-0 -z-15 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <motion.div animate={{ x: [0, 30, 0], y: [0, -30, 0] }} transition={{ duration: 15, repeat: Infinity }} className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-200 rounded-full blur-[100px] opacity-60" />
      <motion.div animate={{ x: [0, -30, 0], y: [0, 30, 0] }} transition={{ duration: 18, repeat: Infinity, delay: 2 }} className="absolute top-[10%] right-[10%] w-[450px] h-[450px] bg-blue-200 rounded-full blur-[100px] opacity-60" />
    </div>
  </>
);

// --- Animation Variants ---
const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" },
  visible: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" }
};

// --- ELITE LIGHT THEME MODALS ---
const MintingProgressModal = ({ step }: { step: number }) => {
  const steps = ["Approve mint function", "Minting your tokens"];
  return (
    <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white/90 backdrop-blur-3xl border border-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl relative overflow-hidden">
       <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-100/50 blur-[80px] rounded-full pointer-events-none" />
       {/* 3D Energy Swirl Animation */}
       <div className="relative h-40 flex items-center justify-center mb-10">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute w-40 h-40 border border-indigo-100 border-dashed rounded-full" />
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity }} className="w-20 h-20 bg-white border border-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-100">
            <Activity size={32} />
          </motion.div>
       </div>
       <h2 className="text-2xl font-bold text-center mb-10 text-gray-900 tracking-tight leading-none">Processing Mint</h2>
       <div className="space-y-5 px-2">
          {steps.map((label, i) => {
            const isDone = step > i + 1;
            const isCur = step === i + 1;
            return (
              <div key={i} className={`flex items-center gap-4 transition-all ${isCur || isDone ? "opacity-100" : "opacity-40"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${isDone ? "bg-emerald-500 border-emerald-500" : isCur ? "border-indigo-600" : "border-slate-200"}`}>
                  {isDone ? <Check size={14} className="text-white" strokeWidth={4} /> : isCur ? <Loader size={14} className="animate-spin text-indigo-600" /> : null}
                </div>
                <span className={`text-sm font-bold tracking-tight ${isCur || isDone ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
              </div>
            );
          })}
       </div>
    </motion.div>
  );
};

const SuccessModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white/90 backdrop-blur-3xl border border-white rounded-[3rem] w-full max-w-sm p-10 text-center shadow-2xl relative overflow-hidden">
    <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 blur-[80px] rounded-full pointer-events-none" />
    <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="w-20 h-20 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
        <PartyPopper size={32} />
    </motion.div>
    <h2 className="text-3xl font-bold text-gray-950 mb-3 tracking-tighter leading-none">Successful!</h2>
    <p className="text-gray-500 text-sm mb-10 px-2 font-medium">1,000 $NYRA tokens have been deployed to your secure wallet address.</p>
    <div className="flex flex-col gap-3">
        <Link to="/vaults" className="w-full bg-gray-950 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95">Go to Vaults</Link>
        <button onClick={onClose} className="w-full text-gray-400 font-bold py-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all text-xs uppercase tracking-widest">Close</button>
    </div>
  </motion.div>
);

// --- UI Components ---
const DetailCard = ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
  <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-white flex items-center gap-5 hover:border-indigo-100 hover:shadow-lg transition-all group">
    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-indigo-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-600 transition-colors">{title}</p>
      <span className="font-bold text-xl text-slate-800 tracking-tight">{value}</span>
    </div>
  </div>
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
  
    const handleMint = async() => {
      setIsMinting(true); setMintStep(1); 
      try { await contractService.mintToken(); } catch (error) { setIsMinting(false); setMintStep(1); }
    };
  
    return (
      <div className="min-h-screen relative overflow-x-hidden font-sans text-slate-800 selection:bg-indigo-100">
        <ApexBackground />
        <Header />

        {isSuccess && <Confetti recycle={false} numberOfPieces={400} colors={['#6366f1', '#a855f7', '#10B981']} />}
        
        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-32">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-4 space-y-8">
              <section className="bg-white/70 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white shadow-xl">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 border border-blue-100"><Globe size={24} /></div>
                  <h2 className="font-bold text-2xl text-slate-900 mb-2 tracking-tight">Horizen Testnet</h2>
                  <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">Connect to the Horizen Gobi Testnet to interact with the protocol.</p>
                  <button onClick={() => switchChain({ chainId: horizenGobi.id })} className="w-full bg-slate-950 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg active:scale-95">
                    <Wallet size={18} /> Switch Network
                  </button>
              </section>

              <section className="bg-white/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-lg">
                <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2"><Info size={18} className="text-blue-500" /> Network Info</h3>
                <div className="space-y-5">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block pl-1">Chain Identity</label>
                      <div className="bg-white/80 border border-indigo-50 p-4 rounded-xl flex items-center gap-3 border-l-4 border-l-purple-500 shadow-inner">
                        <Hash size={16} className="text-purple-300" />
                        <span className="font-mono text-lg font-black text-slate-700">2651420</span>
                      </div>
                    </div>
                </div>
              </section>
            </div>
  
            {/* RIGHT COLUMN */}
            <div className="lg:col-span-8 space-y-10">
              <section className="bg-white/80 backdrop-blur-3xl p-10 lg:p-12 rounded-[3rem] border border-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05] bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400" />
                <div className="relative z-10">
                  <h1 className="font-bold text-5xl md:text-6xl mb-4 text-slate-950 tracking-tighter leading-none">
                      Token <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 pr-2">Faucet</span>
                  </h1>
                  <p className="text-slate-500 text-lg mb-10 max-w-2xl leading-relaxed font-medium">Mint <span className="text-indigo-600 font-black">1,000 $NYRA</span> testnet tokens. Experience the future of institutional privacy aggregation.</p>

                  <div className="bg-indigo-50/40 border border-indigo-100 p-2 rounded-[2rem] flex items-center mb-10 shadow-inner">
                    <div className="flex-grow px-6 py-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Receiver Address</label>
                      <input className="w-full bg-transparent border-none p-0 text-slate-800 font-mono text-base focus:ring-0 font-bold" readOnly type="text" value={address || "Connect wallet to view"} />
                    </div>
                    {isConnected && <div className="px-4 py-2 mr-2 bg-white text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-indigo-50 shadow-sm flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected</div>}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <button onClick={handleMint} disabled={!isConnected || isMinting} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-5 px-12 rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-50">
                      Mint 1,000 NYRA <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" /> Cooldown: <span className="text-slate-900 font-mono">24 Hours</span>
                    </div>
                  </div>
                </div>
              </section>
              
              <section>
                  <div className="flex items-center gap-4 mb-10 pl-2">
                    <h3 className="font-black text-[10px] text-slate-400 tracking-[0.3em] uppercase whitespace-nowrap">Asset Specifications</h3>
                    <div className="h-px flex-grow bg-indigo-50" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <DetailCard title="Native Token" value="$NYRA" icon={<Droplets size={24} />} />
                      <DetailCard title="Network Tier" value="Testnet" icon={<Network size={24} />} />
                      <DetailCard title="Settlement" value="Base Sepolia" icon={<Layers size={24} />} />
                      <DetailCard title="Token Standard" value="ERC-20" icon={<FileCode size={24} />} />
                  </div>
              </section>
            </div>
          </motion.div>
        </main>
        
        <AnimatePresence>
          {isMinting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center bg-indigo-950/10 backdrop-blur-xl p-4">
              <MintingProgressModal step={mintStep} />
            </motion.div>
          )}
          {isSuccess && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center bg-indigo-950/10 backdrop-blur-xl p-4">
              <SuccessModal onClose={() => setIsSuccess(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
}
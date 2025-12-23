import { useState, useEffect } from "react";
import { Header } from "../components/Header/Header";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useAccount, useSwitchChain } from "wagmi";
import { horizenGobi } from "../lib/chains"; 
import Confetti from 'react-confetti';
import {
  ArrowRight, Wallet, Globe, Activity, Droplets, Copy, Loader, PartyPopper, Shield,
  Check, AlertCircle
} from "lucide-react";
import { contractService } from "../services/contractService";
import { Link } from "react-router-dom";
import { AnimatedGradientBackground } from "../components/UI/AnimatedBackgroud"; // Ensure this exists from previous steps

// --- Animation Variants ---
const containerVariants: Variants = { 
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = { 
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", duration: 0.5 } },
  exit: { opacity: 0, scale: 0.95, y: 20 }
};

// --- Reusable Helper Components (Dark Mode) ---
const DetailCard = ({ title, value, imgSrc, icon }: { 
    title: string; 
    value: string; 
    imgSrc?: string; 
    icon?: React.ReactNode; 
  }) => (
    <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex items-center gap-4 hover:border-blue-500/30 transition-colors group">
      <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
        {imgSrc ? (
          <img src={imgSrc} alt={`${title} icon`} className="w-6 h-6 object-contain" />
        ) : (
          <div className="text-blue-400">{icon}</div>
        )}
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">{title}</p>
        <span className="font-semibold text-base text-white">{value}</span>
      </div>
    </div>
  );

const LinkButton = ({ text, icon, href, isExternal }: { text: string; icon: React.ReactNode; href: string; isExternal?: boolean }) => (
    <a 
      href={href} 
      target={isExternal ? "_blank" : "_self"} 
      rel={isExternal ? "noopener noreferrer" : ""} 
      className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white hover:border-white/20 group"
    >
      <div className="flex items-center gap-3">
        <div className="text-gray-400 group-hover:text-blue-400 transition-colors">{icon}</div>
        <span className="font-medium">{text}</span>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
    </a>
  );

// --- Styled Minting Modal (Dark) ---
const MintingProgressModal = ({ step }: { step: number }) => { 
    // Dark Theme Colors
    const TEXT_COLOR = "#FFFFFF";
    const DIM_TEXT_COLOR = "#6B7280";
    
    const stepsLabels = ["Approve mint function", "Minting your tokens"];
  
    return (
      <motion.div 
        variants={modalVariants} 
        initial="hidden" animate="visible" exit="exit"
        className="rounded-[24px] w-full max-w-md p-8 shadow-2xl relative overflow-hidden"
        style={{ 
          background: "rgba(10, 10, 15, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(20px)"
        }} 
      >
        {/* Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-[50px] pointer-events-none" />

        {/* --- Central Animation --- */}
        <div className="relative h-40 w-full flex items-center justify-center mb-8"> 
          {/* Rotating Rings */}
          <motion.div
            className="absolute inset-0 rounded-full border border-blue-500/20"
            style={{ width: 140, height: 140, margin: 'auto' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-dashed border-white/10"
            style={{ width: 110, height: 110, margin: 'auto' }}
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Shield Icon */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-b from-gray-800 to-gray-900 border border-white/10 shadow-lg shadow-blue-500/10"
          >
            <Shield className="w-8 h-8 text-blue-400" /> 
          </motion.div>
        </div>

        <h2 className="text-xl font-bold text-center mb-8 text-white">Minting in Progress</h2> 
        
        <div className="space-y-5"> 
          {stepsLabels.map((label, index) => {
            const stepNumber = index + 1;
            const isCompleted = step > stepNumber;
            const isCurrent = step === stepNumber;
            
            return (
              <div key={index} className="flex items-center gap-4 text-sm"> 
                <div className={`flex items-center justify-center w-6 h-6 rounded-full border transition-colors ${
                    isCompleted ? "bg-emerald-500 border-emerald-500" : 
                    isCurrent ? "border-blue-500 text-blue-500" : "border-gray-700 bg-gray-800/50"
                }`}> 
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 text-white" /> 
                  ) : isCurrent ? (
                      <Loader className="w-3.5 h-3.5 animate-spin" /> 
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600" /> 
                  )}
                </div>
                <span className={`font-medium transition-colors ${isCurrent || isCompleted ? TEXT_COLOR : DIM_TEXT_COLOR}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };
  
  // --- Success Modal (Dark) ---
  const SuccessModal = ({ onClose }: { onClose: () => void }) => {
    return (
      <motion.div 
        variants={modalVariants} initial="hidden" animate="visible" exit="exit"
        className="rounded-[24px] w-full max-w-sm p-8 text-center shadow-2xl relative overflow-hidden bg-[#0A0A0F] border border-white/10 backdrop-blur-xl"
      >
        <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
        
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <PartyPopper className="w-8 h-8 text-emerald-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Mint Successful!</h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          1,000 Testnet NYRA tokens have been sent to your wallet. You are ready to trade.
        </p>

       <div className="flex flex-col gap-3">
        <Link to={'/vaults'} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20">
          Go to Vaults
        </Link>
        <button onClick={onClose} className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl transition-colors border border-white/5">
          Close
        </button>
        </div>
      </motion.div>
    );
  };
  

export default function FaucetPage() {
    const { address, isConnected } = useAccount();
    const { switchChain } = useSwitchChain();
    const [isMinting, setIsMinting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [mintStep, setMintStep] = useState(1); 

    useEffect(() => {
      const handleMintConfirmed = (txHash: string) => {
          console.log("Mint transaction confirmed:", txHash);
          setMintStep(2); 
          setTimeout(() => {
            setIsMinting(false);
            setIsSuccess(true);
            setMintStep(1); 
          }, 3000); 
      };
      
      contractService.on("mintConfirmed", handleMintConfirmed);
      
      return () => {
        contractService.off("mintConfirmed", handleMintConfirmed);
      };
    }, []);
  
    const handleAddNetwork = () => {
      switchChain({ chainId: horizenGobi.id });
    };
  
    const handleMint = async() => {
      setIsMinting(true);
      setMintStep(1); 
      try {
        await contractService.mintToken();
      } catch (error) {
        console.error("Minting failed:", error);
        setIsMinting(false); 
        setMintStep(1); 
      }
    };
    
    const handleCloseSuccess = () => {
      setIsSuccess(false);
    };
  
    return (
      <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 relative overflow-hidden font-sans">
        
        {/* Animated Background */}
        <div className="fixed inset-0 z-0">
             <AnimatedGradientBackground />
        </div>

        {isSuccess && <Confetti recycle={false} numberOfPieces={400} colors={['#3B82F6', '#10B981', '#F59E0B']} />}
        
        <div className="relative z-10">
          <Header />
          
          <main className="py-20 px-6">
            <motion.div 
                variants={containerVariants} 
                initial="hidden" 
                animate="visible" 
                className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
            >
              
              {/* --- Left Column (Network & Details) --- */}
              <div className="lg:col-span-1 space-y-8">
                {/* Network Card */}
                <motion.div variants={itemVariants} className="bg-gray-900/40 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                  <div className="inline-block p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-6">
                    <Globe className="w-6 h-6 text-blue-400" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{horizenGobi.name}</h1>
                  <p className="text-gray-400 text-sm mb-6">Connect to the Horizen Gobi Testnet to interact with the protocol.</p>
                  
                  <button 
                    onClick={handleAddNetwork} 
                    className="w-full bg-white text-black font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-lg"
                  >
                    <Wallet size={18} /> Switch Network
                  </button>
                  
                  <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                    <LinkButton text="Block Explorer" icon={<Activity size={18} />} href={horizenGobi.blockExplorers.default.url} isExternal />
                  </div>
                </motion.div>

                {/* Info Card */}
                <motion.div variants={itemVariants} className="bg-gray-900/40 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                     <AlertCircle className="w-5 h-5 text-gray-400" /> Network Info
                  </h3>
                  <div className="space-y-4">
                      <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                          <p className="text-xs text-gray-500 font-bold uppercase mb-1">RPC URL</p>
                          <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-mono text-blue-300 truncate">https://horizen-testnet.rpc...</span>
                              <Copy className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer transition-colors" />
                          </div>
                      </div>
                      <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Chain ID</p>
                          <span className="text-sm font-mono text-white">2651420</span>
                      </div>
                  </div>
                </motion.div>
              </div>
    
              {/* --- Right Column (Faucet & Token Info) --- */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Main Faucet Card */}
                <motion.div variants={itemVariants} className="bg-gradient-to-b from-gray-900/60 to-black/60 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
                  
                  <div className="relative z-10">
                    <h2 className="text-4xl font-bold text-white mb-2">Token Faucet</h2>
                    <p className="text-gray-400 mb-8">Mint 1,000 $NYRA testnet tokens to start testing strategies.</p>

                    {isConnected && address ? (
                      <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-grow bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-sm font-mono text-gray-300 flex items-center justify-between">
                            <span className="truncate">{address}</span>
                            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded ml-2 whitespace-nowrap border border-emerald-500/20">Connected</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <button 
                                onClick={handleMint} 
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                            >
                                Mint 1,000 NYRA
                            </button>
                            <p className="text-sm text-gray-500">
                                Cooldown: <span className="text-gray-300">24 Hours</span>
                            </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-6 text-center">
                        <Wallet className="w-10 h-10 text-yellow-500/50 mx-auto mb-4" />
                        <h3 className="text-white font-semibold mb-2">Wallet Not Connected</h3>
                        <p className="text-sm text-gray-500 mb-6">Please connect your wallet to mint testnet tokens.</p>
                        <button disabled className="bg-white/5 text-gray-500 font-semibold py-3 px-8 rounded-xl cursor-not-allowed border border-white/5">
                          Connect Wallet
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
                
                {/* Details Grid */}
                <motion.div variants={itemVariants}>
                    <h3 className="text-xl font-bold text-white mb-6">Token Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailCard title="Native Token" value="$NYRA" icon={<Droplets size={20} />} />
                        <DetailCard title="Network Type" value="Testnet" icon={<Activity size={20} />} />
                        <DetailCard title="Settlement" value="Base Sepolia" icon={<Globe size={20} />} />
                        <DetailCard title="Standard" value="ERC-20" icon={<Copy size={20} />} />
                    </div>
                </motion.div>

              </div>
            </motion.div>
          </main>
        </div>
        
        {/* Modal Backdrop & Container */}
        <AnimatePresence>
          {(isMinting || isSuccess) && (
            <motion.div 
                key="backdrop" 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              {isMinting && <MintingProgressModal step={mintStep} />}
              {isSuccess && <SuccessModal onClose={handleCloseSuccess} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

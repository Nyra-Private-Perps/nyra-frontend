"use client"
import { useState, useEffect } from "react";
import { Header } from "@/components/Header/Header";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useAccount, useSwitchChain } from "wagmi";
import { horizenGobi } from "@/lib/chains"; // Import our new chain config
import Confetti from 'react-confetti';
import {
  ArrowRight, Wallet, Globe, Activity, Droplets, Copy, CheckCircle2, Loader, PartyPopper
} from "lucide-react";
import { contractService } from "@/services/contractService";
import Link from "next/link";

// --- Animation Variants ---
const containerVariants: Variants = { /* ... same as before ... */ };
const itemVariants: Variants = { /* ... same as before ... */ };
const backdropVariants: Variants = { visible: { opacity: 1 }, hidden: { opacity: 0 } };
const modalVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

// --- Reusable Helper Components for this page ---
const DetailCard = ({ title, value, imgSrc, icon }: { 
    title: string; 
    value: string; 
    imgSrc?: string; // Optional image URL
    icon?: React.ReactNode; // Optional React icon
  }) => (
    <div className="bg-white p-4 rounded-lg border border-[var(--border)]">
      <p className="text-xs text-[var(--foreground-secondary)] mb-1">{title}</p>
      <div className="flex items-center gap-2">
        {/* 
          This is the corrected conditional logic:
          - If 'imgSrc' exists (is "truthy"), render the Next.js Image component.
          - Otherwise, render the 'icon' React component.
        */}
        {imgSrc ? (
          <img src={imgSrc} alt={`${title} icon`} width={16} height={16} />
        ) : (
          icon 
        )}
        <span className="font-semibold text-sm text-[var(--foreground)]">{value}</span>
      </div>
    </div>
  );

const LinkButton = ({ text, icon, href, isExternal }: { text: string; icon: React.ReactNode; href: string; isExternal?: boolean }) => (
    <a href={href} target={isExternal ? "_blank" : "_self"} rel={isExternal ? "noopener noreferrer" : ""} className="w-full flex items-center justify-between text-left p-4 bg-white hover:bg-[var(--secondary)] rounded-lg border border-[var(--border)] transition-colors">
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-semibold text-[var(--foreground)]">{text}</span>
      </div>
      <ArrowRight className="w-5 h-5 text-[var(--foreground-secondary)]" />
    </a>
  );
  const MintingProgressModal = () => {
    const [step, setStep] = useState(1);
  
    useEffect(() => {
        const handleFeeTransactionConfirmed = (txHash: string) => {
            console.log("mint confirmed:", txHash);
            setStep(2)
          };
        
          contractService.on("mintConfirmed", handleFeeTransactionConfirmed);
        
          return () => {
            contractService.off("mintConfirmed", handleFeeTransactionConfirmed);
          };
    //   const timer = setTimeout(() => setStep(2), 2500); // Move to step 2 after 2.5s
    //   return () => clearTimeout(timer);
    }, []);
  
    return (
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="hidden" className="bg-[var(--secondary)] border border-[var(--border)] rounded-lg w-full max-w-sm p-8 text-[var(--foreground)] shadow-[var(--shadow-card)]">
        <h2 className="text-xl font-semibold text-center text-[var(--foreground)] mb-6">Minting Your Tokens...</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {step === 1 ? <Loader className="w-5 h-5 text-[var(--primary)] animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-green-600" />}
            <span className={`transition-colors ${step > 1 ? 'text-[var(--foreground-secondary)]' : 'text-[var(--foreground)]'}`}>Approve mint function</span>
          </div>
          <div className="flex items-center gap-4">
            {step === 2 && <Loader className="w-5 h-5 text-[var(--primary)] animate-spin" />}
            {step < 2 && <div className="w-5 h-5" />}
            <span className={`transition-colors ${step < 2 ? 'text-[var(--foreground-secondary)]' : 'text-[var(--foreground)]'}`}>Minting your tokens</span>
          </div>
        </div>
      </motion.div>
    );
  };
  
  // Modal for celebrating a successful mint
  const SuccessModal = ({ onClose }: { onClose: () => void }) => {
    return (
      <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="hidden" className="bg-[var(--secondary)] border border-[var(--border)] rounded-lg w-full max-w-sm p-8 text-center text-[var(--foreground)] shadow-[var(--shadow-card)]">
        <PartyPopper className="w-16 h-16 mx-auto text-yellow-500" />
        <h2 className="text-2xl font-semibold text-[var(--foreground)] mt-4">Mint Successful!</h2>
        <p className="text-[var(--foreground-secondary)] mt-2">1,000 Testnet NYRA tokens have been sent to your wallet.</p>
        <Link href={'/vaults'} className="w-full mt-6 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity">
          Go to Vaults!
        </Link>
        <button onClick={onClose} className="w-full mt-6 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity">
          Awesome
        </button>
      </motion.div>
    );
  };
  

export default function FaucetPage() {
    const { address, isConnected } = useAccount();
    const { switchChain } = useSwitchChain();
    const [isMinting, setIsMinting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
  
    const handleAddNetwork = () => {
      switchChain({ chainId: horizenGobi.id });
    };
  
    const handleMint = async() => {
      setIsMinting(true);
     const minttx= await contractService.mintToken();
      setTimeout(() => {
        setIsMinting(false);
        setIsSuccess(true);
      }, 5000);
    };
    
    const handleCloseSuccess = () => {
      setIsSuccess(false);
    };
  
    return (
      <div>
        {isSuccess && <Confetti recycle={false} numberOfPieces={400} />}
        <Header />
        <main className="py-12 px-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* --- Left Decorative Column --- */}
        
    {/* --- THIS IS THE NEW, ENHANCED DECORATIVE COLUMN --- */}
    <motion.div 
      variants={itemVariants} 
      // 1. We need a relative container for layering the background and logo
      className="hidden lg:block relative bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] rounded-lg aspect-[3/4] overflow-hidden"
    >
      {/* 2. Animated Background Pattern */}
      {/* This SVG creates a grid of dots and slowly pans it back and forth */}
      <motion.svg
        className="absolute inset-0 w-full h-full z-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <motion.pattern
            id="pattern-grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
            // Animate the pattern's position
            animate={{ x: [-10, 10], y: [-10, 10] }}
            transition={{
              duration: 30,
              ease: "linear",
              repeat: Infinity,
              repeatType: "mirror",
            }}
          >
            <circle cx="10" cy="10" r="1" fill="var(--border)" />
          </motion.pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pattern-grid)" />
      </motion.svg>

      {/* 3. Floating Logo in the Center */}
      {/* This div centers the logo and places it on top of the background */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <motion.div
          // Add a subtle floating animation to the logo
          animate={{ y: [-4, 4] }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror",
          }}
          // Add a drop shadow to lift the logo off the background
          className="w-32 h-32 filter drop-shadow-2xl" 
        >
          <img 
            src="/logo.png" 
            alt="Nyra Logo" 
            width={128} 
            height={128}
            className="object-contain"
          />
        </motion.div>
      </div>
    </motion.div>
            <div className="lg:col-span-2 space-y-8">
              <motion.div variants={itemVariants} className="bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] rounded-lg p-8">
                <h1 className="text-3xl font-bold tracking-wider uppercase text-[var(--foreground)]">{horizenGobi.name}</h1>
                <button onClick={handleAddNetwork} className="w-full mt-6 bg-[var(--primary)] text-white font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <Wallet size={16} /> Add to Wallet
                </button>
                <div className="mt-6 space-y-3">
                  <LinkButton text="Explorer" icon={<Globe size={20} />} href={horizenGobi.blockExplorers.default.url} isExternal />
                </div>
              </motion.div>
  
              <motion.div variants={itemVariants} className="bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] rounded-lg p-8">
                <h2 className="text-xl font-bold flex items-center gap-3 text-[var(--foreground)] mb-6">
                  <img src="/logo.png" alt="" width={40} height={40}/> NYRA Faucet
                </h2>
                {isConnected && address ? (
                  <>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-grow w-full bg-white border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--foreground-secondary)] font-mono truncate">
                        {address}
                      </div>
                      <button onClick={handleMint} className="bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold py-3 px-8 rounded-lg hover:opacity-90 transition-opacity">
                        Mint
                      </button>
                    </div>
                    <p className="text-sm text-[var(--foreground-secondary)]/80 mt-4">Mint 1k native tokens to trade.</p>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-grow w-full bg-white border border-dashed border-[var(--border)] rounded-lg px-4 py-3 text-sm text-center text-[var(--foreground-secondary)]/60">
                        Connect your wallet first
                      </div>
                      <button disabled className="bg-[var(--border)] text-[var(--foreground-secondary)] font-semibold py-3 px-8 rounded-lg cursor-not-allowed">
                        Connect Wallet
                      </button>
                    </div>
                     <p className="text-sm text-[var(--foreground-secondary)]/80 mt-4">Connect your wallet to mint tokens.</p>
                  </>
                )}
              </motion.div>
              
              <motion.div variants={itemVariants} className="bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] rounded-lg p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-[var(--foreground)]">Details</h2>
                    <p className="text-sm font-medium text-[var(--foreground-secondary)]">Chain ID: <span className="font-semibold text-[var(--foreground)]">2651420</span></p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailCard title="Native Token" value="$NYRA" icon={<Droplets size={16} />} imgSrc="/logo.png"/>
                    <DetailCard title="Settlement Layer" value="Base Sepolia" icon={<Activity size={16} />} imgSrc="" />
                </div>
                <div className="mt-6 border-t border-[var(--border)] pt-6">
                    <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">URLs</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-[var(--border)]">
                            <span className="text-[var(--foreground-secondary)] font-mono truncate">https://horizen-testnet.rpc.caldera.xyz/http</span>
                            <Copy className="w-4 h-4 text-[var(--foreground-secondary)] cursor-pointer hover:text-[var(--foreground)] flex-shrink-0 ml-4"/>
                        </div>
                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-[var(--border)]">
                            <span className="text-[var(--foreground-secondary)] font-mono truncate">https://horizen-testnet.explorer.caldera.xyz/</span>
                            <Copy className="w-4 h-4 text-[var(--foreground-secondary)] cursor-pointer hover:text-[var(--foreground)] flex-shrink-0 ml-4"/>
                        </div>
                    </div>
                </div>
            </motion.div>
            </div>
          </motion.div>
        </main>
        
        {/* Modal Handling */}
        <AnimatePresence>
          {isMinting && (
            <motion.div key="backdrop" variants={backdropVariants} initial="hidden" animate="visible" exit="hidden" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <MintingProgressModal />
            </motion.div>
          )}
          {isSuccess && (
            <motion.div key="backdrop" variants={backdropVariants} initial="hidden" animate="visible" exit="hidden" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <SuccessModal onClose={handleCloseSuccess} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
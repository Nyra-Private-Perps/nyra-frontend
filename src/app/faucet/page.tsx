"use client"
import { useState, useEffect } from "react";
import { Header } from "@/components/Header/Header";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useAccount, useSwitchChain } from "wagmi";
import { horizenGobi } from "@/lib/chains"; // Import our new chain config
import Confetti from 'react-confetti';
import {
  ArrowRight, Wallet, Globe, Activity, Droplets, Copy, CheckCircle2, Loader, PartyPopper, Shield, // Added Shield
  Check
} from "lucide-react";
import { contractService } from "@/services/contractService";
import Link from "next/link";

// --- Animation Variants ---
const containerVariants: Variants = { 
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2,
    },
  },
};
const itemVariants: Variants = { 
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};
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
        {imgSrc ? (
          <img src={imgSrc} alt={`${title} icon`} width={40} height={40} />
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

  // --- REVISED MintingProgressModal with shared animations and styling ---
  const MintingProgressModal = ({ step }: { step: number }) => { // Pass step as prop
    // Exact colors sampled from the previous image
    const MODAL_BG = "#FDFCFB";
    const MODAL_BORDER = "#E8E2DD";
    const TEXT_COLOR = "#5C4E46";
    const LIGHT_TEXT_COLOR = "#8F857D";
    const SWIRL_LIGHT = "rgba(232, 220, 209, 0.4)"; // Faint light beige for swirl
    const SWIRL_DARK = "rgba(180, 150, 120, 0.6)"; // Slightly darker for swirl effect
    const SHIELD_INNER_BG = "#EDE7E1"; // Very light beige for shield circle
    const SHIELD_ICON_COLOR = "#78655A"; // Darker brown for shield icon
    const STEP_COMPLETED_BG = "#5BA65E"; // Green for completed step
    const STEP_CURRENT_BG = "#8D6E63"; // Brown for current step (not used directly for spinner)
    const STEP_PENDING_DOT = "#AFA59D"; // Grayish brown for pending dot
    const LOADER_COLOR = "#5C4E46"; // Dark brown for loader

    const stepsLabels = ["Approve mint function", "Minting your tokens"];
  
    return (
      <motion.div 
        variants={modalVariants} 
        initial="hidden" 
        animate="visible" 
        exit="hidden" 
        className="rounded-[20px] w-full max-w-md p-7 shadow-xl overflow-hidden" // Matching style
        style={{ 
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: MODAL_BG,
          border: `1px solid ${MODAL_BORDER}`
        }} 
      >
        
        {/* --- SWIRL ANIMATION: Soft radial light rays --- */}
        <div className="relative h-48 w-full flex items-center justify-center mb-6 rounded-full"> 
          {/* Central radial glow */}
          <div 
            className="absolute inset-0 rounded-full" 
            style={{ 
              background: `radial-gradient(circle at center, ${SWIRL_LIGHT} 0%, rgba(253, 252, 251, 0) 60%)`,
            }}
          />

          {/* Lighter, softer swirl lines - outer */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{
              background: `radial-gradient(ellipse at center, transparent 0%, transparent 40%, ${SWIRL_LIGHT} 45%, rgba(253, 252, 251, 0) 70%)`,
              filter: 'blur(3px)',
              maskImage: 'radial-gradient(circle at center, transparent 30%, black 70%)',
              WebkitMaskImage: 'radial-gradient(circle at center, transparent 30%, black 70%)',
            }}
          />
          {/* Darker, more defined swirl lines - inner */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{
              background: `radial-gradient(ellipse at center, transparent 0%, transparent 35%, ${SWIRL_DARK} 40%, rgba(253, 252, 251, 0) 60%)`,
              filter: 'blur(2px)',
              scale: 0.9,
              maskImage: 'radial-gradient(circle at center, transparent 25%, black 65%)',
              WebkitMaskImage: 'radial-gradient(circle at center, transparent 25%, black 65%)',
            }}
          />
          
          {/* Central Shield with faint glow and subtle pulse */}
          <motion.div
            animate={{ 
              scale: [1, 1.03, 1], // Subtle pulse
              y: [0, -1, 0] // Very gentle float
            }}
            transition={{ 
              duration: 3.5, 
              ease: "easeInOut", 
              repeat: Infinity 
            }}
            className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full" 
            style={{
              backgroundColor: SHIELD_INNER_BG,
              border: `1px solid ${MODAL_BORDER}`,
              boxShadow: `0 0 15px rgba(180, 150, 120, 0.4), inset 0 1px 3px rgba(255,255,255,0.7)`, 
            }}
          >
            <Shield className="w-10 h-10" style={{ color: SHIELD_ICON_COLOR }} /> 
          </motion.div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-center mt-3 mb-6" style={{ color: TEXT_COLOR }}>Minting Your Tokens...</h2> 
        
        {/* Steps: Precise matching of icons/spacing */}
        <div className="space-y-4"> 
          {stepsLabels.map((label, index) => {
            const stepNumber = index + 1;
            const isCompleted = step > stepNumber;
            const isCurrent = step === stepNumber;
            
            return (
              <div key={index} className="flex items-center gap-4 text-base" style={{ color: isCurrent || isCompleted ? TEXT_COLOR : LIGHT_TEXT_COLOR,fontWeight: isCompleted ?700:100 }}> 
                <div className={`flex items-center justify-center w-5 h-5 rounded-full`}> 
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" style={{backgroundColor: STEP_COMPLETED_BG, borderRadius: '50%'}} /> 
                  ) : isCurrent ? (
                      <Loader className="w-4 h-4 animate-spin" style={{ color: LOADER_COLOR }} /> 
                  ) : (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STEP_PENDING_DOT }} /> 
                  )}
                </div>
                <span className={`font-medium`}>
                  {label}
                </span>
              </div>
            );
          })}
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
       <div className="flex gap-2">
        <Link href={'/vaults'} className="w-full mt-6 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity">
          Go to Vaults!
        </Link>
        <button onClick={onClose} className="w-full mt-6 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity">
          Awesome
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
    const [mintStep, setMintStep] = useState(1); // State to control minting progress

    useEffect(() => {
      const handleMintConfirmed = (txHash: string) => {
          console.log("Mint transaction confirmed:", txHash);
          setMintStep(2); // Move to the second step (Minting your tokens)
          // You might want to delay setting isSuccess here if the 'minting' takes time
          setTimeout(() => {
            setIsMinting(false);
            setIsSuccess(true);
            setMintStep(1); // Reset step for next mint
          }, 3000); // Simulate network finalization and UI update
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
      setMintStep(1); // Start at the first step
      // The contractService.mintToken() will eventually emit "mintConfirmed"
      // which will then update the mintStep and eventually setIsSuccess
      try {
        await contractService.mintToken();
      } catch (error) {
        console.error("Minting failed:", error);
        setIsMinting(false); // Stop minting on error
        setMintStep(1); // Reset step
        // Optionally show an error modal here
      }
    };
    
    const handleCloseSuccess = () => {
      setIsSuccess(false);
    };
  
    return (
      <div>
        {isSuccess && <Confetti recycle={false} numberOfPieces={400} />}
        <Header />
        <main className="py-12 px-6">
          <motion.div variants={containerVariants}  className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* --- Left Decorative Column --- */}
        
    {/* --- THIS IS THE NEW, ENHANCED DECORATIVE COLUMN --- */}
    {/* <motion.div 
      variants={itemVariants} 
      // 1. We need a relative container for layering the background and logo
      className="hidden lg:block relative bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] rounded-lg aspect-[3/4] overflow-hidden"
    >
   
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
          className="w-50 h-50 filter drop-shadow-2xl" 
        >
          <img 
            src="/logo.png" 
            alt="Nyra Logo" 
            width={200} 
            height={200}
            className="object-contain"
          />
        </motion.div>
      </div>
    </motion.div> */}
            <div className="lg:col-span-3 space-y-8">
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
                  NYRA Faucet
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
                <div className="mt-6 border-t border-[var(--border)] pt-4">
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
              <MintingProgressModal step={mintStep} /> {/* Pass mintStep here */}
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

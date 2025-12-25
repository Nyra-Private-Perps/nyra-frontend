"use client"

import { motion, type Variants } from "framer-motion";
import { Check,  Loader, ShieldCheck, ShieldOff, Shield } from "lucide-react";

// --- Animation Variants ---
const backdropVariants: Variants = { 
  visible: { opacity: 1 }, 
  hidden: { opacity: 0 } 
};

const modalVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.2 } },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 25, stiffness: 300 } },
};

// --- 1. In-Progress Modal (Dark High-Tech Design) ---
export const InProgressModal = ({ step, maxSteps }: { step: number; maxSteps: number }) => {
  const steps = ["Approve NYRA Token", "Approving NYRA Token", "Confirm Deposit", "Deploying to Contract"];

  return (
    <motion.div 
      variants={modalVariants} 
      initial="hidden" 
      animate="visible" 
      exit="hidden" 
      className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl relative overflow-hidden text-white"
    >
      {/* Subtle background glow */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* --- REVISED ENERGY SWIRL: Blue/Purple High-Tech Glow --- */}
      <div className="relative h-44 w-full flex items-center justify-center mb-10">
        {/* Outer rotating pulse */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-40 h-40 border border-blue-500/20 border-dashed rounded-full"
        />
        
        {/* Inner energy ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute w-32 h-32 border-2 border-t-blue-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full opacity-40"
        />

        {/* Central Shield with Magnetic Pulse */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.2)]"
        >
          <Shield className="w-10 h-10 text-blue-400" />
        </motion.div>
      </div>

      <h2 className="text-2xl font-bold text-center mb-8 tracking-tight">Processing Transaction</h2>
      
      {/* Step Indicators */}
      <div className="space-y-5 px-2">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = step > stepNumber;
          const isCurrent = step === stepNumber;
          
          return (
            <div key={index} className="flex items-center gap-4 transition-all">
              <div className="flex items-center justify-center w-6 h-6">
                {isCompleted ? (
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </div>
                ) : isCurrent ? (
                  <Loader className="w-6 h-6 text-blue-400 animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white/10 ml-2" />
                )}
              </div>
              <span className={`text-sm font-semibold transition-colors ${
                isCompleted || isCurrent ? "text-white" : "text-gray-600"
              }`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// --- 2. Success Modal (Dark Emerald Design) ---
export const SuccessModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div 
    variants={modalVariants} 
    initial="hidden" 
    animate="visible" 
    exit="hidden" 
    className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] w-full max-w-sm p-10 text-center text-white shadow-2xl relative overflow-hidden"
  >
    <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-600/10 blur-[80px] rounded-full pointer-events-none" />
    
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
      className="bg-emerald-500/10 rounded-3xl p-6 mx-auto w-24 h-24 flex items-center justify-center border border-emerald-500/20 mb-8 shadow-[0_0_40px_rgba(16,185,129,0.1)]"
    >
      <ShieldCheck className="w-12 h-12 text-emerald-400" />
    </motion.div>

    <h2 className="text-3xl font-bold tracking-tight mb-3">Deposit Success!</h2>
    <p className="text-gray-400 text-sm leading-relaxed mb-10 px-4">
      Your funds have been securely deployed to the strategy vault.
    </p>

    <button 
      onClick={onClose} 
      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
    >
      Return to Vault
    </button>
  </motion.div>
);

// --- 3. Error Modal (Dark Crimson Design) ---
export const ErrorModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div 
    variants={modalVariants} 
    initial="hidden" 
    animate="visible" 
    exit="hidden" 
    className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] w-full max-w-sm p-10 text-center text-white shadow-2xl relative overflow-hidden"
  >
    <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/10 blur-[80px] rounded-full pointer-events-none" />

    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-red-500/10 rounded-3xl p-6 mx-auto w-24 h-24 flex items-center justify-center border border-red-500/20 mb-8 shadow-[0_0_40px_rgba(239,68,68,0.1)]"
    >
      <ShieldOff className="w-12 h-12 text-red-400" />
    </motion.div>

    <h2 className="text-3xl font-bold tracking-tight mb-3">Tx Failed</h2>
    <p className="text-gray-400 text-sm leading-relaxed mb-10 px-4">
      The transaction was rejected or failed on-chain. Please check your wallet balance.
    </p>

    <button 
      onClick={onClose} 
      className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-red-600/20 active:scale-95"
    >
      Try Again
    </button>
  </motion.div>
);

// --- Modal Wrapper (Darkened Backdrop) ---
export const ModalWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    key="backdrop"
    variants={backdropVariants}
    initial="hidden"
    animate="visible"
    exit="hidden"
    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
  >
    {children}
  </motion.div>
);

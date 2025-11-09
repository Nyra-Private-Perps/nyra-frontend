"use client"

import { motion, AnimatePresence, Variants } from "framer-motion";
import { Check, X, Loader, ShieldCheck, ShieldOff } from "lucide-react";

// --- Animation Variants ---
const backdropVariants: Variants = { /* ... */ };
const modalVariants: Variants = { /* ... */ };

// --- In-Progress Modal ---
export const InProgressModal = ({ step, maxSteps }: { step: number; maxSteps: number }) => {
  const steps = ["Approve NYRA Token", "Approving NYRA Token", "Confirm Deposit", "Deploying to Contract"];

  return (
    <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="hidden" className="bg-[var(--card)] border border-[var(--border)] rounded-lg w-full max-w-sm p-8 text-[var(--foreground)] shadow-[var(--shadow-card)]">
      <h2 className="text-xl font-semibold text-center text-[var(--foreground)] mb-6">Processing Transaction...</h2>
      <div className="space-y-4">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = step > stepNumber;
          const isCurrent = step === stepNumber;
          
          return (
            <div key={index} className="flex items-center gap-4 transition-opacity" style={{ opacity: isCurrent || isCompleted ? 1 : 0.5 }}>
              <div className="flex items-center justify-center w-6 h-6">
                {isCompleted ? <Check className="w-5 h-5 text-green-600" /> : null}
                {isCurrent ? <Loader className="w-5 h-5 text-[var(--primary)] animate-spin" /> : null}
                {!isCompleted && !isCurrent ? <div className="w-2 h-2 rounded-full bg-[var(--border)]" /> : null}
              </div>
              <span className={`font-medium ${isCurrent ? 'text-[var(--foreground)]' : 'text-[var(--foreground-secondary)]'}`}>{label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// --- Success Modal ---
export const SuccessModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="hidden" className="bg-[var(--card)] border border-[var(--border)] rounded-lg w-full max-w-sm p-8 text-center text-[var(--foreground)] shadow-[var(--shadow-card)]">
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
    >
      <ShieldCheck className="w-16 h-16 mx-auto text-green-600" />
    </motion.div>
    <h2 className="text-2xl font-semibold text-[var(--foreground)] mt-4">Deposit Successful!</h2>
    <p className="text-[var(--foreground-secondary)] mt-2">Your funds have been securely deposited into the vault.</p>
    <button onClick={onClose} className="w-full mt-6 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity">
      Great!
    </button>
  </motion.div>
);

// --- Error Modal ---
export const ErrorModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="hidden" className="bg-[var(--card)] border border-[var(--border)] rounded-lg w-full max-w-sm p-8 text-center text-[var(--foreground)] shadow-[var(--shadow-card)]">
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-16 h-16 mx-auto"
    >
      <ShieldOff className="absolute w-16 h-16 text-red-500/50" />
      <motion.div 
        initial={{ y: 0 }} 
        animate={{ y: [0, -5, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
        className="absolute w-16 h-16"
      >
        <ShieldOff className="w-16 h-16 text-red-500" />
      </motion.div>
    </motion.div>
    <h2 className="text-2xl font-semibold text-[var(--foreground)] mt-4">Transaction Failed</h2>
    <p className="text-[var(--foreground-secondary)] mt-2">Something went wrong. Please check your wallet and try again.</p>
    <button onClick={onClose} className="w-full mt-6 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity">
      Try Again
    </button>
  </motion.div>
);

// --- Modal Wrapper ---
export const ModalWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    key="backdrop"
    variants={backdropVariants}
    initial="hidden"
    animate="visible"
    exit="hidden"
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
  >
    {children}
  </motion.div>
);

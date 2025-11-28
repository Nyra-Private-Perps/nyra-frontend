"use client"

import { motion, AnimatePresence, Variants } from "framer-motion";
import { Check, X, Loader, ShieldCheck, ShieldOff, Shield } from "lucide-react";

// --- Animation Variants (No Changes) ---
const backdropVariants: Variants = { visible: { opacity: 1 }, hidden: { opacity: 0 } };
const modalVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.98, transition: { duration: 0.2, ease: "easeOut" } },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

// --- In-Progress Modal (REVISED for exact color matching, new swirl style, larger size, clearer words) ---
export const InProgressModal = ({ step, maxSteps }: { step: number; maxSteps: number }) => {
  const steps = ["Approve NYRA Token", "Approving NYRA Token", "Confirm Deposit", "Deploying to Contract"];

  // Exact colors sampled from the new image
  const MODAL_BG = "#FDFCFB";
  const MODAL_BORDER = "#E8E2DD";
  const TEXT_COLOR = "#5C4E46";
  const LIGHT_TEXT_COLOR = "#8F857D";
  const SWIRL_LIGHT = "rgba(232, 220, 209, 0.4)"; // Faint light beige for swirl
  const SWIRL_DARK = "rgba(180, 150, 120, 0.6)"; // Slightly darker for swirl effect
  const SHIELD_INNER_BG = "#EDE7E1"; // Very light beige for shield circle
  const SHIELD_ICON_COLOR = "#78655A"; // Darker brown for shield icon
  const STEP_COMPLETED_BG = "#5BA65E"; // Green for completed step
  const STEP_CURRENT_BG = "#8D6E63"; // Brown for current step
  const STEP_PENDING_DOT = "#AFA59D"; // Grayish brown for pending dot
  const LOADER_COLOR = "#5C4E46"; // Dark brown for loader

  return (
    <motion.div 
      variants={modalVariants} 
      initial="hidden" 
      animate="visible" 
      exit="hidden" 
      className="rounded-[20px] w-full max-w-md p-7 shadow-xl overflow-hidden" // Slightly larger (max-w-md), increased padding, stronger shadow
      style={{ 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: MODAL_BG,
        border: `1px solid ${MODAL_BORDER}`
      }} 
    >
      
      {/* --- NEW SWIRL ANIMATION: Soft radial light rays --- */}
      <div className="relative h-48 w-full flex items-center justify-center mb-6 rounded-full"> {/* Taller for more space */}
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
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
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
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
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
          className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full" // Larger shield circle
          style={{
            backgroundColor: SHIELD_INNER_BG,
            border: `1px solid ${MODAL_BORDER}`,
            boxShadow: `0 0 15px rgba(180, 150, 120, 0.4), inset 0 1px 3px rgba(255,255,255,0.7)`, // Faint golden glow + inner highlight
          }}
        >
          <Shield className="w-10 h-10" style={{ color: SHIELD_ICON_COLOR }} /> {/* Larger, darker shield icon */}
        </motion.div>
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-center mt-3 mb-6" style={{ color: TEXT_COLOR }}>Processing Transaction...</h2> {/* Larger text, slightly higher margin */}
      
      {/* Steps: Precise matching of icons/spacing from Image 1 */}
      <div className="space-y-4"> {/* Increased space between steps */}
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = step > stepNumber;
          const isCurrent = step === stepNumber;
          
          return (
            <div key={index} className="flex items-center gap-4 text-base" style={{ color: isCurrent || isCompleted ? TEXT_COLOR : LIGHT_TEXT_COLOR,fontWeight: isCompleted ?700:100 }}> {/* Larger text, increased gap, color by state */}
              <div className={`flex items-center justify-center w-5 h-5 rounded-full`}> {/* Larger icon circles */}
                {isCompleted ? (
                  <Check className="w-4 h-4 text-white" style={{backgroundColor: STEP_COMPLETED_BG, borderRadius: '50%'}} /> // Green background for check
                ) : isCurrent ? (
                    // Explicitly use a custom Loader icon or a simple dot if the first step
                    // For the first step (Approve NYRA Token), the image shows a spinner.
                    // For subsequent steps, if current, use a spinner.
                    index === 0 ? (
                        <Loader className="w-4 h-4 animate-spin" style={{ color: LOADER_COLOR }} /> // Spinner for the very first step
                    ) : (
                        <Loader className="w-4 h-4 animate-spin" style={{ color: LOADER_COLOR }} /> // Spinner for current step
                    )
                ) : (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STEP_PENDING_DOT }} /> // Dim dot for pending
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

// --- Success Modal (Minor tweaks for consistency) ---
export const SuccessModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="hidden" className="bg-[var(--card)] border border-[var(--border)] rounded-lg w-full max-w-sm p-8 text-center text-[var(--foreground)] shadow-[var(--shadow-card)]">
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
      className="bg-green-100/50 rounded-full p-4 mx-auto w-24 h-24 flex items-center justify-center border border-green-200"
    >
      <ShieldCheck className="w-14 h-14 text-green-700" />
    </motion.div>
    <h2 className="text-2xl font-semibold text-[var(--foreground)] mt-6">Deposit Successful!</h2>
    <p className="text-[var(--foreground-secondary)] mt-2 leading-relaxed">Your funds have been securely deposited into the vault.</p>
    <button onClick={onClose} className="w-full mt-8 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity text-lg">
      Fantastic!
    </button>
  </motion.div>
);

// --- Error Modal (Minor tweaks for consistency) ---
export const ErrorModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="hidden" className="bg-[var(--card)] border border-[var(--border)] rounded-lg w-full max-w-sm p-8 text-center text-[var(--foreground)] shadow-[var(--shadow-card)]">
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-24 h-24 mx-auto"
    >
      <motion.div 
        animate={{ scale: [0.9, 1.0, 0.9], opacity: [0.4, 0.7, 0.4] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute inset-0 bg-red-100 rounded-full flex items-center justify-center"
      >
        <X className="w-16 h-16 text-red-700/30" strokeWidth={1} />
      </motion.div>

      <motion.div 
        initial={{ y: 0 }} 
        animate={{ x: [0, -5, 5, -5, 0], rotate: [0, -5, 5, -5, 0] }}
        transition={{ repeat: 3, duration: 0.3, ease: "easeInOut" }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <ShieldOff className="w-16 h-16 text-red-700" />
      </motion.div>
    </motion.div>
    <h2 className="text-2xl font-semibold text-[var(--foreground)] mt-6">Transaction Failed</h2>
    <p className="text-[var(--foreground-secondary)] mt-2 leading-relaxed">Something went wrong. Please check your wallet and try again.</p>
    <button onClick={onClose} className="w-full mt-8 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity text-lg">
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

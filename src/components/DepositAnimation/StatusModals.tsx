import { motion, type Variants } from "framer-motion"
import { Check, Loader, ShieldCheck, ShieldOff, Activity } from "lucide-react";

const backdropVariants: Variants = { 
  visible: { opacity: 1 }, 
  hidden: { opacity: 0 } 
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" },
  visible: { 
    opacity: 1, scale: 1, y: 0, filter: "blur(0px)",
    transition: { type: "spring", stiffness: 260, damping: 25 } 
  },
};

export const InProgressModal = ({ step, maxSteps }: { step: number; maxSteps: number }) => {
  const steps = ["Approve NYRA Token", "Approving NYRA Token", "Confirm Deposit", "Deploying to Contract"];

  return (
    <motion.div 
      variants={modalVariants} 
      initial="hidden" animate="visible" exit="hidden" 
      className="bg-white/80 backdrop-blur-3xl border border-white rounded-[3rem] w-full max-w-md p-10 shadow-[0_40px_100px_rgba(79,70,229,0.1)] relative overflow-hidden"
    >
      {/* Soft Ambient Background Glow */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-100/50 blur-[80px] rounded-full pointer-events-none" />

      {/* --- ELITE ENERGY SWIRL: Lavender Ambient Glow --- */}
      <div className="relative h-44 w-full flex items-center justify-center mb-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-40 h-40 border border-indigo-200/50 border-dashed rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-32 h-32 border-2 border-t-indigo-500 border-r-transparent border-b-purple-400 border-l-transparent rounded-full opacity-30"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 flex items-center justify-center w-20 h-20 rounded-[1.8rem] bg-white shadow-xl border border-indigo-50"
        >
          <Activity className="w-10 h-10 text-indigo-600" />
        </motion.div>
      </div>

      <h2 className="text-2xl font-bold text-center mb-10 text-gray-900 tracking-tight">Processing Strategy</h2>
      
      <div className="space-y-5 px-2">
        {steps.map((label, index) => {
          const isCompleted = step > (index + 1);
          const isCurrent = step === (index + 1);
          
          return (
            <div key={index} className="flex items-center gap-4 group">
              <div className="flex items-center justify-center w-6 h-6">
                {isCompleted ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />
                  </motion.div>
                ) : isCurrent ? (
                  <Loader className="w-6 h-6 text-indigo-600 animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-indigo-100 ml-2 group-hover:bg-indigo-200 transition-colors" />
                )}
              </div>
              <span className={`text-sm font-bold tracking-tight transition-colors ${isCompleted || isCurrent ? "text-gray-900" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export const SuccessModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div 
    variants={modalVariants} initial="hidden" animate="visible" exit="hidden" 
    className="bg-white/80 backdrop-blur-3xl border border-white rounded-[3rem] w-full max-w-sm p-10 text-center shadow-[0_40px_100px_rgba(16,185,129,0.1)] relative overflow-hidden"
  >
    <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-100/50 blur-[80px] rounded-full pointer-events-none" />
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
      className="bg-emerald-50 rounded-[2rem] p-6 mx-auto w-24 h-24 flex items-center justify-center border border-emerald-100 mb-8 shadow-sm"
    >
      <ShieldCheck className="w-12 h-12 text-emerald-500" />
    </motion.div>
    <h2 className="text-3xl font-bold text-gray-950 tracking-tighter mb-3">Strategy Live!</h2>
    <p className="text-gray-500 text-sm leading-relaxed mb-10 px-4 font-medium">Your funds have been successfully deployed and secured in the vault.</p>
    <button onClick={onClose} className="w-full bg-gray-950 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-xl active:scale-95">
      Return to Vault
    </button>
  </motion.div>
);

export const ErrorModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div 
    variants={modalVariants} initial="hidden" animate="visible" exit="hidden" 
    className="bg-white/80 backdrop-blur-3xl border border-white rounded-[3rem] w-full max-w-sm p-10 text-center shadow-[0_40px_100px_rgba(244,63,94,0.1)] relative overflow-hidden"
  >
    <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-100/50 blur-[80px] rounded-full pointer-events-none" />
    <div className="bg-rose-50 rounded-[2rem] p-6 mx-auto w-24 h-24 flex items-center justify-center border border-rose-100 mb-8">
      <ShieldOff className="w-12 h-12 text-rose-500" />
    </div>
    <h2 className="text-3xl font-bold text-gray-950 tracking-tighter mb-3">Link Failed</h2>
    <p className="text-gray-500 text-sm leading-relaxed mb-10 px-4 font-medium">The transaction was rejected by your wallet or the network. Please check your balance.</p>
    <button onClick={onClose} className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-2xl transition-all shadow-xl active:scale-95 shadow-rose-200">
      Try Again
    </button>
  </motion.div>
);

export const ModalWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    key="backdrop"
    variants={backdropVariants}
    initial="hidden" animate="visible" exit="hidden"
    className="fixed inset-0 z-[300] flex items-center justify-center bg-indigo-950/10 backdrop-blur-md p-4"
  >
    {children}
  </motion.div>
);

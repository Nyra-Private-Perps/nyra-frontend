"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { X, Wallet, Info } from "lucide-react"
import { motion } from "framer-motion"

interface TransactionModalProps {
  type: "deposit" | "withdraw"
  onClose: () => void
  onSubmit: (amount: string, type: "deposit" | "withdraw") => void
}

export function TransactionModal({ type, onClose, onSubmit }: TransactionModalProps) {
  const { isConnected } = useAccount()
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(val);
    
    if (val && parseFloat(val) < 0) {
      setError("Amount cannot be negative");
    } else if (val && isNaN(Number(val))) {
      setError("Invalid number");
    } else {
      setError("");
    }
  }

  const handleTransaction = () => {
    if (!isConnected || !amount || parseFloat(amount) <= 0 || error) return
    onSubmit(amount, type)
    onClose()
  }

  const isButtonDisabled = !isConnected || !amount || parseFloat(amount) <= 0 || !!error

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] w-full max-w-md p-8 text-white shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
                <Wallet size={20} className="text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold capitalize">{type} Funds</h2>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Faucet Reminder Message */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 mb-8 text-blue-300/80 text-xs">
            <Info size={16} className="shrink-0" />
            <p>Make sure you have minted your testnet NYRA tokens from the Faucet before proceeding.</p>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Amount to {type}
              </label>
              <p className="text-[10px] text-gray-500">
                Available: <span className="text-gray-300 font-mono font-bold">$12,842.50</span>
              </p>
            </div>
            
            <div className="relative group">
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white text-2xl font-mono placeholder:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-blue-400 transition-all border border-white/5 active:scale-95">
                MAX
              </button>
            </div>
            
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400 font-medium px-1">
                {error}
              </motion.p>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-10">
            <button
              onClick={handleTransaction}
              disabled={isButtonDisabled}
              className={`w-full py-5 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 active:scale-[0.98] ${
                isButtonDisabled
                  ? "bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed shadow-none"
                  : "bg-blue-600 text-white hover:bg-blue-500"
              }`}
            >
              {isConnected ? (
                <>
                   <span className="capitalize">{type}</span>
                </>
              ) : (
                "Connect Wallet"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

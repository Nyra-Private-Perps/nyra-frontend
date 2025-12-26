"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { X, Wallet, Info, Sparkles } from "lucide-react"
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
    if (val && parseFloat(val) < 0) setError("Amount cannot be negative");
    else if (val && isNaN(Number(val))) setError("Invalid number");
    else setError("");
  }

  const handleTransaction = () => {
    if (!isConnected || !amount || parseFloat(amount) <= 0 || error) return
    onSubmit(amount, type)
    onClose()
  }

  const isButtonDisabled = !isConnected || !amount || parseFloat(amount) <= 0 || !!error

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-indigo-950/10 backdrop-blur-xl flex items-center justify-center z-[250] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white/90 border border-white rounded-[3.5rem] w-full max-w-md p-10 text-gray-900 shadow-[0_50px_100px_rgba(0,0,0,0.1)] relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-100/50 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
                <Wallet size={24} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold tracking-tighter capitalize">{type}</h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-900 transition-all">
              <X size={20} />
            </button>
          </div>

          {/* Elite Faucet Box */}
          <div className="flex items-start gap-4 p-5 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 mb-10 text-indigo-900/70 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
            <Sparkles size={18} className="shrink-0 text-indigo-400" />
            <p>Ensure you have minted your testnet NYRA tokens from the Faucet before initiating this {type}.</p>
          </div>

          {/* Input Section */}
          <div className="space-y-5">
            <div className="flex justify-between items-end px-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Enter Amount
              </label>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                Balance: <span className="text-gray-900 font-mono">$12,842.50</span>
              </p>
            </div>
            
            <div className="relative group">
              <input
                type="number" placeholder="0.00" value={amount} onChange={handleAmountChange}
                className="w-full h-20 bg-gray-50/50 border border-indigo-50 rounded-[1.8rem] px-8 text-3xl font-serif italic text-gray-900 placeholder:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 px-5 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-90 transition-all">
                MAX
              </button>
            </div>
            
            {error && <p className="text-xs text-rose-500 font-bold px-2 uppercase tracking-tighter">{error}</p>}
          </div>

          <div className="mt-12">
            <button
              onClick={handleTransaction}
              disabled={isButtonDisabled}
              className={`w-full h-16 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.3em] transition-all duration-300 shadow-xl active:scale-95 ${
                isButtonDisabled
                  ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none"
                  : "bg-gray-950 text-white hover:bg-black shadow-indigo-100"
              }`}
            >
              {isConnected ? `Initiate ${type}` : "Connect Wallet"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
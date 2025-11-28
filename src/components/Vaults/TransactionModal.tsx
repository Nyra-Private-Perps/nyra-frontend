"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { X } from "lucide-react"
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
    
    // Security: Input Validation
    if (val && parseFloat(val) < 0) {
      setError("Amount cannot be negative");
    } else if (val && isNaN(Number(val))) {
      setError("Invalid number");
    } else {
      setError("");
    }
  }

  const handleTransaction = () => {
    // Security: Final check before submission
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
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* Modal panel with a pop-up and fade-in animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-lg w-full max-w-md p-6 m-4 text-[var(--foreground)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-center text-[var(--foreground-secondary)] mb-6 -mt-2">
            Hope you have minted the awesome NYRA tokens!!
          </p>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold capitalize">{type} Funds</h2>
          <button onClick={onClose} className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
            <X size={24} />
          </button>
        </div>

        <div>
          <label className="text-xs text-[var(--foreground-secondary)] mb-2 block uppercase font-semibold tracking-wider">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              // Themed input field
              className="w-full bg-white border border-[var(--border)] rounded-lg px-4 py-3 text-[var(--foreground)] text-lg font-medium placeholder:text-[var(--foreground-secondary)]/70 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-md font-semibold text-[var(--primary)] hover:text-[var(--foreground)]">
              Max
            </button>
          </div>
          <p className="text-xs text-[var(--foreground-secondary)]/80 mt-2">Your available balance: $12,842.50</p>
        </div>

        <div className="mt-8">
          <button
            onClick={handleTransaction}
            disabled={isButtonDisabled}
            title={!isConnected ? "Connect wallet to continue" : ""}
            // Themed action button with disabled state
            className={`w-full py-3 rounded-lg font-semibold text-base transition-all duration-200 capitalize ${
              isButtonDisabled
                ? "bg-[var(--border)] text-[var(--foreground-secondary)] cursor-not-allowed"
                : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            }`}
          >
            {isConnected ? type : "Connect Wallet"}
          </button>
        </div>
      </motion.div>
      </motion.div>
  )
}
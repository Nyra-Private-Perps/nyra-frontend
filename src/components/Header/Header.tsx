"use client"

import Link from "next/link"
import { useAccount, useDisconnect } from "wagmi"
import { ConnectWalletModal } from "../Wallet/ConnectWalletModal"
import { useState } from "react"
import { AnimatePresence } from "framer-motion"

function truncateAddress(address: string) {
  if (!address) return ""
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

const WalletConnectButton = () => {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-[var(--secondary)] shadow-[var(--shadow-card)] px-3 py-2 rounded-full border border-[var(--border)]">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span className="text-md text-[var(--secondary-foreground)] font-medium">{truncateAddress(address)}</span>
        </div>
        <button
          onClick={() => disconnect()}
          className="bg-[var(--secondary)] text-[var(--secondary-foreground)] shadow-[var(--shadow-card)] px-4 py-2 rounded-lg text-md font-medium hover:bg-[var(--hover)] transition-colors duration-300 border border-[var(--border)]"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-[var(--secondary)] text-[var(--secondary-foreground)] px-4 py-2 rounded-lg text-md font-medium hover:bg-[var(--hover)] transition-colors duration-300 border border-[var(--border)]"
      >
        Connect Wallet
      </button>
      <AnimatePresence>
      {isModalOpen && <ConnectWalletModal onClose={() => setIsModalOpen(false)} />}
      </AnimatePresence>
    </>
  )
}

export function Header() {
  return (
    <header className="w-full px-4 sm:px-6 lg:px-8 py-4">
      <nav className="flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-[var(--primary)] text-[var(--primary-foreground)] w-10 h-10 flex items-center justify-center rounded-lg font-bold text-xl">
            N
          </div>
          <span className="text-xl font-semibold text-[var(--foreground)]">Nyra</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/vaults" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors duration-300 font-medium">
            Vaults
          </Link>
          <Link href="/profile" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors duration-300 font-medium">
            Profile
          </Link>
        </div>
        <WalletConnectButton />
      </nav>
    </header>
  )
}

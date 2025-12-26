import { useAccount, useDisconnect } from "wagmi"
import { ConnectWalletModal } from "../Wallet/ConnectWalletModal"
import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Link } from "react-router-dom"

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
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full border border-gray-100 shadow-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm text-gray-700 font-semibold">{truncateAddress(address)}</span>
        </div>
        <button
          onClick={() => disconnect()}
          className="bg-black text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-800 transition-all duration-300 shadow-lg active:scale-95"
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
        className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-indigo-600 transition-all duration-300 shadow-xl shadow-indigo-100 active:scale-95"
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
  const { isConnected } = useAccount()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] px-4 py-6 pointer-events-none">
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`
          mx-auto max-w-7xl pointer-events-auto
          flex items-center justify-between 
          bg-white/70 backdrop-blur-xl 
          px-10 py-4 rounded-[2.5rem] 
          border border-white/80
          transition-all duration-500
          ${isScrolled ? 'shadow-[0_20px_50px_rgba(0,0,0,0.1)] py-3' : 'shadow-[0_10px_30px_rgba(0,0,0,0.05)]'}
        `}
      >
        <nav className="flex items-center justify-between w-full">
          {/* Logo Section - Increased Size */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img 
               src="/logo.png" 
               alt="Nyra Logo" 
               className="h-14 w-auto object-contain" // Changed from h-10 to h-14
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-12">
            <Link to="/vaults" className="text-gray-500 hover:text-black transition-colors duration-300 text-sm font-bold tracking-widest uppercase">
              Vaults
            </Link>
            <Link to="/faucet" className="text-gray-500 hover:text-black transition-colors duration-300 text-sm font-bold tracking-widest uppercase">
              Faucet
            </Link>
            {isConnected && (
              <Link to="/profile" className="text-gray-500 hover:text-black transition-colors duration-300 text-sm font-bold tracking-widest uppercase">
                Profile
              </Link>
            )}
          </div>

          <WalletConnectButton />
        </nav>
      </motion.header>
    </div>
  )
}

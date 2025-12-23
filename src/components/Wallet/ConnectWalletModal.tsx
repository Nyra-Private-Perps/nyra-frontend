"use client"

import { useConnect } from 'wagmi';
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { X } from 'lucide-react';

// --- Animation Variants (Consistent with other modals) ---
const backdropVariants: Variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
}

const modalVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.98, transition: { duration: 0.2, ease: "easeOut" } },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
}

// --- Themed Helper Component ---
// Basic SVG icons for wallets, styled for the new theme
const walletIcons: { [key: string]: string } = {
  metamask: '/metamask.png',
  coinbasewallet: '/base.png', // wagmi's id for Coinbase Wallet is often 'coinbaseWallet'
  walletconnect: '/walletconect.png',
  injected : '/injected.png',
  talisman : '/talisman.png',
  // Add other wallets here, using their lowercase id as the key
};
const WalletIcon = ({ connectorName }: { connectorName: string }) => {
  // Normalize the connector name to use as a key (e.g., "MetaMask" -> "metamask")
  const key = connectorName.toLowerCase().replace(/\s/g, '');
  
  // Find the icon in our mapping, or use the default icon as a fallback
  const iconSrc = walletIcons[key] || '/wallets/default.svg';

  return (
    <img
      src={iconSrc}
      alt={`${connectorName} logo`}
      width={32}
      height={32}
      className="mr-4 flex-shrink-0 rounded-full"
    />
  );
};

interface ConnectWalletModalProps {
  onClose: () => void
}

export function ConnectWalletModal({ onClose }: ConnectWalletModalProps) {
  const { connectors, connect } = useConnect();

  // The logic for filtering connectors remains the same
  const installedConnectors = connectors.filter(
    (connector) => connector.ready && connector.id !== 'injected'
  );
  const browserWalletConnector = connectors.find(
    (connector) => connector.id === 'injected' && connector.ready
  );
  const otherConnectors = connectors.filter(
    (connector) => !connector.ready
  );

  return (
    // Animated Backdrop
    <motion.div
      key="backdrop"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Animated and Themed Modal Panel */}
      <motion.div
        key="modal"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="bg-[var(--card)] border border-[var(--border)] rounded-lg w-full max-w-sm p-6 text-[var(--foreground)] shadow-[var(--shadow-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Themed Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Connect Wallet</h2>
          <button onClick={onClose} className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Themed List of Wallets */}
        <div className="space-y-3">
          {browserWalletConnector && (
            <button
              key={browserWalletConnector.id}
              onClick={() => { connect({ connector: browserWalletConnector }); onClose(); }}
              className="w-full flex items-center text-left px-4 py-3 bg-[var(--secondary)] hover:bg-[var(--hover)] text-[var(--secondary-foreground)] rounded-lg transition-colors border border-[var(--border)] font-semibold"
            >
              Browser Wallet
            </button>
          )}
          {installedConnectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => { connect({ connector }); onClose(); }}
              className="w-full flex items-center text-left px-4 py-3 bg-[var(--secondary)] hover:bg-[var(--hover)] text-[var(--secondary-foreground)] rounded-lg transition-colors border border-[var(--border)] font-semibold"
            >
              <WalletIcon connectorName={connector.name} />
              {connector.name}
            </button>
          ))}
          {otherConnectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => { connect({ connector }); onClose(); }}
              className="w-full flex items-center text-left px-4 py-3 bg-[var(--secondary)] hover:bg-[var(--hover)] text-[var(--secondary-foreground)] rounded-lg transition-colors border border-[var(--border)] font-semibold"
            >
              <WalletIcon connectorName={connector.name} />
              {connector.name}
            </button>
          ))}
        </div>

        {/* Themed Cancel Button */}
        <button
          onClick={onClose}
          className="w-full text-center py-2 mt-4 text-sm font-medium text-[var(--foreground-secondary)] hover:bg-[var(--hover)] rounded-lg transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  )
}

// app/components/wallet/ConnectWalletModal.tsx
"use client";

import { useConnect } from 'wagmi';

// Basic SVG icons for wallets (replace with actual icons for production)
const WalletIcon = ({ name }: { name: string }) => {
  // In a real app, you'd have a mapping of name to SVG/image component
  if (name.toLowerCase().includes('meta')) return <svg className="w-8 h-8 mr-4" viewBox="0 0 32 32">...</svg>; // Placeholder
  if (name.toLowerCase().includes('coinbase')) return <svg className="w-8 h-8 mr-4" viewBox="0 0 32 32">...</svg>; // Placeholder
  if (name.toLowerCase().includes('walletconnect')) return <svg className="w-8 h-8 mr-4" viewBox="0 0 32 32">...</svg>; // Placeholder
  return <div className="w-8 h-8 mr-4 bg-gray-600 rounded-full" />;
};

export function ConnectWalletModal({ onClose }: { onClose: () => void }) {
  const { connectors, connect } = useConnect();

  // Separate installed connectors from the rest
  const installedConnectors = connectors.filter(
    (connector) => connector.ready && connector.id !== 'injected'
  );
  
  // The generic "Browser Wallet" (from injected connector)
  const browserWalletConnector = connectors.find(
    (connector) => connector.id === 'injected' && connector.ready
  );

  const otherConnectors = connectors.filter(
    (connector) => !connector.ready
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={onClose}>
      <div 
        className="w-full max-w-md p-6 bg-gray-900 border border-gray-700 rounded-2xl shadow-lg backdrop-filter backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Connect a wallet</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {browserWalletConnector && (
             <button
              key={browserWalletConnector.id}
              onClick={() => { connect({ connector: browserWalletConnector }); onClose(); }}
              className="flex items-center w-full px-4 py-3 text-lg font-semibold text-left text-white transition-all duration-300 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 hover:bg-gray-700"
            >
              <WalletIcon name={browserWalletConnector.name} />
              Browser Wallet
              <span className="px-2 py-1 ml-auto text-xs text-blue-300 bg-blue-900 rounded-md">Installed</span>
            </button>
          )}

          {installedConnectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => { connect({ connector }); onClose(); }}
              className="flex items-center w-full px-4 py-3 text-lg font-semibold text-left text-white transition-all duration-300 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 hover:bg-gray-700"
            >
              <WalletIcon name={connector.name} />
              {connector.name}
              <span className="px-2 py-1 ml-auto text-xs text-blue-300 bg-blue-900 rounded-md">Installed</span>
            </button>
          ))}
          
          {otherConnectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => { connect({ connector }); onClose(); }}
              className="flex items-center w-full px-4 py-3 text-lg font-semibold text-left text-white transition-all duration-300 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 hover:bg-gray-700"
            >
              <WalletIcon name={connector.name} />
              {connector.name}
            </button>
          ))}
        </div>
        <p className="mt-6 text-xs text-center text-gray-500">
          By connecting a wallet, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
}

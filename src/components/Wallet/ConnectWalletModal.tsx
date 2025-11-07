"use client"
import { useConnect } from 'wagmi';

// Basic SVG icons for wallets (replace with actual icons for production)
const WalletIcon = ({ name }: { name: string }) => {
  // In a real app, you'd have a mapping of name to SVG/image component
  if (name.toLowerCase().includes('meta')) return <svg className="w-8 h-8 mr-4" viewBox="0 0 32 32">...</svg>; // Placeholder
  if (name.toLowerCase().includes('coinbase')) return <svg className="w-8 h-8 mr-4" viewBox="0 0 32 32">...</svg>; // Placeholder
  if (name.toLowerCase().includes('walletconnect')) return <svg className="w-8 h-8 mr-4" viewBox="0 0 32 32">...</svg>; // Placeholder
  return <div className="w-8 h-8 mr-4 bg-gray-600 rounded-full" />;
};

interface ConnectWalletModalProps {
  onClose: () => void
}

export function ConnectWalletModal({ onClose }: ConnectWalletModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-heading-lg">Connect Wallet</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            ✕
          </button>
        </div>

        <div className="space-y-3">
        {browserWalletConnector && (
             <button
              key={browserWalletConnector.id}
              onClick={() => { connect({ connector: browserWalletConnector }); onClose(); }} className="w-full px-4 py-3 bg-slate-700/80 hover:bg-slate-600/80 text-white rounded-lg transition-colors border border-slate-600/50">
           Browser Wallet
          </button>
        )}
        {installedConnectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => { connect({ connector }); onClose(); }} className="w-full px-4 py-3 bg-slate-700/80 hover:bg-slate-600/80 text-white rounded-lg transition-colors border border-slate-600/50">
            <WalletIcon name={connector.name} />
            {connector.name}
          </button>
        ))}
                    {otherConnectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => { connect({ connector }); onClose(); }} className="w-full px-4 py-3 bg-slate-700/80 hover:bg-slate-600/80 text-white rounded-lg transition-colors border border-slate-600/50">
                         {connector.name}
            </button>
          ))}

        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-lg transition-colors border border-slate-700/50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// src/app/page.tsx
"use client";

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Header } from '../components/Header/Header';
import { GlassmorphicCard } from '../components/GlassModal/GlassmorphicCard';
import { ConnectWalletModal } from '../components/Wallet/ConnectWalletModal';

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected } = useAccount();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background - NOW VISIBLE */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.jpg')" }}
      />

      {/* Subtle dark overlay - reduced opacity so background shines through */}
      <div className="fixed inset-0 -z-10 bg-black/40" />

      <div className="relative z-10">
        <Header />

        <main className="flex min-h-screen items-center justify-center px-6 py-24 mt-6">
          <div className="w-full max-w-5xl text-center">
            <GlassmorphicCard>
              <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-300 to-blue-400">
                The Future of Wealth Creation for All
              </h1>

              <p className="mb-10 text-xl text-gray-200 md:text-2xl">
                Nyra brings privacy and efficiency to perpetual markets.
              </p>

              <div className="mx-auto mb-12 max-w-4xl space-y-6 text-left text-gray-300 text-base leading-relaxed md:text-lg">
                <p>
                  Perpetual trading today is fragmented and exposed — users face slippage, front-running, and limited access to yield across isolated DEXs. Nyra changes this by aggregating liquidity and execution from multiple perpetual markets through a Trusted Execution Environment (TEE), ensuring every trade, position, and settlement remains fully private yet verifiable on-chain.
                </p>
                <p>
                  Built on Horizen, Nyra’s architecture allows institutional traders to access cross-market liquidity, execute strategies securely, and deploy capital into yield-optimized vaults (xVaults) — all without revealing positions or trade intent.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
  <button className="px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl hover:from-purple-700 hover:to-violet-700 transform hover:scale-105 transition-all duration-300 shadow-xl">
    Explore Vaults
  </button>

  {isConnected ? (
    // PROFILE BUTTON – NYRA PURPLE
    <button className="px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-xl border border-purple-400/30">
      Profile
    </button>
  ) : (
    // CONNECT WALLET – CYAN BLUE
    <button
      onClick={() => setIsModalOpen(true)}
      className="px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl hover:from-cyan-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-xl"
    >
      Connect Wallet
    </button>
  )}
</div>
            </GlassmorphicCard>
          </div>
        </main>
      </div>

      {isModalOpen && <ConnectWalletModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
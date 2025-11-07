"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { Header } from "../components/Header/Header"
import { ConnectWalletModal } from "../components/Wallet/ConnectWalletModal"

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { isConnected } = useAccount()

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#2a0f5a] to-[#0c021d]" />

      <div className="relative z-10">
        <Header />

        <main className="flex min-h-screen items-center justify-center px-6 py-24 mt-6">
          <div className="w-full max-w-5xl text-center">
            {/* Refined Glass Card to better match the dark theme */}
            <div 
              className="bg-black/20 backdrop-blur-xl p-8 md:p-16 rounded-2xl border border-white/10 shadow-lg"
            >
              <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-50 sm:text-5xl md:text-6xl">
                The Future of Wealth Creation for All
              </h1>

              <p className="mb-10 text-lg text-slate-300 md:text-xl max-w-2xl mx-auto">
                Nyra brings privacy and efficiency to perpetual markets.
              </p>

              <div className="mx-auto mb-12 max-w-3xl space-y-6 text-left text-slate-300 text-base leading-relaxed md:text-lg">
                <p>
                  Perpetual trading today is fragmented and exposed — users face slippage, front-running, and limited
                  access to yield across isolated DEXs. Nyra changes this by aggregating liquidity and execution from
                  multiple perpetual markets through a Trusted Execution Environment (TEE), ensuring every trade,
                  position, and settlement remains fully private yet verifiable on-chain.
                </p>
                <p>
                  Built on Horizen, Nyra's architecture allows institutional traders to access cross-market liquidity,
                  execute strategies securely, and deploy capital into yield-optimized vaults (xVaults) — all without
                  revealing positions or trade intent.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <button className="px-8 py-3 text-base font-semibold text-white bg-white/5 backdrop-blur-sm rounded-lg hover:bg-white/10 transition-all duration-300 border border-white/10">
                  Explore Vaults
                </button>

                {/* --- UPDATED BUTTON with Purple Gradient and Glow --- */}
                {isConnected ? (
                  <button className="px-8 py-3 text-base font-semibold text-white bg-gradient-to-r from-fuchsia-500 to-blue-600 rounded-lg hover:from-fuchsia-400 hover:to-blue-400 transition-all duration-300 shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/40">
                    Profile
                  </button>
                ) : (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-8 py-3 text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-lg hover:from-purple-500 hover:to-fuchsia-400 transition-all duration-300 shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/40"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {isModalOpen && <ConnectWalletModal onClose={() => setIsModalOpen(false)} />}
    </div>
  )
}

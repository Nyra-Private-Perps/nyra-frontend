"use client"

import { Header } from "@/components/Header/Header"
import { VerifiedVaultCard } from "@/components/Vaults/VerifiedVaultCard"

export default function VaultsPage() {
  return (
    <div className="relative min-h-screen ">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        {/* Subtle blue glow at top - not dominant */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-30" />
        {/* Subtle slate glow at bottom */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-slate-600/10 rounded-full blur-3xl opacity-20" />
      </div>

      <Header />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-3 font-semibold">Strategy Vaults</p>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-50 mb-4 text-balance">
              Verified Strategy
              <br />
              Managers
            </h1>
            <p className="text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Access elite-managed strategies with TEE encryption and KYB verification. Trade with verified managers
              using sophisticated algorithms.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
            <VerifiedVaultCard
              name="hJLP 2x (USDC)"
              manager="Gauntlet"
              tvl="$21.4M"
              apy="8.61%"
              age="399 days"
              capacity="82%"
              verified
            />
            <VerifiedVaultCard
              name="JitoSOL Plus"
              manager="Gauntlet"
              tvl="$7.6M"
              apy="-0.51%"
              age="245 days"
              capacity="98%"
              verified
              almostFull
            />
            <VerifiedVaultCard
              name="Ace.Pro | Steady D01"
              manager="Ace.Pro"
              tvl="$21.1M"
              apy="12.77%"
              age="290 days"
              capacity="100%"
              verified
              full
            />
            <VerifiedVaultCard
              name="JLP Hedge Vault"
              manager="PrimeNumber"
              tvl="$11.7M"
              apy="26.45%"
              age="276 days"
              capacity="95%"
              verified
              almostFull
            />
          </div>
        </div>
      </main>
    </div>
  )
}

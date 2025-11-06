// src/app/vaults/page.tsx
'use client';

import { Header } from '@/components/Header/Header';
import { VerifiedVaultCard } from '@/components/Vaults/VerifiedVaultCard';

export default function VaultsPage() {
  return (
    <div className="relative min-h-screen">
      {/* your bg */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-black to-cyan-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_70%)] animate-pulse" />
      </div>

      <Header />

      <main className="pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-7xl md:text-9xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mb-4 text-glow">
              Strategy Vaults
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 font-light tracking-wide">
              TEE-encrypted • KYB-verified • Elite managers only
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-16">
            {/* your 4 stat cards */}
          </div>

          {/* GRID — NOW FULLY CLIENT */}
          <div className="grid gap-8 lg:grid-cols-2">
            <VerifiedVaultCard name="hJLP 2x (USDC)" manager="Gauntlet" tvl="$21.4M" apy="8.61%" age="399 days" capacity="82%" verified />
            <VerifiedVaultCard name="JitoSOL Plus" manager="Gauntlet" tvl="$7.6M" apy="-0.51%" age="245 days" capacity="98%" verified almostFull />
            <VerifiedVaultCard name="Ace.Pro | Steady D01" manager="Ace.Pro" tvl="$21.1M" apy="12.77%" age="290 days" capacity="100%" verified full />
            <VerifiedVaultCard name="JLP Hedge Vault" manager="PrimeNumber" tvl="$11.7M" apy="26.45%" age="276 days" capacity="95%" verified almostFull />
          </div>
        </div>
      </main>
    </div>
  );
}

// src/components/Vaults/ClientVaultsGrid.tsx
'use client';

import { VerifiedVaultCard } from './VerifiedVaultCard';

export function ClientVaultsGrid() {
  return (
    <>
      <VerifiedVaultCard name="hJLP 2x (USDC)" manager="Gauntlet" tvl="$21.4M" apy="8.61%" age="399 days" capacity="82%" verified />
      <VerifiedVaultCard name="JitoSOL Plus" manager="Gauntlet" tvl="$7.6M" apy="-0.51%" age="245 days" capacity="98%" verified almostFull />
      <VerifiedVaultCard name="Ace.Pro | Steady D01" manager="Ace.Pro" tvl="$21.1M" apy="12.77%" age="290 days" capacity="100%" verified full />
      <VerifiedVaultCard name="JLP Hedge Vault" manager="PrimeNumber" tvl="$11.7M" apy="26.45%" age="276 days" capacity="95%" verified almostFull />
    </>
  );
}

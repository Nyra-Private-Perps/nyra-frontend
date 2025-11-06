// src/components/Vaults/ClientVaultDetail.tsx
'use client';

import { VaultDetail } from './VaultDetail';

export function ClientVaultDetail({ vault }: { vault: any }) {
  return <VaultDetail {...vault} />;
}

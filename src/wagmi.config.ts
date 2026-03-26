/**
 * lib/wagmiConfig.tsx
 */
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { arbitrum } from 'wagmi/chains'
import { defineChain } from 'viem'

// 1. Define Horizen EON precisely
export const horizen = defineChain({
  id: 26514,
  name: 'Horizen Mainnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://horizen.calderachain.xyz/http'] },
  }, 
  blockExplorers: {
    default: { name: 'EonScan', url: 'https://horizen.calderaexplorer.xyz/' },
  },
})

// 2. Add it to the RainbowKit config
export const wagmiConfig = getDefaultConfig({
  appName: 'Nyra',
  projectId: '6eecd34abc14b01b287d8d1805508f17', 
  // CRITICAL: Both chains must be in this array
  chains: [arbitrum, horizen], 
  ssr: false,
})
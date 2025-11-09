// src/lib/wagmiConfig.ts
import { http, createConfig } from 'wagmi';
import { Chain, mainnet, sepolia } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from '@wagmi/connectors';

// --- 1. DEFINE THE HORIZEN GOBI TESTNET CHAIN ---
export const horizenGobi = {
  id: 2651420,
  name: 'Horizen Testnet',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://horizen-testnet.rpc.caldera.xyz/http'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Testnet Explorer',
      url: 'https://horizen-testnet.explorer.caldera.xyz/',
    },
  },
  testnet: true,
} as const satisfies Chain; // Use `satisfies Chain` for type safety

// --- YOUR PROJECT ID ---
export const projectId = 'YOUR_PROJECT_ID'; // <-- PASTE YOUR PROJECT ID HERE

if (!projectId) throw new Error('Project ID is not defined');

// --- 2. UPDATE THE WAGMI CONFIG ---
export const config = createConfig({
  // Add horizenGobi to the chains array
  chains: [mainnet, sepolia, horizenGobi],
  connectors: [
    injected(),
    walletConnect({ projectId, metadata: { name: 'Nyra', description: 'Nyra App', url: 'https://nyra.finance', icons:[] } }),
    coinbaseWallet({ appName: 'Nyra' }),
  ],
  transports: {
    // Add the transport for horizenGobi
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [horizenGobi.id]: http(),
  },
  ssr: true,
});
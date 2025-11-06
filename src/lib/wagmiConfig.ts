// src/lib/wagmiConfig.ts
import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from '@wagmi/connectors';

export const projectId = 'YOUR_PROJECT_ID'; // <-- PASTE YOUR PROJECT ID HERE

if (!projectId) throw new Error('Project ID is not defined');

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    walletConnect({ projectId, metadata: { name: 'Nyra', description: 'Nyra App', url: 'https://nyra.finance', icons:[] } }),
    coinbaseWallet({ appName: 'Nyra' }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});
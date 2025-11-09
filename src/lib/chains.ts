import { type Chain } from 'viem'

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
    public: {
      http: ['https://horizen-testnet.rpc.caldera.xyz/http'],
    }
  },
  blockExplorers: {
    default: {
      name: 'Testnet Explorer',
      url: 'https://horizen-testnet.explorer.caldera.xyz/',
    },
  },
  testnet: true,
} as const satisfies Chain;

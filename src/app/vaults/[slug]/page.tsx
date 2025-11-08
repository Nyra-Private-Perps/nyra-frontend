import { Header } from "@/components/Header/Header"
import { VaultDetail } from "@/components/Vaults/VaultDetail"
import { notFound } from "next/navigation"

// This data object's keys are used to generate the static pages.
// A URL like /vaults/eth-momentum-strategy will look for a key named "eth-momentum-strategy" here.
const vaultsData = {
  "eth-momentum-strategy": {
    name: "ETH Momentum Strategy",
    performance: "+35.2%",
    balance: "$1,450.78",
    userTotalBalance: "$12,842.50",
    userTotalGain: "+$1,203.15 (+10.3%)",
    apy: "42.8%",
    tvl: "$1.82M",
    managementFee: "2%",
    performanceFee: "20%",
    riskLevel: "Medium",
    strategy:
      "This vault employs a trend-following momentum strategy on Ethereum. It aims for capital appreciation by algorithmically identifying and capturing upward price movements. The strategy automatically rebalances positions to optimize risk-adjusted returns, leveraging both long positions in bullish markets and stablecoin holdings during downturns to preserve capital.",
  },
  "btc-yield-farm": {
    name: "BTC Yield Farm",
    performance: "+15.8%",
    balance: "$2,100.50",
    userTotalBalance: "$12,842.50",
    userTotalGain: "+$1,203.15 (+10.3%)",
    apy: "12.3%",
    tvl: "$25.1M",
    managementFee: "1%",
    performanceFee: "15%",
    riskLevel: "Low",
    strategy: "A yield farming strategy focused on Bitcoin-based DeFi protocols to generate stable returns.",
  },
  "stablecoin-growth": {
    name: "Stablecoin Growth",
    performance: "+8.1%",
    balance: "$5,500.00",
    userTotalBalance: "$12,842.50",
    userTotalGain: "+$1,203.15 (+10.3%)",
    apy: "8.1%",
    tvl: "$50.8M",
    managementFee: "0.5%",
    performanceFee: "10%",
    riskLevel: "Low",
    strategy: "A low-risk strategy that utilizes stablecoin lending and liquidity provision to generate consistent, low-volatility growth.",
  },
  "defi-blue-chip": {
    name: "DeFi Blue Chip",
    performance: "+28.4%",
    balance: "$850.20",
    userTotalBalance: "$12,842.50",
    userTotalGain: "+$1,203.15 (+10.3%)",
    apy: "22.7%",
    tvl: "$8.2M",
    managementFee: "2%",
    performanceFee: "20%",
    riskLevel: "High",
    strategy: "Invests in a diversified portfolio of established, high-quality DeFi tokens (Blue Chips) to capture broad market growth.",
  },
  "sol-ecosystem": {
    name: "SOL Ecosystem",
    performance: "+45.1%",
    balance: "$1,980.90",
    userTotalBalance: "$12,842.50",
    userTotalGain: "+$1,203.15 (+10.3%)",
    apy: "35.2%",
    tvl: "$5.8M",
    managementFee: "2.5%",
    performanceFee: "25%",
    riskLevel: "High",
    strategy: "A high-growth strategy focused on promising new projects and protocols within the Solana ecosystem.",
  },
  "avax-rush": {
    name: "AVAX Rush",
    performance: "+25.5%",
    balance: "$1,120.00",
    userTotalBalance: "$12,842.50",
    userTotalGain: "+$1,203.15 (+10.3%)",
    apy: "19.8%",
    tvl: "$9.9M",
    managementFee: "2%",
    performanceFee: "20%",
    riskLevel: "Medium",
    strategy: "A momentum strategy designed to capitalize on the rapid growth and developments within the Avalanche ecosystem.",
  },
} as const // Using 'as const' is good practice here

// This function tells Next.js which pages to pre-build based on the keys of our data object.
export async function generateStaticParams() {
  return Object.keys(vaultsData).map((slug) => ({ slug }))
}

export default async function VaultPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const vault = vaultsData[slug as keyof typeof vaultsData]

  if (!vault) notFound()

  return (
    <div className="bg-[var(--background)] min-h-screen text-white">
      <Header />
      <main className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <VaultDetail vault={vault} />
        </div>
      </main>
    </div>
  )
}

"use client"

import { Header } from "@/components/Header/Header"
import { VaultCard } from "@/components/Vaults/VerifiedVaultCard" // Make sure path is correct
import { Search, ChevronDown } from "lucide-react"
import { motion } from "framer-motion" // 1. Import motion

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // Stagger the animation of children
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}
// Data now includes chartData again for the graphs
const vaults: {
  name: string;
  risk: "Low Risk" | "Medium Risk" | "High Risk";
  apy: string;
  tvl: string;
  slug: string;
  chartData: { v: number }[];
}[] = [
  {
    name: "ETH Momentum", risk: "Medium Risk", apy: "18.5%", tvl: "$12.5M", slug: "eth-momentum-strategy",
    chartData: [{ v: 10 }, { v: 50 }, { v: 40 }, { v: 80 }, { v: 70 }, { v: 95 }],
  },
  {
    name: "BTC Yield Farm", risk: "Low Risk", apy: "12.3%", tvl: "$25.1M", slug: "btc-yield-farm",
    chartData: [{ v: 10 }, { v: 20 }, { v: 35 }, { v: 30 }, { v: 50 }, { v: 60 }],
  },
  {
    name: "Stablecoin Growth", risk: "Low Risk", apy: "8.1%", tvl: "$59.8M", slug: "stablecoin-growth",
    chartData: [{ v: 10 }, { v: 15 }, { v: 25 }, { v: 40 }, { v: 55 }, { v: 70 }],
  },
  {
    name: "DeFi Blue Chip", risk: "High Risk", apy: "22.7%", tvl: "$8.2M", slug: "defi-blue-chip",
    chartData: [{ v: 60 }, { v: 40 }, { v: 80 }, { v: 50 }, { v: 90 }, { v: 70 }],
  },
  {
    name: "SOL Ecosystem", risk: "High Risk", apy: "35.2%", tvl: "$15.4M", slug: "sol-ecosystem",
    chartData: [{ v: 10 }, { v: 30 }, { v: 20 }, { v: 50 }, { v: 60 }, { v: 80 }],
  },
  {
    name: "AVAX Rush", risk: "Medium Risk", apy: "19.8%", tvl: "$6.7M", slug: "avax-rush",
    chartData: [{ v: 20 }, { v: 10 }, { v: 40 }, { v: 30 }, { v: 60 }, { v: 50 }],
  },
]

export default function VaultsPage() {
  return (
    <div>
      <Header />

      <main className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-12"
          >
            <h1 className="text-4xl font-semibold text-[var(--foreground)]">Strategy Vaults</h1>
            <p className="text-lg text-[var(--foreground-secondary)] mt-2">
              Discover automated strategies to grow your crypto portfolio.
            </p>
            </motion.div>

{/* Filters Animation */}
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
  className="flex flex-wrap items-center gap-4 mb-8"
>
            <div className="relative flex-grow sm:flex-grow-0 sm:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-secondary)]" />
              <input
                type="text"
                placeholder="Search vaults by name or asset..."
                className="w-full bg-[var(--secondary-light)] shadow-[var(--shadow-card)] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-0 placeholder:text-[var(--foreground-secondary)]/80 text-md rounded-lg pl-11 pr-4 py-3"
              />
            </div>
            <div className="flex items-center gap-4">
              {["Asset: All", "Risk: All", "Sort by: APY"].map((label) => (
                <button
                  key={label}
                  className="flex items-center justify-between w-40 bg-[var(--secondary-light)] shadow-[var(--shadow-card)] px-4 py-3 rounded-lg text-md font-medium text-[var(--foreground-secondary)] border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
                >
                  <span>{label}</span> <ChevronDown className="w-4 h-4" />
                </button>
              ))}
            </div>
            </motion.div>

          {/* Vaults Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {vaults.map((vault) => (
              <VaultCard key={vault.name} {...vault} />
            ))}
           </motion.div>
        </div>
      </main>
      
      <footer className="w-full py-6 mt-12">
        <div className="max-w-7xl mx-auto text-center text-[var(--foreground-secondary)]/80 text-md">
            © 2024 Nyra. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

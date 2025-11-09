"use client"

import { Header } from "@/components/Header/Header"
import { VaultCard } from "@/components/Vaults/VerifiedVaultCard"
import { Search } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect, useMemo } from "react"
import { getRealPerpVaults } from '@/lib/hyperliquid' // ← FIXED PATH

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

type Vault = {
  id: string;                    // ADDED
  name: string;
  risk: string;
  apy: string;
  tvl: string;
  slug: string;
  chain: string;
  chartData: { v: number }[];
};

const ITEMS_PER_PAGE = 9;

export default function VaultsPage() {
  const [vaults, setVaults] = useState<Vault[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [riskFilter, setRiskFilter] = useState<"All" | "Low Risk" | "Medium Risk" | "High Risk">("All")
  const [assetFilter, setAssetFilter] = useState("All")
  const [sortBy, setSortBy] = useState<"APY" | "TVL">("APY")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    getRealPerpVaults().then(data => {
      setVaults(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filteredAndSorted = useMemo(() => {
    let filtered = vaults

    if (search) {
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (riskFilter !== "All") {
      filtered = filtered.filter(v => v.risk === riskFilter)
    }

    if (assetFilter !== "All") {
      filtered = filtered.filter(v => v.chain === assetFilter)
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === "APY") {
        return parseFloat(b.apy) - parseFloat(a.apy)
      }
      return parseFloat(b.tvl.replace(/[^0-9.-]/g, '')) - parseFloat(a.tvl.replace(/[^0-9.-]/g, ''))
    })
  }, [vaults, search, riskFilter, assetFilter, sortBy])

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE)
  const paginatedVaults = filteredAndSorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const uniqueChains = [...new Set(vaults.map(v => v.chain).filter(Boolean))]

  // Fix page if out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-2xl text-foreground">Loading live vaults...</div>
      </div>
    )
  }

  return (
    <div>
      <Header />

      <main className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h1 className="text-4xl font-semibold text-[var(--foreground)]">Strategy Vaults</h1>
            <p className="text-lg text-[var(--foreground-secondary)] mt-2">
              {filteredAndSorted.length} unique live vaults • Real APY • On-chain TVL
            </p>
          </motion.div>

          <motion.div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="relative flex-grow sm:flex-grow-0 sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-secondary)]" />
              <input
                type="text"
                placeholder="Search vaults..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full bg-[var(--secondary-light)] border border-[var(--border)] focus:border-[var(--primary)] rounded-lg pl-12 pr-4 py-3 text-md"
              />
            </div>

            <select value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value as any); setCurrentPage(1) }} className="px-5 py-3 bg-[var(--secondary-light)] border border-[var(--border)] rounded-lg text-md font-medium">
              <option>All Risks</option>
              <option>Low Risk</option>
              <option>Medium Risk</option>
              <option>High Risk</option>
            </select>

            <select value={assetFilter} onChange={(e) => { setAssetFilter(e.target.value); setCurrentPage(1) }} className="px-5 py-3 bg-[var(--secondary-light)] border border-[var(--border)] rounded-lg text-md font-medium">
              <option value="All">All Chains</option>
              {uniqueChains.map(chain => (
                <option key={chain} value={chain}>{chain}</option>
              ))}
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-5 py-3 bg-[var(--secondary-light)] border border-[var(--border)] rounded-lg text-md font-medium">
              <option value="APY">Sort by APY</option>
              <option value="TVL">Sort by TVL</option>
            </select>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 grid-auto-rows: 1fr"
          >
            {paginatedVaults.map((vault) => (
              <VaultCard
                key={vault.id}           // 100% UNIQUE — NO MORE WARNINGS
                {...vault}
              />
            ))}
          </motion.div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-3 mt-12">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-6 py-3 bg-[var(--secondary-light)] rounded-lg disabled:opacity-50 font-medium"
              >
                Previous
              </button>

              <span className="text-lg font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-6 py-3 bg-[var(--secondary-light)] rounded-lg disabled:opacity-50 font-medium"
              >
                Next
              </button>
            </div>
          )}

          {paginatedVaults.length === 0 && (
            <div className="text-center py-20 text-xl text-[var(--foreground-secondary)]">
              No vaults found.
            </div>
          )}
        </div>
      </main>

      <footer className="w-full py-6 mt-12 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto text-center text-[var(--foreground-secondary)]/70 text-sm">
          © 2025 Nyra • Private Perpetual Vaults • Data from DefiLlama
        </div>
      </footer>
    </div>
  )
}
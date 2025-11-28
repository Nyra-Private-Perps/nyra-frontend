"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { VaultCard } from "@/components/Vaults/VerifiedVaultCard";
import type { VaultData } from "@/lib/hyperliquid";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const ITEMS_PER_PAGE = 9;

export function VaultsClient({ initialVaults }: { initialVaults: VaultData[] }) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("All");
  const [assetFilter, setAssetFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"APY" | "TVL">("TVL"); // Default to TVL for credibility
  const [currentPage, setCurrentPage] = useState(1);

  const uniqueChains = useMemo(() => 
    [...new Set(initialVaults.map((v) => v.chain).filter(Boolean))], 
  [initialVaults]);

  const filteredAndSorted = useMemo(() => {
    let filtered = initialVaults;

    if (search) {
      filtered = filtered.filter((v) =>
        v.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (riskFilter !== "All") {
      filtered = filtered.filter((v) => v.risk === riskFilter);
    }

    if (assetFilter !== "All") {
      filtered = filtered.filter((v) => v.chain === assetFilter);
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === "APY") {
        return b.apyRaw - a.apyRaw;
      }
      return b.tvlUsd - a.tvlUsd;
    });
  }, [initialVaults, search, riskFilter, assetFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const paginatedVaults = filteredAndSorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-5xl font-semibold text-[var(--foreground)]">
          Strategy Vaults
        </h1>
        <p className="text-lg text-[var(--foreground-secondary)] mt-2">
          {initialVaults.length} unique live vaults • Real APY • On-chain TVL
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="relative flex-grow sm:flex-grow-0 sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-secondary)]" />
          <input
            type="text"
            placeholder="Search vaults..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[var(--secondary-light)] border border-[var(--border)] focus:border-[var(--primary)] rounded-lg pl-12 pr-4 py-3 text-md outline-none"
          />
        </div>

        <select
          value={riskFilter}
          onChange={(e) => {
            setRiskFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-5 py-3 bg-[var(--secondary-light)] border border-[var(--border)] rounded-lg text-md font-medium outline-none cursor-pointer"
        >
          <option value="All">All Risks</option>
          <option value="Low Risk">Low Risk</option>
          <option value="Medium Risk">Medium Risk</option>
          <option value="High Risk">High Risk</option>
        </select>

        <select
          value={assetFilter}
          onChange={(e) => {
            setAssetFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-5 py-3 bg-[var(--secondary-light)] border border-[var(--border)] rounded-lg text-md font-medium outline-none cursor-pointer"
        >
          <option value="All">All Chains</option>
          {uniqueChains.map((chain) => (
            <option key={chain} value={chain}>
              {chain}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-5 py-3 bg-[var(--secondary-light)] border border-[var(--border)] rounded-lg text-md font-medium outline-none cursor-pointer"
        >
          <option value="TVL">Sort by TVL</option>
          <option value="APY">Sort by APY</option>
        </select>
      </motion.div>

      {/* Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 grid-auto-rows: 1fr"
      >
        {paginatedVaults.map((vault) => (
          <VaultCard key={vault.id} {...vault} />
        ))}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-12">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-6 py-3 bg-[var(--secondary-light)] rounded-lg disabled:opacity-50 font-medium hover:bg-[var(--border)] transition-colors"
          >
            Previous
          </button>

          <span className="text-lg font-medium flex items-center">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-6 py-3 bg-[var(--secondary-light)] rounded-lg disabled:opacity-50 font-medium hover:bg-[var(--border)] transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {paginatedVaults.length === 0 && (
        <div className="text-center py-20 text-xl text-[var(--foreground-secondary)]">
          No vaults found matching your criteria.
        </div>
      )}
    </div>
  );
}

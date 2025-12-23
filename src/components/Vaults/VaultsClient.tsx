import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { VaultCard } from "./VerifiedVaultCard";
import type { VaultData } from "../../lib/hyperliquid";

// Staggered animation for the list
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const ITEMS_PER_PAGE = 9;

export function VaultsClient({ initialVaults }: { initialVaults: VaultData[] }) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("All");
  const [assetFilter, setAssetFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"APY" | "TVL">("TVL");
  const [currentPage, setCurrentPage] = useState(1);

  const uniqueChains = useMemo(() => 
    [...new Set(initialVaults.map((v) => v.chain).filter(Boolean))], 
  [initialVaults]);

  const filteredAndSorted = useMemo(() => {
    let filtered = initialVaults;
    if (search) filtered = filtered.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()));
    if (riskFilter !== "All") filtered = filtered.filter((v) => v.risk === riskFilter);
    if (assetFilter !== "All") filtered = filtered.filter((v) => v.chain === assetFilter);
    
    return [...filtered].sort((a, b) => {
      if (sortBy === "APY") return b.apyRaw - a.apyRaw;
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
        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8 }}
        className="mb-16 text-center lg:text-left"
      >
        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-4">
          <span className="text-white">Active</span>{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Strategies
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
          Access {initialVaults.length} verified institutional strategies. 
          Real-time APY. TEE-secured execution.
        </p>
      </motion.div>

      {/* Glassmorphic Filters Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="flex flex-col lg:flex-row items-center gap-4 mb-12 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md"
      >
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search strategies..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-black/40 border border-white/10 focus:border-blue-500/50 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-4 w-full lg:w-auto flex-grow justify-end">
          {[
             { val: riskFilter, set: setRiskFilter, opts: ["All", "Low Risk", "Medium Risk", "High Risk"], label: "Risk" },
             { val: assetFilter, set: setAssetFilter, opts: ["All", ...uniqueChains], label: "Chain" },
             { val: sortBy, set: setSortBy, opts: ["TVL", "APY"], label: "Sort" }
          ].map((filter, idx) => (
             <div key={idx} className="relative group">
                <select
                  value={filter.val}
                  onChange={(e) => { filter.set(e.target.value as any); setCurrentPage(1); }}
                  className="appearance-none bg-black/40 text-gray-300 border border-white/10 rounded-xl px-5 py-3 pr-10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {filter.opts.map(opt => (
                    <option key={opt} value={opt} className="bg-gray-900 text-gray-200">
                      {opt === "All" || opt === "TVL" || opt === "APY" ? 
                         (opt === "All" ? `All ${filter.label}s` : opt === "TVL" ? "Sort by TVL" : "Sort by APY") 
                         : opt}
                    </option>
                  ))}
                </select>
                <SlidersHorizontal className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
             </div>
          ))}
        </div>
      </motion.div>

      {/* Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr"
      >
        {paginatedVaults.map((vault) => (
          <VaultCard key={vault.id} {...vault} />
        ))}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-20">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl disabled:opacity-30 hover:bg-white/10 transition-all text-white font-medium"
          >
            Previous
          </button>
          <span className="px-4 py-3 text-gray-400 font-mono">
             {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl disabled:opacity-30 hover:bg-white/10 transition-all text-white font-medium"
          >
            Next
          </button>
        </div>
      )}

      {paginatedVaults.length === 0 && (
        <div className="text-center py-32">
          <div className="inline-block p-6 rounded-full bg-white/5 mb-4">
             <Search className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl text-white font-semibold">No vaults found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
}

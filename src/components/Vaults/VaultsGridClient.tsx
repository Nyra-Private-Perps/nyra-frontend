"use client"

import { useState, useMemo } from "react"
import { VaultCard } from "@/components/Vaults/VerifiedVaultCard"
import { Search, ChevronDown } from "lucide-react"
import { motion } from "framer-motion"

// Define the animation variants here
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

// Define the Vault type for this component's props
type Vault = {
  name: string;
  risk: "Low Risk" | "Medium Risk" | "High Risk";
  apy: string;
  tvl: string;
  slug: string;
  chartData: { v: number }[];
};

const ITEMS_PER_PAGE = 6;

export function VaultsGridClient({ initialVaults }: { initialVaults: Vault[] }) {
  // All state management is handled here
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<"All" | Vault['risk']>("All");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredVaults = useMemo(() => {
    let vaults = [...initialVaults];
    if (searchTerm) {
      vaults = vaults.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (riskFilter !== "All") {
      vaults = vaults.filter(v => v.risk === riskFilter);
    }
    return vaults;
  }, [initialVaults, searchTerm, riskFilter]);

  const totalPages = Math.ceil(filteredVaults.length / ITEMS_PER_PAGE);
  const paginatedVaults = filteredVaults.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      {/* All interactive JSX (filters, grid, pagination) lives here */}
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white shadow-[var(--shadow-card)] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-0 placeholder:text-[var(--foreground-secondary)]/80 text-sm rounded-lg pl-11 pr-4 py-3"
          />
        </div>
        {/* Add your other filter buttons here */}
      </motion.div>

      <motion.div
        key={currentPage}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {paginatedVaults.map((vault) => (
          <VaultCard key={vault.name} {...vault} />
        ))}
      </motion.div>
      
      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-2 mt-12">
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => handlePageChange(i + 1)}
            className={currentPage === i + 1 ? 'font-bold' : ''}
          >
            {i + 1}
          </button>
        ))}
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    </>
  );
}

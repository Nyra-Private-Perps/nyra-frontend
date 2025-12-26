"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Search, ChevronDown, Sparkles } from "lucide-react";
import { VaultCard } from "./VerifiedVaultCard";
import OutstandingBackground from "../UI/AnimatedGradientBackground";

export function VaultsClient({ initialVaults }: { initialVaults: any[] }) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All Vaults");

  const filtered = useMemo(() => {
    return initialVaults.filter(v => v.name.toLowerCase().includes(search.toLowerCase()));
  }, [initialVaults, search]);

  return (
    <div className="max-w-[1400px] mx-auto relative">
          <OutstandingBackground />
      {/* --- REFINED HEADLINE (Scaled Down & Badge Removed) --- */}
      <div className="text-center mb-16 pt-10">
        <h1 className="text-5xl md:text-[6.5rem] font-bold tracking-tighter leading-[0.85] text-gray-950 mb-10 overflow-hidden">
          <motion.span 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block"
          >
            Grow your
          </motion.span>
          <br />
          <motion.span 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-4"
          >
            Digital Assets.
          </motion.span>
        </h1>
      </div>

      {/* --- PILL SEARCH BAR (Centered & Glassy) --- */}
      <div className="max-w-5xl mx-auto mb-20 px-4">
        <div className="bg-white/70 border border-white backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.06)] rounded-[3rem] p-2.5 flex flex-col md:flex-row items-center gap-2">
           <div className="relative flex-grow w-full md:w-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search strategies..." 
                className="w-full bg-transparent pl-16 pr-8 py-5 outline-none text-lg font-light text-gray-900 placeholder-gray-400"
              />
           </div>
           
           <div className="flex flex-wrap justify-center md:justify-end gap-1 px-2 pb-2 md:pb-0">
              {["All Vaults", "Stable", "Blue Chip"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-500 overflow-hidden ${
                    activeTab === tab ? "text-white" : "text-gray-500 hover:text-indigo-600"
                  }`}
                >
                  <span className="relative z-10">{tab}</span>
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-gray-950 shadow-xl"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* --- GRID (Staggered Entrance) --- */}
      <LayoutGroup>
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence mode="popLayout">
            {filtered.map((vault, i) => (
              <motion.div
                key={vault.id}
                layout
                initial={{ opacity: 0, y: 40, rotateX: 10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
              >
                <VaultCard {...vault} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    </div>
  );
}
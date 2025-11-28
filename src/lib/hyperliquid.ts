// src/lib/hyperliquid.ts
import { unstable_cache } from "next/cache";

export type VaultData = {
  id: string;
  name: string;
  risk: string;
  apy: string;
  tvl: string;
  slug: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyRaw: number;
  chartData: { v: number }[];
};

// Cache the fetch for 1 hour (3600 seconds) to speed up page loads
export const getRealPerpVaults = unstable_cache(
  async (): Promise<VaultData[]> => {
    try {
      const res = await fetch("https://yields.llama.fi/pools", {
        next: { revalidate: 3600 }, // ISR: Revalidate every hour
      });

      if (!res.ok) throw new Error("API down");
      const { data } = await res.json();

      // Filter logic
      const perpVaults = data.filter((v: any) =>
        v.project?.toLowerCase().includes("hyperliquid") ||
        v.project?.toLowerCase().includes("gmx") ||
        v.project?.toLowerCase().includes("dydx") ||
        v.project?.toLowerCase().includes("drift") ||
        v.project?.toLowerCase().includes("synthetix")
      );

      const seen = new Set<string>();
      const result: VaultData[] = [];

      for (const v of perpVaults) {
        const symbol = v.symbol || "UNKNOWN";
        const project = v.project || "unknown";
        const name = `${symbol} ${project.toUpperCase()}`;
        
        // Deduplication
        if (seen.has(name)) continue;
        seen.add(name);

        const slug = `${project.toLowerCase()}-${symbol.toLowerCase()}`.replace(/[^a-z0-9]/g, "-");

        // Generate lightweight chart data (Simulation)
        // In a production TEE env, this would come from your secure enclave
        const chartData = Array.from({ length: 30 }, (_, i) => ({
          v: (v.apy || 0) + Math.sin(i * 0.3) * 20,
        }));

        result.push({
          id: v.pool || crypto.randomUUID(), // Use pool ID if available
          name,
          apy: `${(v.apy || 0).toFixed(1)}%`,
          tvl: v.tvlUsd >= 1_000_000
            ? `$${(v.tvlUsd / 1e6).toFixed(1)}M`
            : `$${(v.tvlUsd / 1e3).toFixed(1)}K`,
          risk: v.apy > 50 ? "High Risk" : v.apy > 20 ? "Medium Risk" : "Low Risk",
          slug,
          chain: v.chain || "Unknown",
          project,
          symbol,
          tvlUsd: v.tvlUsd,
          apyRaw: v.apy || 0,
          chartData,
        });
      }

      // Sort by TVL default to show best vaults first
      return result.sort((a, b) => b.tvlUsd - a.tvlUsd);
    } catch (error) {
      console.error("Failed to fetch vaults:", error);
      return [];
    }
  },
  ["perp-vaults"], 
  { revalidate: 3600 }
);

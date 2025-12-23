import { useQuery } from "@tanstack/react-query";

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

// 1. The pure data fetching function (No Next.js cache wrappers)
export const fetchRealPerpVaults = async (): Promise<VaultData[]> => {
  try {
    // Remove "next: { revalidate }" - that is Next.js specific
    const res = await fetch("https://yields.llama.fi/pools");

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
      const chartData = Array.from({ length: 30 }, (_, i) => ({
        v: (v.apy || 0) + Math.sin(i * 0.3) * 20,
      }));

      result.push({
        id: v.pool || crypto.randomUUID(),
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
};

// 2. A React Hook to replace "unstable_cache"
// This manages loading states and caches the data for 1 hour (staleTime)
export const useVaults = () => {
  return useQuery({
    queryKey: ["perp-vaults"],
    queryFn: fetchRealPerpVaults,
    staleTime: 1000 * 60 * 60, // 1 hour (replaces revalidate: 3600)
    refetchOnWindowFocus: false,
  });
};

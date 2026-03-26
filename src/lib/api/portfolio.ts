/**
 * lib/api/portfolio.ts
 *
 * Portfolio aggregation layer for multi-address Hyperliquid data.
 */

import { fetchHL } from "./hyperliquid";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface HLBalance {
  user: string;
  leverage: number;
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    availableMargin: string;
  };
}

export interface HLSettledBalance {
  coin: string;
  hold: string;
  total: string;
}

export interface HLUserState {
  crossMaintenanceMarginUsed: string;
  crossMarginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    availableMargin: string;
  };
  assetPositions: Array<{
    coin: string;
    leverage: {
      rawUsd: string;
      weight: string;
    };
    longCross: {
      maxLongUsd: string;
      maxShortUsd: string;
      positionUsd: string;
    };
    positionValue: string;
    szi: string;
    marginAccountId: number;
  }>;
  time: number;
  withdrawable: string;
}

export interface ProxyBalance {
  address: string;
  usdcBalance: string;
  accountValue: string;
  totalMarginUsed: string;
  availableMargin: string;
  positions: Array<{
    coin: string;
    szi: string;
    positionValue: string;
  }>;
}

export interface AggregatedPortfolio {
  proxies: ProxyBalance[];
  totals: {
    totalUSDC: string;
    totalAccountValue: string;
    totalMarginUsed: string;
    totalAvailableMargin: string;
    totalPositionValue: string;
    positionCount: number;
  };
  lastUpdated: number;
}

// ─────────────────────────────────────────────────────────────
// CORE FETCHING FUNCTIONS
// ─────────────────────────────────────────────────────────────

export async function fetchProxyUSDCBalance(address: string): Promise<string> {
  try {
    const balances = (await fetchHL<HLSettledBalance[]>("userSettledBalances", { user: address })) || [];
    const usdcBalance = balances.find((b) => b.coin === "USDC");
    return usdcBalance?.total || "0";
  } catch (error) {
    console.error(`[Portfolio] Failed to fetch USDC balance for ${address}:`, error);
    return "0";
  }
}

export async function fetchProxyState(address: string): Promise<HLUserState | null> {
  try {
    return await fetchHL<HLUserState>("clearinghouseState", { user: address });
  } catch (error) {
    console.error(`[Portfolio] Failed to fetch state for ${address}:`, error);
    return null;
  }
}

export async function fetchProxyOpenOrders(address: string): Promise<number> {
  try {
    const orders = await fetchHL<any[]>("openOrders", { user: address });
    return orders?.length || 0;
  } catch (error) {
    console.error(`[Portfolio] Failed to fetch open orders for ${address}:`, error);
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────
// AGGREGATION FUNCTIONS
// ─────────────────────────────────────────────────────────────

async function aggregateSingleProxy(address: string): Promise<ProxyBalance> {
  const [usdcBalance, state] = await Promise.all([
    fetchProxyUSDCBalance(address),
    fetchProxyState(address),
  ]);

  const positions = state?.assetPositions
    ?.filter((p) => p.szi !== "0")
    .map((p) => ({
      coin: p.coin,
      szi: p.szi,
      positionValue: p.positionValue,
    })) || [];

  return {
    address,
    usdcBalance,
    accountValue: state?.crossMarginSummary?.accountValue || "0",
    totalMarginUsed: state?.crossMarginSummary?.totalMarginUsed || "0",
    availableMargin: state?.crossMarginSummary?.availableMargin || "0",
    positions,
  };
}

export async function aggregatePortfolioData(
  addresses: string[]
): Promise<AggregatedPortfolio> {
  if (!addresses || addresses.length === 0) {
    return {
      proxies: [],
      totals: {
        totalUSDC: "0",
        totalAccountValue: "0",
        totalMarginUsed: "0",
        totalAvailableMargin: "0",
        totalPositionValue: "0",
        positionCount: 0,
      },
      lastUpdated: Date.now(),
    };
  }

  const proxies = await Promise.all(addresses.map((addr) => aggregateSingleProxy(addr)));

  let totalUSDC = 0n;
  let totalAccountValue = 0n;
  let totalMarginUsed = 0n;
  let totalAvailableMargin = 0n;
  let totalPositionValue = 0n;
  let positionCount = 0;

  proxies.forEach((proxy) => {
    try {
      totalUSDC += BigInt(proxy.usdcBalance || "0");
      totalAccountValue += BigInt(proxy.accountValue || "0");
      totalMarginUsed += BigInt(proxy.totalMarginUsed || "0");
      totalAvailableMargin += BigInt(proxy.availableMargin || "0");

      proxy.positions.forEach((pos) => {
        totalPositionValue += BigInt(pos.positionValue || "0");
        positionCount++;
      });
    } catch (e) {
      console.error(`[Portfolio] Error aggregating proxy ${proxy.address}:`, e);
    }
  });

  return {
    proxies,
    totals: {
      totalUSDC: totalUSDC.toString(),
      totalAccountValue: totalAccountValue.toString(),
      totalMarginUsed: totalMarginUsed.toString(),
      totalAvailableMargin: totalAvailableMargin.toString(),
      totalPositionValue: totalPositionValue.toString(),
      positionCount,
    },
    lastUpdated: Date.now(),
  };
}

// ─────────────────────────────────────────────────────────────
// FORMATTING UTILITIES
// ─────────────────────────────────────────────────────────────

export function formatUSD(value: string | number): string {
  try {
    const n = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(n)) return "$0.00";

    const divisor = n > 1000000 ? 1e18 : n > 1000 ? 1 : 1;
    const amount = n / divisor;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return "$0.00";
  }
}

export function formatNumber(value: string | number, decimals = 2): string {
  try {
    const n = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(n)) return "0.00";
    return n.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch {
    return "0.00";
  }
}

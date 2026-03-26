const INFO_URL = "https://api.hyperliquid.xyz/info";

/**
 * Generic fetcher for Hyperliquid Info API
 */
export async function fetchHL<T = any>(
  type: string, 
  payload: Record<string, any> = {}
): Promise<T> {
  try {
    const response = await fetch(INFO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...payload }),
    });
    if (!response.ok) throw new Error(`HL API error: ${response.status}`);
    return await response.json() as T;
  } catch (error) {
    console.error(`fetchHL failed [${type}]:`, error);
    throw error;
  }
}

// --- API IMPLEMENTATIONS ---

/** Get metadata for all coins (szDecimals, name, etc) */
export const getMeta = () => fetchHL("meta");

/** Get mid prices for all active assets */
export const getAllMids = () => fetchHL("allMids");

/** Get market data for a specific asset (L2 Book) */
export const getL2Book = (coin: string) => fetchHL("l2Book", { coin });

/** Get user's account summary (Margin, Leverage, Positions) */
export const getUserState = (user: string) => fetchHL("clearinghouseState", { user });

/** Get user's open orders */
export const getOpenOrders = (user: string) => fetchHL("openOrders", { user });

/** Get user's trade history (fills) */
export const getUserFills = (user: string) => fetchHL("userFills", { user });

/** Get funding history for a specific coin */
export const getFundingHistory = (coin: string, startTime?: number) => 
  fetchHL("fundingHistory", { coin, startTime });

/** Get user's USDC balance and transaction history */
export const getUserSettledBalances = (user: string) => fetchHL("userSettledBalances", { user });

// --- FORMATTERS ---
export const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const numFmt = (val: string | number): string => {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(n) ? "0.00" : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

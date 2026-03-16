const INFO_URL = "https://api.hyperliquid.xyz/info"; 
// Use https://api.hyperliquid-testnet.xyz/info for testnet

/**
 * Generic fetcher for Hyperliquid Info API
 * @param type The request type (e.g., "meta", "clearinghouseState", "allMids")
 * @param payload Additional parameters required for the specific request type
 */
export async function fetchHL<T = any>(
  type: string, 
  payload: Record<string, any> = {}
): Promise<T> {
  try {
    const response = await fetch(INFO_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ type, ...payload }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Hyperliquid API error: ${response.status}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`fetchHL failed [${type}]:`, error);
    throw error;
  }
}

/**
 * Standard USD Currency Formatter
 */
export const fmt: Intl.NumberFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/**
 * Optional: Helper to format plain numbers to 2 decimal places
 */
export const numFmt = (val: string | number): string => {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(n) ? "0.00" : n.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

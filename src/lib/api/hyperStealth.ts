/**
 * lib/hyperstealthApi.ts
 *
 * Consolidated client for HyperStealth Backend and Hyperliquid Info API.
 * Updated to support Wagmi/Reown signing.
 */

import { getAddress } from "viem";

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:3001";
const INFO_URL = "https://api.hyperliquid.xyz/info";

const DOMAIN = {
  name: "HyperStealth",
  version: "1",
  // Add chainId + verifyingContract if your backend includes them in verification
  // chainId: 42161,
  // verifyingContract: "0x0000000000000000000000000000000000000000", // or your contract
} as const;

/** 
 * Type helper for the Wagmi signTypedData function 
 * This matches the signature of signTypedDataAsync from useSignTypedData()
 */
export type SignTypedDataFn = (args: any) => Promise<`0x${string}`>;

/** 
 * Response for POST /withdraw-available 
 */
export interface WithdrawAvailableResponse { 
  success: boolean; 
  txHash?: string; 
  message?: string; 
}


// ─────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────

/** Generic POST for HyperStealth Backend */
async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    ),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error ?? data.message ?? `Backend error ${res.status}`);
  }
  return data as T;
}

/** Fetch from Hyperliquid Info API */
export async function fetchHL<T = any>(type: string, payload: Record<string, any> = {}): Promise<T> {
  const response = await fetch(INFO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...payload }, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    ),
  });
  if (!response.ok) throw new Error(`HL Info API error: ${response.status}`);
  return await response.json() as T;
}

// inside hyperstealthApi.ts

async function signWithWagmi(
  signer: SignTypedDataFn,
  types: any,
  primaryType: string,
  message: any
): Promise<string> {
  const { EIP712Domain, ...cleanTypes } = types;
  return await signer({
    domain: DOMAIN,           // { name: "HyperStealth", version: "1" }
    types: cleanTypes,                  // ← pass the original types (do not strip EIP712Domain)
    primaryType,
    message,
  });
}

/** Generic GET for HyperStealth Backend */
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `API error ${res.status}`);
  return data as T;
}

// ─────────────────────────────────────────────────────────────
// TYPES & STORAGE HELPERS (Unchanged)
// ─────────────────────────────────────────────────────────────
export const getStoredEOA = () => sessionStorage.getItem("nyra_eoa") ?? localStorage.getItem("nyra_eoa") ?? null;
export const getStoredStealthKey = () => sessionStorage.getItem("nyra_stealth_key") ?? localStorage.getItem("nyra_stealth_key") ?? null;
export const getStoredStealthAddress = () => sessionStorage.getItem("nyra_stealth_address") ?? localStorage.getItem("nyra_active_stealth") ?? null;

export interface HealthResponse { status: string; service: string; timestamp: string; centralWallet: string; }
export interface RegisterResponse { success: boolean; spendPubKey: string; viewPubKey: string; stealthAddresses: string[]; }
export interface GenerateAddressResponse { success: boolean; stealthAddress: string; }
export interface DeriveKeyResponse { success: boolean; stealthAddress: string; stealthPrivateKey: string; }
export interface StealthAddressEntry { address: string; createdAt: number; }
export interface StealthAddressesResponse { success: boolean; recipientAddress: string; stealthAddresses: StealthAddressEntry[]; count: number; }
export interface DepositResponse { success: boolean; txHash: string; }
export interface BalanceResponse { success: boolean; userAddress: string; stealthAddress: string; deposited: string; credited: string; available: string; }
export interface BridgeQuoteResponse { success: boolean; sourceChain: string; amount: string; minReceived: string; nativeFee: string; lzTokenFee: string; }
export interface SupportedChainsResponse {
  success: boolean;
  chains: Array<{ name: string; chainId: number; lzEid: number; stargatePool: string; token: string; tokenSymbol: string; decimals: number; }>;
  destination: string;
}
export interface DirectDepositResponse { success: boolean; txHash: string; deposited: string; }
export interface BridgeActionResponse { success: boolean; sourceChain: string; txHash: string; dstTxHash: string; lzStatus: string; deposited: string; }
export interface BridgeStatusResponse { success: boolean; txHash: string; dstTxHash: string; status: "PENDING" | "INFLIGHT" | "DELIVERED" | "FAILED"; }
export interface WithdrawResponse { success: boolean; txHash?: string; }
export interface MetricsResponse { totalEOAs: number; totalStealthAddresses: number; }

// ─────────────────────────────────────────────────────────────
// HYPERSTEALTH BACKEND API METHODS
// ─────────────────────────────────────────────────────────────

export const apiHealth = () => get<HealthResponse>("/health");
export const apiGetMetrics = () => get<MetricsResponse>("/metrics");

/** POST /register */
export async function apiRegister(eoaAddress: string, signer: SignTypedDataFn): Promise<RegisterResponse> {
  const cleanAddress = getAddress(eoaAddress);

  const signature = await signWithWagmi(
    signer,
    { 
      Register: [{ name: "signer", type: "address" }] 
    },
    "Register",
    { signer: cleanAddress }
  );

  return post<RegisterResponse>("/register", { 
    recipientAddress: cleanAddress, 
    signature 
  });
}

/** POST /generate-address */
export const apiGenerateAddress = (eoaAddress: string) => 
  post<GenerateAddressResponse>("/generate-address", { recipientAddress: getAddress(eoaAddress) });

/** POST /derive-key */
export async function apiDeriveKey(eoaAddress: string, stealthAddress: string, signer: SignTypedDataFn): Promise<DeriveKeyResponse> {
  const signature = await signWithWagmi(
    signer,
    { DeriveKey: [{ name: "recipientAddress", type: "address" }, { name: "stealthAddress", type: "address" }] },
    "DeriveKey",
    { recipientAddress: getAddress(eoaAddress), stealthAddress: getAddress(stealthAddress) }
  );
  return post<DeriveKeyResponse>("/derive-key", { recipientAddress: getAddress(eoaAddress), stealthAddress: getAddress(stealthAddress), signature });
}

/** POST /stealth-addresses */
export async function apiStealthAddresses(
  eoaAddress: string, 
  signer: SignTypedDataFn,
  page: number = 1,
  pageSize: number = 20
): Promise<StealthAddressesResponse> {
  const signature = await signWithWagmi(
    signer,
    { Register: [{ name: "signer", type: "address" }] },
    "Register",
    { signer: getAddress(eoaAddress) }
  );
  return post<StealthAddressesResponse>("/stealth-addresses", { 
    recipientAddress: getAddress(eoaAddress), 
    signature,
    page,
    pageSize
  });
}

/** Bridge USDC.e from arbitrary chain to Arbitrum */
export async function apiBridge(eoaAddress: string, amount: string, signer: SignTypedDataFn, sourceChain: string = "horizen"): Promise<BridgeActionResponse> {
  const signature = await signWithWagmi(
    signer,
    { Bridge: [{ name: "recipientAddress", type: "address" }, { name: "amount", type: "uint256" }] }, 
    "Bridge", 
    { recipientAddress: getAddress(eoaAddress), amount: BigInt(amount) }
  );
  return post<BridgeActionResponse>("/bridge", { recipientAddress: getAddress(eoaAddress), amount, sourceChain, signature });
}

/** Direct Deposit USDC from Arbitrum without Bridging */
export async function apiDirectDeposit(
  depositorAddress: string, 
  amount: string, 
  signer: SignTypedDataFn
): Promise<DirectDepositResponse> {
  const signature = await signWithWagmi(
    signer,
    { DirectDeposit: [{ name: "depositor", type: "address" }, { name: "amount", type: "uint256" }] },
    "DirectDeposit",
    { depositor: getAddress(depositorAddress), amount: BigInt(amount) }
  );
  return post<DirectDepositResponse>("/direct-deposit", { 
    depositorAddress: getAddress(depositorAddress), 
    amount,
    signature 
  });
}

/** POST /deposit */
export async function apiDeposit(
  eoaAddress: string,
  stealthAddress: string,
  amount: string,
  signer: SignTypedDataFn
): Promise<DepositResponse> {
  const signature = await signWithWagmi(
    signer,
    { Deposit: [{ name: "stealthAddress", type: "address" }, { name: "amount", type: "uint256" }] },
    "Deposit",
    { stealthAddress: getAddress(stealthAddress), amount: BigInt(amount) }
  );
  return post<DepositResponse>("/deposit", {
    recipientAddress: getAddress(eoaAddress),
    stealthAddress: getAddress(stealthAddress),
    amount,
    signature,
  });
}

export async function apiWithdrawAvailable(
  eoaAddress: string,      // The signer's address (recipientAddress)
  destination: string,     // The Arbitrum address to receive the USDC
  amount: string,          // USDC amount in 6 decimals (atomic string)
  signer: SignTypedDataFn  // Wagmi signTypedDataAsync
): Promise<WithdrawAvailableResponse> {
  
  const cleanEoa = getAddress(eoaAddress);
  const cleanDest = getAddress(destination);

  // 1. Generate EIP-712 Signature
  // Domain is already defined at the top of your file as { name: "HyperStealth", version: "1" }
  const signature = await signWithWagmi(
    signer,
    { 
      WithdrawAvailable: [
        { name: "destination", type: "address" },
        { name: "amount", type: "uint256" }
      ] 
    },
    "WithdrawAvailable",
    { 
      destination: cleanDest, 
      amount: BigInt(amount) 
    }
  );

  // 2. POST to the backend
  return post<WithdrawAvailableResponse>("/withdraw-available", {
    recipientAddress: cleanEoa,
    destination: cleanDest,
    amount,
    signature,
  });
}

/** POST /withdraw */
export async function apiWithdraw(
  eoaAddress: string,
  stealthAddress: string,
  destination: string,
  amount: string,
  signer: SignTypedDataFn
): Promise<WithdrawResponse> {
  const signature = await signWithWagmi(
    signer,
    { Withdraw: [
      { name: "stealthAddress", type: "address" },
      { name: "destination", type: "address" },
      { name: "amount", type: "uint256" },
    ] },
    "Withdraw",
    { stealthAddress: getAddress(stealthAddress), destination: getAddress(destination), amount: BigInt(amount) }
  );
  return post<WithdrawResponse>("/withdraw", {
    recipientAddress: getAddress(eoaAddress),
    stealthAddress: getAddress(stealthAddress),
    destination: getAddress(destination),
    amount,
    signature,
  });
}

// ─────────────────────────────────────────────────────────────
// REMAINING UTILS (Unchanged)
// ─────────────────────────────────────────────────────────────
export const apiGetBalance = (address: string) => get<BalanceResponse>(`/balance/${getAddress(address)}`);
export const apiGetSupportedChains = () => get<SupportedChainsResponse>("/supported-chains");
export const apiQuoteBridge = (amount: string, sourceChain: string = "horizen") => post<BridgeQuoteResponse>("/quote-bridge", { amount, sourceChain });
export const apiGetBridgeStatus = (txHash: string) => get<BridgeStatusResponse>(`/bridge-status/${txHash}`);

export const getHLMeta = () => fetchHL("meta");
export const getHLAllMids = () => fetchHL("allMids");
export const getHLUserState = (user: string) => fetchHL("clearinghouseState", { user: getAddress(user) });
export const getHLOpenOrders = (user: string) => fetchHL("openOrders", { user: getAddress(user) });
export const getHLUserFills = (user: string) => fetchHL("userFills", { user: getAddress(user) });

// 2. For Spot USDC (The actual USDC token in the Spot wallet)
export const getHLSpotState = (user: string) => 
  fetchHL("spotClearinghouseState", { user: getAddress(user) });

// 3. (Optional) If you really want settled balances history, 
// HL sometimes expects the address as a raw string without getAddress for this specific endpoint
export const getUserSettledBalances = (user: string) => 
  fetchHL("userSettledBalances", { user: user.toLowerCase() });

export const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const numFmt = (val: string | number): string => {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(n) ? "0.00" : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

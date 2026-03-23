/**
 * lib/hyperstealthApi.ts
 *
 * Consolidated client for HyperStealth Backend and Hyperliquid Info API.
 * All backend signing uses EIP-712 with domain { name: "HyperStealth", version: "1" }.
 */

import { createWalletClient, http, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:3001";
const INFO_URL = "https://api.hyperliquid.xyz/info";
const ARB_RPC = "https://arb1.arbitrum.io/rpc";
const EXCHANGE_URL = "https://api.hyperliquid.xyz/exchange";
const HL_DOMAIN = {
  name: "HyperliquidSignTransaction",
  version: "1",
  chainId: 42161,
  verifyingContract: "0x0000000000000000000000000000000000000000",
} as const;

const DOMAIN = {
  name: "HyperStealth",
  version: "1",
} as const;

const ERC20_ABI = [
  // Functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",

  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

// ─────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────

/** Generic POST for HyperStealth Backend */
// 1. Update the POST helper
async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // ADDED REPLACER HERE: (key, value) => ...
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

// 2. Update the fetchHL helper (just in case)
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

// 3. Update the signWithEOA helper (This is likely where the error triggers)
async function signWithEOA(types: any, primaryType: string, message: any): Promise<string> {
  if (!window.ethereum) throw new Error("No wallet detected");
  const accounts: string[] = await window.ethereum.request({ method: "eth_requestAccounts" });
  
  // ADDED REPLACER HERE for typedData
  const typedData = JSON.stringify({
    domain: DOMAIN,
    types: { EIP712Domain: [{ name: "name", type: "string" }, { name: "version", type: "string" }], ...types },
    primaryType,
    message,
  }, (key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );

  return await window.ethereum.request({ 
    method: "eth_signTypedData_v4", 
    params: [accounts[0], typedData] 
  });
}

/** Generic GET for HyperStealth Backend */
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `API error ${res.status}`);
  return data as T;
}

/** Sign with Stealth Private Key (No Popup) */
async function signWithStealthKey(
  stealthKey: string,
  types: Record<string, { name: string; type: string }[]>,
  primaryType: string,
  message: Record<string, unknown>
): Promise<string> {
  const account = privateKeyToAccount(
    stealthKey.startsWith("0x") ? (stealthKey as `0x${string}`) : (`0x${stealthKey}` as `0x${string}`)
  );
  const client = createWalletClient({ account, chain: arbitrum, transport: http(ARB_RPC) });
  return await client.signTypedData({
    domain: DOMAIN,
    types,
    primaryType,
    message: message as any,
  });
}

// ─────────────────────────────────────────────────────────────
// STORAGE HELPERS
// ─────────────────────────────────────────────────────────────

export const getStoredEOA = () => sessionStorage.getItem("nyra_eoa") ?? localStorage.getItem("nyra_eoa") ?? null;
export const getStoredStealthKey = () => sessionStorage.getItem("nyra_stealth_key") ?? localStorage.getItem("nyra_stealth_key") ?? null;
export const getStoredStealthAddress = () => sessionStorage.getItem("nyra_stealth_address") ?? localStorage.getItem("nyra_active_stealth") ?? null;

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface HealthResponse { status: string; service: string; timestamp: string; centralWallet: string; }
export interface RegisterResponse { success: boolean; spendPubKey: string; viewPubKey: string; stealthAddresses: string[]; }
export interface GenerateAddressResponse { success: boolean; stealthAddress: string; }
export interface DeriveKeyResponse { success: boolean; stealthAddress: string; stealthPrivateKey: string; }
export interface StealthAddressEntry { address: string; createdAt: number; }
export interface StealthAddressesResponse { success: boolean; recipientAddress: string; stealthAddresses: StealthAddressEntry[]; count: number; }
export interface DepositResponse { success: boolean; txHash: string; }
// Bridge & Balance Types
export interface BalanceResponse { success: boolean; userAddress: string; stealthAddress: string; deposited: string; credited: string; available: string; }
export interface BridgeQuoteResponse { success: boolean; amount: string; minReceived: string; nativeFee: string; lzTokenFee: string; }
export interface BridgeActionResponse { success: boolean; txHash: string; dstTxHash: string; lzStatus: string; deposited: string; }
export interface BridgeStatusResponse { success: boolean; txHash: string; dstTxHash: string; status: "PENDING" | "INFLIGHT" | "DELIVERED" | "FAILED"; }

// ─────────────────────────────────────────────────────────────
// HYPERSTEALTH BACKEND API METHODS
// ─────────────────────────────────────────────────────────────

/** GET /health */
export const apiHealth = () => get<HealthResponse>("/health");

/** POST /register */
export async function apiRegister(eoaAddress: string): Promise<RegisterResponse> {
  const signature = await signWithEOA(
    { Register: [{ name: "signer", type: "address" }] },
    "Register",
    { signer: getAddress(eoaAddress) }
  );
  return post<RegisterResponse>("/register", { recipientAddress: getAddress(eoaAddress), signature });
}

/** POST /generate-address */
export const apiGenerateAddress = (eoaAddress: string) => 
  post<GenerateAddressResponse>("/generate-address", { recipientAddress: getAddress(eoaAddress) });

/** POST /derive-key */
export async function apiDeriveKey(eoaAddress: string, stealthAddress: string): Promise<DeriveKeyResponse> {
  const signature = await signWithEOA(
    { DeriveKey: [{ name: "recipientAddress", type: "address" }, { name: "stealthAddress", type: "address" }] },
    "DeriveKey",
    { recipientAddress: getAddress(eoaAddress), stealthAddress: getAddress(stealthAddress) }
  );
  return post<DeriveKeyResponse>("/derive-key", { recipientAddress: getAddress(eoaAddress), stealthAddress: getAddress(stealthAddress), signature });
}

/** POST /stealth-addresses */
export async function apiStealthAddresses(eoaAddress: string): Promise<StealthAddressesResponse> {
  const signature = await signWithEOA(
    { Register: [{ name: "signer", type: "address" }] },
    "Register",
    { signer: getAddress(eoaAddress) }
  );
  return post<StealthAddressesResponse>("/stealth-addresses", { recipientAddress: getAddress(eoaAddress), signature });
}

// ─────────────────────────────────────────────────────────────
// BRIDGE & BALANCE API (Horizen/Manual Flow)
// ─────────────────────────────────────────────────────────────

/** Manually record a deposit (Admin/Internal) */
export const apiRecordDeposit = (userAddress: string, stealthAddress: string, amount: string) => 
  post<{ success: boolean }>("/record-deposit", { userAddress, stealthAddress, amount });

/** Check user balance on backend */
export const apiGetBalance = (address: string) => 
  get<BalanceResponse>(`/balance/${getAddress(address)}`);

/** Get quote for Horizen -> Arbitrum bridge */
export const apiQuoteBridge = (amount: string) => 
  post<BridgeQuoteResponse>("/quote-bridge", { amount });

/** Bridge USDC.e from Horizen to Arbitrum */
export async function apiBridge(eoaAddress: string, amount: string): Promise<BridgeActionResponse> {
  const signature = await signWithEOA(
    { Bridge: [{ name: "recipientAddress", type: "address" }, { name: "amount", type: "uint256" }] }, 
    "Bridge", 
    { recipientAddress: getAddress(eoaAddress), amount: BigInt(amount) }
  );
  return post<BridgeActionResponse>("/bridge", { recipientAddress: getAddress(eoaAddress), amount, signature });
}

/** Check status of a bridge transaction */
export const apiGetBridgeStatus = (txHash: string) => 
  get<BridgeStatusResponse>(`/bridge-status/${txHash}`);

/** POST /deposit (Signs with Stealth Key) */
export async function apiDeposit(
  eoaAddress: string,
  stealthAddress: string,
  amount: string,
  stealthKey: string
): Promise<DepositResponse> {
  const signature = await signWithStealthKey(
    stealthKey,
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

/** Withdraw (Bridge Out) - Signs Withdraw3 and posts to HL Directly */
export async function apiWithdraw(stealthKey: string, destination: string, amountHuman: string) {
  const account = privateKeyToAccount(stealthKey.startsWith("0x") ? (stealthKey as any) : `0x${stealthKey}`);
  const client = createWalletClient({ account, chain: arbitrum, transport: http(ARB_RPC) });
  const time = Date.now();

  const signature = await client.signTypedData({
    domain: HL_DOMAIN,
    types: { "Hyperliquid:Withdraw3": [{ name: "hyperliquidChain", type: "string" }, { name: "destination", type: "string" }, { name: "amount", type: "string" }, { name: "time", type: "uint64" }] },
    primaryType: "Hyperliquid:Withdraw3",
    message: { hyperliquidChain: "Mainnet", destination: destination.toLowerCase(), amount: amountHuman, time: BigInt(time) },
  });

  const raw = signature.slice(2);
  const body = {
    action: { type: "withdraw3", hyperliquidChain: "Mainnet", signatureChainId: "0xa4b1", destination: destination.toLowerCase(), amount: amountHuman, time },
    nonce: time,
    signature: { r: `0x${raw.slice(0, 64)}`, s: `0x${raw.slice(64, 128)}`, v: parseInt(raw.slice(128, 130), 16) },
  };

  const res = await fetch(EXCHANGE_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok || data.status === "err") throw new Error(data.response || data.error || "HL Withdrawal Failed");
  return data;
}


// ─────────────────────────────────────────────────────────────
// HYPERLIQUID INFO API METHODS (External)
// ─────────────────────────────────────────────────────────────

/** Get metadata for all coins */
export const getHLMeta = () => fetchHL("meta");

/** Get mid prices for all coins */
export const getHLAllMids = () => fetchHL("allMids");

/** Get user account summary (Positions, Margin) */
export const getHLUserState = (user: string) => fetchHL("clearinghouseState", { user: getAddress(user) });

/** Get user open orders */
export const getHLOpenOrders = (user: string) => fetchHL("openOrders", { user: getAddress(user) });

/** Get user fills/trade history */
export const getHLUserFills = (user: string) => fetchHL("userFills", { user: getAddress(user) });

// ─────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────

export const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const numFmt = (val: string | number): string => {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(n) ? "0.00" : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

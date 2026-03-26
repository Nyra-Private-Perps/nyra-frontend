"use client";

import { createWalletClient, http, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";
import type { IWeb3Wallet } from "@walletconnect/web3wallet";
import { ethers } from "ethers";
import {
  extractViewingPrivateKeyNode,
  generateEphemeralPrivateKey,
  generateKeysFromSignature,
  generateStealthAddresses,
  generateStealthPrivateKey,
} from "@fluidkey/stealth-account-kit";
import { KeyValueStorage } from "@walletconnect/keyvaluestorage";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const RPC_URL = "https://arb1.arbitrum.io/rpc";
const CHAIN_ID = 42161;
const WC_PROJECT_ID = "6eecd34abc14b01b287d8d1805508f17";
const SIGN_MESSAGE = "CREATE_PROXY_ADDRESS";

// ─────────────────────────────────────────────────────────────
// STEALTH ADDRESS GENERATION
// ─────────────────────────────────────────────────────────────

export interface StealthProxyResult {
  stealthPrivateKey: string;
  stealthAddress: string;
}

export async function generateStealthProxy(
  signer: ethers.Signer,
  nonce = 0
): Promise<StealthProxyResult> {
  const signature = (await signer.signMessage(SIGN_MESSAGE)) as `0x${string}`;
  const { spendingPrivateKey, viewingPrivateKey } = generateKeysFromSignature(signature);
  const spendingAccount = privateKeyToAccount(spendingPrivateKey);
  const viewingPrivateKeyNode = extractViewingPrivateKeyNode(viewingPrivateKey, 0);
  const { ephemeralPrivateKey } = generateEphemeralPrivateKey({
    viewingPrivateKeyNode,
    nonce: BigInt(nonce),
    chainId: CHAIN_ID,
  });
  const { stealthAddresses } = generateStealthAddresses({
    spendingPublicKeys: [spendingAccount.publicKey],
    ephemeralPrivateKey,
  });
  const stealthAddress = getAddress(stealthAddresses[0]);
  const { stealthPrivateKey } = await generateStealthPrivateKey({
    spendingPrivateKey,
    ephemeralPublicKey: privateKeyToAccount(ephemeralPrivateKey).publicKey,
  });
  return { stealthPrivateKey, stealthAddress };
}

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
export type PendingRequest = {
  method: string;
  topic: string;
  id: number;
  params: any;
};

// ─────────────────────────────────────────────────────────────
// PUB/SUB
// ─────────────────────────────────────────────────────────────
let pendingResolve: ((approved: boolean) => void) | null = null;
const listeners: Set<(req: PendingRequest | null) => void> = new Set();
let sessionProposalHandler: ((proposal: any) => Promise<void>) | null = null;

export function setSessionProposalHandler(fn: ((proposal: any) => Promise<void>) | null): void {
  sessionProposalHandler = fn;
}

export function onPendingRequest(cb: (req: PendingRequest | null) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function resolveRequest(approved: boolean): void {
  pendingResolve?.(approved);
  pendingResolve = null;
  notifyListeners(null);
}

function notifyListeners(req: PendingRequest | null): void {
  listeners.forEach((cb) => cb(req));
}

function waitForUserApproval(req: PendingRequest): Promise<boolean> {
  return new Promise((resolve) => {
    pendingResolve = resolve;
    notifyListeners(req);
  });
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function getStoredKeys(): { stealthKey: string; stealthAddress: string } | null {
  let stealthKey =
    sessionStorage.getItem("nyra_stealth_key") ??
    localStorage.getItem("nyra_stealth_key");
  let stealthAddress =
    sessionStorage.getItem("nyra_stealth_address") ??
    localStorage.getItem("nyra_active_stealth");

  if (!stealthKey || !stealthAddress) return null;
  if (!stealthKey.startsWith("0x")) stealthKey = `0x${stealthKey}`;
  return { stealthKey, stealthAddress: getAddress(stealthAddress) };
}

function ensure0x(hex: string): `0x${string}` {
  return hex.startsWith("0x") ? (hex as `0x${string}`) : `0x${hex}`;
}

// ─────────────────────────────────────────────────────────────
// WALLETCONNECT SINGLETON
//
// With createAppKit() removed from wagmiConfig.tsx, there is now exactly
// ONE WC Core in the page. The "No matching key" race is gone because
// there is no second Core to intercept and corrupt our relay envelopes.
//
// The singleton is kept alive across re-pairs (we only disconnect
// sessions, never destroy the Core) because:
//   - session_proposal and session_request listeners are registered once
//   - The Core's X25519 keypairs in IndexedDB remain valid for the life
//     of the page; pair() can be called multiple times safely
// ─────────────────────────────────────────────────────────────
let walletPromise: Promise<IWeb3Wallet> | null = null;

export async function getWeb3Wallet(): Promise<IWeb3Wallet> {
  if (walletPromise) return walletPromise;

  walletPromise = (async () => {
    const { Core } = await import("@walletconnect/core");
    const { Web3Wallet } = await import("@walletconnect/web3wallet");

    // CRITICAL: This is the ONLY way to stop the "No matching key" error.
    // It creates a separate database called 'nyra-terminal-v1' 
    // so it doesn't collide with RainbowKit.
    const core = new Core({
      projectId: WC_PROJECT_ID,
      storage: new KeyValueStorage({ 
        database: "nyra-terminal-v1" 
      }),
    });

    const wallet = await Web3Wallet.init({
      core: core as any,
      metadata: {
        name: "Nyra Stealth",
        description: "Private Trading",
        url: typeof window !== "undefined" ? window.location.origin : "https://nyra.app",
        icons: [],
      },
    });

    // ── IMPORTANT: Listeners MUST be attached immediately ──
    wallet.on("session_proposal", async (proposal) => {
      if (sessionProposalHandler) await sessionProposalHandler(proposal);
    });

    wallet.on("session_request", async (event) => {
      const { topic, id, params } = event;
      const { method } = params.request;

      console.log("[Stealth] Incoming Request:", method);

      const keys = getStoredKeys();
      if (!keys) {
        // ── CRITICAL: do NOT silently return ──
        // Notify the UI so it can show a "key not found" error instead of
        // leaving the user stuck on "Awaiting HL Auth" forever.
        console.error("[Stealth] ERROR: No stealth keys in storage — cannot sign. Check nyra_stealth_key in localStorage.");
        notifyListeners({ method, topic, id, params, missingKeys: true } as any);
        // Respond with error so HL doesn't hang waiting
        await wallet.respondSessionRequest({
          topic,
          response: { id, jsonrpc: "2.0", error: { code: 4001, message: "Stealth key not found in storage" } },
        });
        return;
      }

      // ── This triggers the 'Confirm & Sign' modal in App.tsx ──
      const approved = await new Promise<boolean>((resolve) => {
        pendingResolve = resolve;
        notifyListeners({ method, topic, id, params });
      });

      if (!approved) {
        return wallet.respondSessionRequest({
          topic,
          response: { id, jsonrpc: "2.0", error: { code: 4001, message: "User rejected" } },
        });
      }

      // Handle Signing
      try {
        if (method.includes("signTypedData")) {
            await handleSignTypedData(wallet, event, keys.stealthKey);
        } else if (method === "personal_sign" || method === "eth_sign") {
            await handlePersonalSign(wallet, event, keys.stealthKey);
        } else if (method === "eth_sendTransaction") {
            await handleSendTransaction(wallet, event, keys.stealthKey);
        }
      } catch (e: any) {
        console.error("Signing Error:", e);
        await wallet.respondSessionRequest({
          topic,
          response: { id, jsonrpc: "2.0", error: { code: 5000, message: e.message } },
        });
      }
    });

    return wallet;
  })();

  return walletPromise;
}

/**
 * Disconnects all live relay sessions then calls pair().
 * The singleton itself is kept alive — its IndexedDB keys remain valid.
 */
export async function prepareForPairing(): Promise<IWeb3Wallet> {
  const wallet = await getWeb3Wallet();

  const sessions = wallet.getActiveSessions();
  const topics   = Object.keys(sessions);
  if (topics.length > 0) {
    console.log("[Nyra] prepareForPairing — closing", topics.length, "session(s)");
    await Promise.all(
      topics.map((topic) =>
        wallet
          .disconnectSession({ topic, reason: { code: 6000, message: "Session replaced" } })
          .catch(() => {})
      )
    );
  }

  console.log("[Nyra] prepareForPairing — ready ✓");
  return wallet;
}

export async function disconnectAllSessions(): Promise<void> {
  if (!walletPromise) return;
  try {
    const wallet   = await walletPromise;
    const sessions = wallet.getActiveSessions();
    console.log("[Nyra] disconnectAllSessions — closing", Object.keys(sessions).length, "session(s)");
    await Promise.all(
      Object.keys(sessions).map((topic) =>
        wallet
          .disconnectSession({ topic, reason: { code: 6000, message: "Session replaced" } })
          .catch(() => {})
      )
    );
  } catch (e) {
    console.warn("[Nyra] disconnectAllSessions:", e);
  }
  console.log("[Nyra] disconnectAllSessions — complete");
}

// ─────────────────────────────────────────────────────────────
// HANDLERS
// ─────────────────────────────────────────────────────────────

async function handleSignTypedData(wallet: IWeb3Wallet, event: any, stealthKey: string): Promise<void> {
  const { topic, id, params } = event;
  try {
    const account = privateKeyToAccount(ensure0x(stealthKey));
    const client  = createWalletClient({ account, chain: arbitrum, transport: http(RPC_URL) });

    const rawParams: [string, string] = params.request.params;
    const typedDataRaw =
      typeof rawParams[0] === "string" && rawParams[0].startsWith("{") ? rawParams[0] : rawParams[1];

    const parsed                              = typeof typedDataRaw === "string" ? JSON.parse(typedDataRaw) : typedDataRaw;
    const { EIP712Domain: _removed, ...types } = parsed.types ?? {};

    const domain = {
      ...parsed.domain,
      chainId: parsed.domain.chainId ? Number(parsed.domain.chainId) : CHAIN_ID,
      ...(parsed.domain.verifyingContract
        ? { verifyingContract: getAddress(parsed.domain.verifyingContract) }
        : {}),
    };

    const signature = await client.signTypedData({
      domain,
      types,
      primaryType: parsed.primaryType,
      message:     lowercaseAddresses(parsed.message),
    });

    console.log("[Nyra] eth_signTypedData — signer:", account.address, "sig length:", signature.length);
    await wallet.respondSessionRequest({ topic, response: { id, jsonrpc: "2.0", result: signature } });
  } catch (e: any) {
    console.error("[Nyra] eth_signTypedData error:", e);
    await wallet.respondSessionRequest({
      topic,
      response: { id, jsonrpc: "2.0", error: { code: 5000, message: e.message } },
    });
  }
}

async function handlePersonalSign(wallet: IWeb3Wallet, event: any, stealthKey: string): Promise<void> {
  const { topic, id, params } = event;
  try {
    const account    = privateKeyToAccount(ensure0x(stealthKey));
    const client     = createWalletClient({ account, chain: arbitrum, transport: http(RPC_URL) });
    const rawParams: [string, string] = params.request.params;
    const method: string = params.request.method;
    const hexMessage = ensure0x(method === "eth_sign" ? rawParams[1] : rawParams[0]);

    let signature: string;
    try {
      const decoded     = Buffer.from(hexMessage.slice(2), "hex").toString("utf8");
      const isPrintable = /^[\x20-\x7E\n\r\t]*$/.test(decoded) && decoded.length > 0;
      signature = isPrintable
        ? await client.signMessage({ message: decoded })
        : await client.signMessage({ message: { raw: hexMessage as `0x${string}` } });
    } catch {
      signature = await client.signMessage({ message: { raw: hexMessage as `0x${string}` } });
    }

    console.log("[Nyra] personal_sign — signer:", account.address);
    await wallet.respondSessionRequest({ topic, response: { id, jsonrpc: "2.0", result: signature } });
  } catch (e: any) {
    console.error("[Nyra] personal_sign error:", e);
    await wallet.respondSessionRequest({
      topic,
      response: { id, jsonrpc: "2.0", error: { code: 5000, message: e.message } },
    });
  }
}

async function handleSendTransaction(wallet: IWeb3Wallet, event: any, stealthKey: string): Promise<void> {
  const { topic, id, params } = event;
  try {
    const txRequest = params.request.params[0];
    const account   = privateKeyToAccount(ensure0x(stealthKey));
    const client    = createWalletClient({ account, chain: arbitrum, transport: http(RPC_URL) });

    const txHash = await client.sendTransaction({
      to:    getAddress(txRequest.to),
      value: txRequest.value ? BigInt(txRequest.value) : 0n,
      data:  txRequest.data || "0x",
    });

    console.log("[Nyra] eth_sendTransaction hash:", txHash);
    await wallet.respondSessionRequest({ topic, response: { id, jsonrpc: "2.0", result: txHash } });
  } catch (e: any) {
    console.error("[Nyra] eth_sendTransaction error:", e);
    await wallet.respondSessionRequest({
      topic,
      response: { id, jsonrpc: "2.0", error: { code: 5000, message: e.message } },
    });
  }
}

function lowercaseAddresses(obj: any): any {
  if (typeof obj === "string")
    return /^0x[0-9a-fA-F]{40}$/.test(obj) ? obj.toLowerCase() : obj;
  if (Array.isArray(obj)) return obj.map(lowercaseAddresses);
  if (obj && typeof obj === "object")
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, lowercaseAddresses(v)]));
  return obj;
}

// ─────────────────────────────────────────────────────────────
// FULL RESET
// ─────────────────────────────────────────────────────────────
export async function resetWalletConnect(): Promise<void> {
  if (typeof window === "undefined") return;
  walletPromise = null;
  localStorage.removeItem("nyra_active_stealth");
  localStorage.removeItem("nyra_stealth_key");
  localStorage.removeItem("nyra_proxies");
  sessionStorage.removeItem("nyra_stealth_address");
  sessionStorage.removeItem("nyra_stealth_key");
  window.location.reload();
}

// Stub kept for any callers that still import this name
export async function purgeWalletConnectStorage(): Promise<void> {}

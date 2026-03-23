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

/**
 * Derives a stealth address + private key from a wallet signer.
 * nonce=0 → first address, nonce=1 → second, etc.
 * Pure key derivation — no on-chain tx, no Safe, no gas needed.
 */
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
// PUB/SUB — bridges WalletConnect events to React state
// ─────────────────────────────────────────────────────────────
let pendingResolve: ((approved: boolean) => void) | null = null;
const listeners: Set<(req: PendingRequest | null) => void> = new Set();

// Replaceable session_proposal handler — ConnectPage sets this before each pair().
// Stored here so it always fires on the singleton instance, not a recreated one.
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
// ─────────────────────────────────────────────────────────────
let walletPromise: Promise<IWeb3Wallet> | null = null;

async function purgeWalletConnectStorage(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const dbs = await Promise.race([
      window.indexedDB.databases(),
      new Promise<IDBDatabaseInfo[]>((res) => setTimeout(() => res([]), 1000)),
    ]);

    const wcDbs = dbs.filter(
      (db) =>
        db.name &&
        (db.name.includes("walletconnect") ||
          db.name.includes("WALLET_CONNECT") ||
          db.name.startsWith("wc@") ||
          db.name.startsWith("wc2"))
    );

    if (wcDbs.length === 0) {
      console.log("[Nyra] purge — no WC databases found");
      return;
    }

    await Promise.all(
      wcDbs.map(
        (db) =>
          new Promise<void>((res) => {
            const req = window.indexedDB.deleteDatabase(db.name!);
            req.onsuccess = () => res();
            req.onerror = () => res();
            req.onblocked = () => res();
          })
      )
    );
    console.log("[Nyra] purge — deleted", wcDbs.length, "WC database(s)");
  } catch (e) {
    console.warn("[Nyra] Could not purge WC IndexedDB:", e);
  }
}

export async function getWeb3Wallet(): Promise<IWeb3Wallet> {
  if (walletPromise) return walletPromise;

  walletPromise = (async () => {
    const { Core } = await import("@walletconnect/core");
    const { Web3Wallet } = await import("@walletconnect/web3wallet");

    const core = new Core({ projectId: WC_PROJECT_ID });
    const wallet = await Web3Wallet.init({
      core: core as any,
      metadata: {
        name: "Nyra Terminal",
        description: "Private Trading",
        url: typeof window !== "undefined" ? window.location.origin : "https://nyra.app",
        icons: [],
      },
    });

    // session_proposal: registered once, routes to replaceable handler set by ConnectPage
    wallet.on("session_proposal", async (proposal: any) => {
      if (sessionProposalHandler) {
        await sessionProposalHandler(proposal);
      } else {
        console.warn("[Nyra] session_proposal received but no handler registered — call setSessionProposalHandler() before pairing");
      }
    });

    // session_request: registered once, never in page components
    wallet.on("session_request", async (event: any) => {
      const { method } = event.params.request;
      const { topic, id, params } = event;

      const keys = getStoredKeys();
      if (!keys) {
        await wallet.respondSessionRequest({
          topic,
          response: {
            id,
            jsonrpc: "2.0",
            error: { code: 4100, message: "No stealth address found — create one first" },
          },
        });
        return;
      }

      const { stealthKey } = keys;
      const approved = await waitForUserApproval({ method, topic, id, params });

      if (!approved) {
        await wallet.respondSessionRequest({
          topic,
          response: {
            id,
            jsonrpc: "2.0",
            error: { code: 4001, message: "User rejected the request" },
          },
        });
        return;
      }

      switch (method) {
        case "eth_signTypedData":
        case "eth_signTypedData_v4":
          await handleSignTypedData(wallet, event, stealthKey);
          break;
        case "personal_sign":
        case "eth_sign":
          await handlePersonalSign(wallet, event, stealthKey);
          break;
        case "eth_sendTransaction":
          await handleSendTransaction(wallet, event, stealthKey);
          break;
        default:
          await wallet.respondSessionRequest({
            topic,
            response: {
              id,
              jsonrpc: "2.0",
              error: { code: 4200, message: `Unsupported method: ${method}` },
            },
          });
      }
    });

    return wallet;
  })();

  return walletPromise;
}

export async function disconnectAllSessions(): Promise<void> {
  // Close active sessions on the relay — fire-and-forget, no timeout needed.
  // We deliberately do NOT null walletPromise or purge IndexedDB.
  // The singleton must stay alive so session_proposal always fires on the
  // same instance that has the registered listener.
  // Destroying and recreating the singleton is what causes "No matching key".
  try {
    if (!walletPromise) return;
    const wallet = await Promise.race([
      walletPromise,
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 2000)),
    ]);
    const sessions = wallet.getActiveSessions();
    console.log("[Nyra] disconnectAllSessions — closing", Object.keys(sessions).length, "session(s)");
    Object.keys(sessions).forEach((topic) => {
      wallet.disconnectSession({ topic, reason: { code: 6000, message: "Session replaced" } })
        .catch(() => {});
    });
  } catch (e) {
    console.warn("[Nyra] disconnectAllSessions — wallet not reachable:", e);
  }
  console.log("[Nyra] disconnectAllSessions — complete");
}

// ─────────────────────────────────────────────────────────────
// HANDLERS
// ─────────────────────────────────────────────────────────────

async function handleSignTypedData(
  wallet: IWeb3Wallet,
  event: any,
  stealthKey: string
): Promise<void> {
  const { topic, id, params } = event;
  try {
    const account = privateKeyToAccount(ensure0x(stealthKey));
    const client = createWalletClient({ account, chain: arbitrum, transport: http(RPC_URL) });

    const rawParams: [string, string] = params.request.params;
    const typedDataRaw =
      typeof rawParams[0] === "string" && rawParams[0].startsWith("{")
        ? rawParams[0]
        : rawParams[1];

    const parsed = typeof typedDataRaw === "string" ? JSON.parse(typedDataRaw) : typedDataRaw;
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
      message: lowercaseAddresses(parsed.message),
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

async function handlePersonalSign(
  wallet: IWeb3Wallet,
  event: any,
  stealthKey: string
): Promise<void> {
  const { topic, id, params } = event;
  try {
    const account = privateKeyToAccount(ensure0x(stealthKey));
    const client = createWalletClient({ account, chain: arbitrum, transport: http(RPC_URL) });

    const rawParams: [string, string] = params.request.params;
    const method: string = params.request.method;
    let hexMessage = ensure0x(method === "eth_sign" ? rawParams[1] : rawParams[0]);

    let signature: string;
    try {
      const decoded = Buffer.from(hexMessage.slice(2), "hex").toString("utf8");
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

// Stealth address is an EOA — sends tx directly, no Safe needed.
// The stealth address needs ETH for gas (fund via relayer / CEX withdrawal).
async function handleSendTransaction(
  wallet: IWeb3Wallet,
  event: any,
  stealthKey: string
): Promise<void> {
  const { topic, id, params } = event;
  try {
    const txRequest = params.request.params[0];
    const account = privateKeyToAccount(ensure0x(stealthKey));
    const client = createWalletClient({ account, chain: arbitrum, transport: http(RPC_URL) });

    const txHash = await client.sendTransaction({
      to: getAddress(txRequest.to),
      value: txRequest.value ? BigInt(txRequest.value) : 0n,
      data: txRequest.data || "0x",
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
// RESET
// ─────────────────────────────────────────────────────────────
export async function resetWalletConnect(): Promise<void> {
  if (typeof window === "undefined") return;
  walletPromise = null;
  localStorage.removeItem("nyra_active_stealth");
  localStorage.removeItem("nyra_stealth_key");
  localStorage.removeItem("nyra_proxies");
  sessionStorage.removeItem("nyra_stealth_address");
  sessionStorage.removeItem("nyra_stealth_key");
  await purgeWalletConnectStorage();
  window.location.reload();
}

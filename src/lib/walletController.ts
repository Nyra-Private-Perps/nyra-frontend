"use client";

import { createWalletClient, http, getAddress, keccak256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import Safe from "@safe-global/protocol-kit";
import { OperationType } from "@safe-global/types-kit";
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
const RPC_URL = "https://sepolia-rollup.arbitrum.io/rpc";
const CHAIN_ID = 421614;
const WC_PROJECT_ID = "6eecd34abc14b01b287d8d1805508f17";
const FALLBACK_HANDLER = "0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5E4";
const SIGN_MESSAGE = "CREATE_PROXY_ADDRESS";

// ─────────────────────────────────────────────────────────────
// STEALTH PROXY GENERATION
// ─────────────────────────────────────────────────────────────

export interface StealthProxyResult {
  stealthPrivateKey: string;
  stealthAddress: string;
  safeAddress: string;
  protocolKit: Awaited<ReturnType<typeof Safe.init>>;
}

/**
 * Derives a stealth address + predicted Safe from a wallet signer.
 * The nonce controls which proxy account is created (0 = first, 1 = second, etc.)
 * No on-chain transaction is made here — the Safe is only predicted via CREATE2.
 */
export async function generateStealthProxy(
  signer: ethers.Signer,
  nonce = 0
): Promise<StealthProxyResult> {
  // 1. One signature is the seed for everything — no extra seed phrase needed
  const signature = (await signer.signMessage(SIGN_MESSAGE)) as `0x${string}`;

  // 2. Derive spending + viewing key pair from that signature
  const { spendingPrivateKey, viewingPrivateKey } = generateKeysFromSignature(signature);
  const spendingAccount = privateKeyToAccount(spendingPrivateKey);

  // 3. Generate a one-time ephemeral key (nonce makes each proxy unique)
  const viewingPrivateKeyNode = extractViewingPrivateKeyNode(viewingPrivateKey, 0);
  const { ephemeralPrivateKey } = generateEphemeralPrivateKey({
    viewingPrivateKeyNode,
    nonce: BigInt(nonce),
    chainId: CHAIN_ID,
  });

  // 4. Derive the stealth address (zero on-chain link to original wallet)
  const { stealthAddresses } = generateStealthAddresses({
    spendingPublicKeys: [spendingAccount.publicKey],
    ephemeralPrivateKey,
  });
  const stealthAddress = getAddress(stealthAddresses[0]);

  // 5. Reconstruct the private key that controls the stealth address
  const { stealthPrivateKey } = await generateStealthPrivateKey({
    spendingPrivateKey,
    ephemeralPublicKey: privateKeyToAccount(ephemeralPrivateKey).publicKey,
  });

  // 6. Predict the Safe address via CREATE2 (no deployment yet)
  //    Salt derived from stealth address so each proxy gets a unique Safe
  const salt = keccak256(stealthAddress as `0x${string}`);
  const predictedSafe = {
    safeAccountConfig: {
      owners: [stealthAddress],
      threshold: 1,
      fallbackHandler: FALLBACK_HANDLER,
    },
    safeDeploymentConfig: {
      safeVersion: "1.3.0" as const,
      saltNonce: salt,
    },
  };

  const protocolKit = await Safe.init({
    provider: RPC_URL,
    signer: stealthPrivateKey,
    predictedSafe,
  });

  const safeAddress = await protocolKit.getAddress();

  return { stealthPrivateKey, stealthAddress, safeAddress, protocolKit };
}

/**
 * Deploys the Safe on-chain if it isn't already deployed.
 * The user's signer (MetaMask) pays the gas — no relayer needed.
 * If the Safe is already deployed, this is a no-op.
 */
export async function deploySafeAccount(
  protocolKit: Awaited<ReturnType<typeof Safe.init>>,
  signer: ethers.Signer
): Promise<{ safeAddress: string }> {
  const safeAddress = await protocolKit.getAddress();

  // Check if already deployed — skip if so
  const code = await signer.provider!.getCode(safeAddress);
  if (code !== "0x") {
    console.log("[Nyra] Safe already deployed:", safeAddress);
    return { safeAddress };
  }

  const deployTx = await protocolKit.createSafeDeploymentTransaction();
  const feeData = await signer.provider!.getFeeData();

  const tx = await signer.sendTransaction({
    to: deployTx.to,
    value: deployTx.value ? BigInt(deployTx.value) : 0n,
    data: deployTx.data,
    // Bump gas slightly to avoid underpriced rejections
    maxFeePerGas: feeData.maxFeePerGas
      ? (feeData.maxFeePerGas * 150n) / 100n
      : undefined,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
      ? (feeData.maxPriorityFeePerGas * 120n) / 100n
      : undefined,
  });

  await tx.wait();
  console.log("[Nyra] Safe deployed:", safeAddress, "tx:", tx.hash);
  return { safeAddress };
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
// PUB/SUB — bridges WalletConnect events → React state
// ─────────────────────────────────────────────────────────────
let pendingResolve: ((approved: boolean) => void) | null = null;
const listeners: Set<(req: PendingRequest | null) => void> = new Set();

/** React components subscribe here. Returns an unsubscribe function. */
export function onPendingRequest(cb: (req: PendingRequest | null) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Called by the modal's Sign / Reject buttons. */
export function resolveRequest(approved: boolean): void {
  pendingResolve?.(approved);
  pendingResolve = null;
  notifyListeners(null); // clears the modal
}

function notifyListeners(req: PendingRequest | null): void {
  listeners.forEach((cb) => cb(req));
}

/** Pauses the session_request handler until the user decides in the modal. */
function waitForUserApproval(req: PendingRequest): Promise<boolean> {
  return new Promise((resolve) => {
    pendingResolve = resolve;
    notifyListeners(req); // pushes to React → modal appears
  });
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Reads stealth key + safe address from sessionStorage, falling back to localStorage. */
function getStoredKeys(): { stealthKey: string; safeAddress: string } | null {
  // Try sessionStorage first (set at proxy creation time)
  let stealthKey =
    sessionStorage.getItem("nyra_stealth_key") ?? localStorage.getItem("nyra_stealth_key");
  let safeAddress =
    sessionStorage.getItem("nyra_safe_address") ?? localStorage.getItem("nyra_active_safe");

  if (!stealthKey || !safeAddress) return null;

  // Ensure 0x prefix on stealth key
  if (!stealthKey.startsWith("0x")) stealthKey = `0x${stealthKey}`;

  return { stealthKey, safeAddress: getAddress(safeAddress) };
}

/** Ensures a hex string has 0x prefix. */
function ensure0x(hex: string): `0x${string}` {
  return hex.startsWith("0x") ? (hex as `0x${string}`) : `0x${hex}`;
}

// ─────────────────────────────────────────────────────────────
// SINGLETON — one Web3Wallet instance for the lifetime of the app
// ─────────────────────────────────────────────────────────────
let walletPromise: Promise<IWeb3Wallet> | null = null;

/**
 * Wipes all WalletConnect IndexedDB stores.
 * Called before each fresh init so stale session/pairing state from a previous
 * page load can't cause "No matching key" / "Pending session not found" errors.
 */
async function purgeWalletConnectStorage(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    // indexedDB.databases() can hang in some browsers — give it 1s max
    const dbs = await Promise.race([
      window.indexedDB.databases(),
      new Promise<IDBDatabaseInfo[]>((res) => setTimeout(() => res([]), 1000)),
    ]);

    const wcDbs = dbs.filter((db) =>
      db.name && (
        db.name.includes("walletconnect") ||
        db.name.includes("WALLET_CONNECT") ||
        db.name.startsWith("wc@") ||
        db.name.startsWith("wc2")
      )
    );

    if (wcDbs.length === 0) {
      console.log("[Nyra] purge — no WC databases found");
      return;
    }

    await Promise.all(
      wcDbs.map((db) =>
        new Promise<void>((res) => {
          const req = window.indexedDB.deleteDatabase(db.name!);
          req.onsuccess = () => res();
          req.onerror   = () => res(); // best-effort
          req.onblocked = () => res(); // don't wait if another tab has it open
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

    // Register session_request handler ONCE here in the singleton.
    // Do NOT register it again in any page component.
    wallet.on("session_request", async (event: any) => {
      const { method } = event.params.request;
      const { topic, id, params } = event;

      const keys = getStoredKeys();
      if (!keys) {
        console.error("[Nyra] No stealth key in storage — rejecting request");
        await wallet.respondSessionRequest({
          topic,
          response: {
            id,
            jsonrpc: "2.0",
            error: { code: 4100, message: "Wallet not initialised — create a proxy first" },
          },
        });
        return;
      }

      const { stealthKey, safeAddress } = keys;

      // ── Show approval modal and WAIT for user ──
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

      // ── Dispatch to correct handler ──
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
          await handleSendTransaction(wallet, event, stealthKey, safeAddress);
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

/**
 * Gracefully disconnects all active WalletConnect sessions, then resets the
 * singleton so the next getWeb3Wallet() call creates a fresh instance.
 * Call this from ConnectPage before pairing to guarantee a clean slate.
 */
export async function disconnectAllSessions(): Promise<void> {
  // Step 1: gracefully close any live sessions (2s timeout)
  try {
    if (walletPromise) {
      const wallet = await Promise.race([
        walletPromise,
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 2000)),
      ]);
      const sessions = wallet.getActiveSessions();
      console.log("[Nyra] disconnectAllSessions — active sessions:", Object.keys(sessions).length);
      // Fire-and-forget disconnects — don't await, just let them go
      Object.keys(sessions).forEach((topic) => {
        wallet.disconnectSession({
          topic,
          reason: { code: 6000, message: "Session replaced" },
        }).catch(() => {});
      });
    }
  } catch (e) {
    console.warn("[Nyra] disconnectAllSessions — could not get wallet:", e);
  }

  // Step 2: always null the singleton immediately (synchronous, can't hang)
  walletPromise = null;
  console.log("[Nyra] disconnectAllSessions — singleton nulled");

  // Step 3: purge IndexedDB with its own timeout so it can't block
  try {
    await Promise.race([
      purgeWalletConnectStorage(),
      new Promise<void>((res) => setTimeout(res, 3000)),
    ]);
  } catch (e) {
    console.warn("[Nyra] disconnectAllSessions — purge failed:", e);
  }

  console.log("[Nyra] disconnectAllSessions — complete");
}

// ─────────────────────────────────────────────────────────────
// HANDLER: eth_signTypedData / eth_signTypedData_v4 (Hyperliquid)
//
// HL does a plain off-chain ecrecover — it does NOT support EIP-1271.
// It expects a standard 65-byte (130 hex char) ECDSA signature.
// We sign with the stealth EOA private key and return the raw sig directly.
//
// The session exposes the STEALTH address (not the Safe) so that HL's
// ecrecover check returns the stealth address and it matches the session.
// See ConnectPage.tsx — session uses stealthAddress, not proxySafe.
//
// The verifyingContract in HL's domain is always the zero address —
// it must be checksummed (getAddress) or viem will reject it.
// ─────────────────────────────────────────────────────────────
async function handleSignTypedData(
  wallet: IWeb3Wallet,
  event: any,
  stealthKey: string
): Promise<void> {
  const { topic, id, params } = event;

  try {
    const account = privateKeyToAccount(ensure0x(stealthKey));
    const client = createWalletClient({
      account,
      chain: arbitrumSepolia,
      transport: http(RPC_URL),
    });

    // ── Parse typed data — handle both param orderings ──
    // Standard EIP-712: params[0] = address, params[1] = typedDataJson
    // Some dapps:       params[0] = typedDataJson, params[1] = address
    const rawParams: [string, string] = params.request.params;
    const typedDataRaw =
      typeof rawParams[0] === "string" && rawParams[0].startsWith("{")
        ? rawParams[0]
        : rawParams[1];

    const parsed =
      typeof typedDataRaw === "string" ? JSON.parse(typedDataRaw) : typedDataRaw;

    // Strip EIP712Domain — viem reconstructs it internally from the domain object
    const { EIP712Domain: _removed, ...types } = parsed.types ?? {};

    const domain = {
      ...parsed.domain,
      chainId: parsed.domain.chainId ? Number(parsed.domain.chainId) : CHAIN_ID,
      // verifyingContract must be checksummed — HL uses zero address which is valid
      ...(parsed.domain.verifyingContract
        ? { verifyingContract: getAddress(parsed.domain.verifyingContract) }
        : {}),
    };

    // Lowercase address fields in the message payload (HL requirement)
    const message = lowercaseAddresses(parsed.message);

    // Plain 65-byte ECDSA sig — what HL expects, no wrapping
    const signature = await client.signTypedData({
      domain,
      types,
      primaryType: parsed.primaryType,
      message,
    });

    console.log("[Nyra] eth_signTypedData — signer:", account.address);
    console.log("[Nyra] eth_signTypedData — sig length:", signature.length, "(expect 132)");

    await wallet.respondSessionRequest({
      topic,
      response: { id, jsonrpc: "2.0", result: signature },
    });
  } catch (e: any) {
    console.error("[Nyra] eth_signTypedData error:", e);
    await wallet.respondSessionRequest({
      topic,
      response: { id, jsonrpc: "2.0", error: { code: 5000, message: e.message } },
    });
  }
}

// ─────────────────────────────────────────────────────────────
// HANDLER: personal_sign / eth_sign
//
// personal_sign params order:  [hexEncodedMessage, address]
// eth_sign params order:       [address, hexEncodedMessage]
//
// Hyperliquid's "accept terms" flow uses personal_sign.
// The message arrives as hex-encoded UTF-8 bytes (e.g. 0x57656c636f6d65...).
// We decode it to a plain string and sign it so the EIP-191 prefix is applied
// consistently — matching what HL's backend reconstructs for ecrecover.
//
// IMPORTANT: HL verifies the recovered address against the address in the
// WalletConnect session (your Safe address). But personal_sign produces an
// ECDSA sig that recovers to the STEALTH address (the EOA signer), not the Safe.
// This is why you get 500 — address mismatch.
//
// THE FIX: Connect HL with the STEALTH address in the session namespace instead
// of the Safe address. The stealth EOA is the actual signer and ecrecover will
// match it perfectly. The Safe is only needed for on-chain transactions
// (eth_sendTransaction), not for off-chain signing.
//
// See ConnectPage.tsx — pass stealthAddress to the session, not proxySafe.
// ─────────────────────────────────────────────────────────────
async function handlePersonalSign(
  wallet: IWeb3Wallet,
  event: any,
  stealthKey: string
): Promise<void> {
  const { topic, id, params } = event;

  try {
    const account = privateKeyToAccount(ensure0x(stealthKey));
    const client = createWalletClient({
      account,
      chain: arbitrumSepolia,
      transport: http(RPC_URL),
    });

    const rawParams: [string, string] = params.request.params;
    const method: string = params.request.method;

    // personal_sign: params[0] = hex message, params[1] = address
    // eth_sign:      params[0] = address,     params[1] = hex message
    let hexMessage: string;
    if (method === "eth_sign") {
      hexMessage = rawParams[1];
    } else {
      hexMessage = rawParams[0];
    }

    hexMessage = ensure0x(hexMessage);

    // Decode hex → UTF-8. HL sends human-readable strings as hex bytes.
    // Signing the decoded string means the EIP-191 prefix wraps the right content.
    let signature: string;
    try {
      const decoded = Buffer.from(hexMessage.slice(2), "hex").toString("utf8");
      const isPrintable = /^[\x20-\x7E\n\r\t]*$/.test(decoded) && decoded.length > 0;

      if (isPrintable) {
        signature = await client.signMessage({ message: decoded });
      } else {
        signature = await client.signMessage({ message: { raw: hexMessage as `0x${string}` } });
      }
    } catch {
      signature = await client.signMessage({ message: { raw: hexMessage as `0x${string}` } });
    }

    console.log("[Nyra] personal_sign — signer:", account.address);
    console.log("[Nyra] personal_sign — signature:", signature);

    await wallet.respondSessionRequest({
      topic,
      response: { id, jsonrpc: "2.0", result: signature },
    });
  } catch (e: any) {
    console.error("[Nyra] personal_sign error:", e);
    await wallet.respondSessionRequest({
      topic,
      response: { id, jsonrpc: "2.0", error: { code: 5000, message: e.message } },
    });
  }
}

// ─────────────────────────────────────────────────────────────
// UTILITY: lowercase all address-shaped values in a typed data message
// HL docs: address fields must be lowercase before signing or ecrecover
// recovers a different address.
// ─────────────────────────────────────────────────────────────
function lowercaseAddresses(obj: any): any {
  if (typeof obj === "string") {
    // Ethereum address: 0x + 40 hex chars
    return /^0x[0-9a-fA-F]{40}$/.test(obj) ? obj.toLowerCase() : obj;
  }
  if (Array.isArray(obj)) return obj.map(lowercaseAddresses);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, lowercaseAddresses(v)])
    );
  }
  return obj;
}

// ─────────────────────────────────────────────────────────────
// HANDLER: eth_sendTransaction (direct execution, no relayer)
// ─────────────────────────────────────────────────────────────
async function handleSendTransaction(
  wallet: IWeb3Wallet,
  event: any,
  stealthKey: string,
  safeAddress: string
): Promise<void> {
  const { topic, id, params } = event;

  try {
    const txRequest = params.request.params[0];

    const protocolKit = await Safe.init({
      provider: RPC_URL,
      signer: ensure0x(stealthKey),
      safeAddress: getAddress(safeAddress),
    });

    const safeTransaction = await protocolKit.createTransaction({
      transactions: [
        {
          to: getAddress(txRequest.to),
          value: txRequest.value ? BigInt(txRequest.value).toString() : "0",
          data: txRequest.data || "0x",
          operation: OperationType.Call,
        },
      ],
    });

    const signedSafeTx = await protocolKit.signTransaction(safeTransaction);
    const result = await protocolKit.executeTransaction(signedSafeTx);

    const txHash = (result as any).hash ?? (result as any).transactionHash;
    console.log("[Nyra] eth_sendTransaction hash:", txHash);

    await wallet.respondSessionRequest({
      topic,
      response: { id, jsonrpc: "2.0", result: txHash },
    });
  } catch (e: any) {
    console.error("[Nyra] eth_sendTransaction error:", e);
    await wallet.respondSessionRequest({
      topic,
      response: { id, jsonrpc: "2.0", error: { code: 5000, message: e.message } },
    });
  }
}

// ─────────────────────────────────────────────────────────────
// RESET — clears all WalletConnect state and reloads
// ─────────────────────────────────────────────────────────────
export async function resetWalletConnect(): Promise<void> {
  if (typeof window === "undefined") return;

  walletPromise = null;

  localStorage.removeItem("nyra_active_safe");
  localStorage.removeItem("nyra_stealth_key");
  localStorage.removeItem("nyra_stealth_address");
  localStorage.removeItem("nyra_proxies");
  sessionStorage.removeItem("nyra_safe_address");
  sessionStorage.removeItem("nyra_stealth_key");
  sessionStorage.removeItem("nyra_stealth_address");

  await purgeWalletConnectStorage();
  window.location.reload();
}

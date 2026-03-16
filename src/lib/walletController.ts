"use client";
import { ethers } from "ethers";
import { createWalletClient, http, keccak256, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import Safe from "@safe-global/protocol-kit";
import { OperationType } from "@safe-global/types-kit";
import type { IWeb3Wallet } from "@walletconnect/web3wallet";
import {
  extractViewingPrivateKeyNode,
  generateEphemeralPrivateKey,
  generateKeysFromSignature,
  generateStealthAddresses,
  generateStealthPrivateKey,
} from "@fluidkey/stealth-account-kit";

const RPC_URL = "https://sepolia-rollup.arbitrum.io/rpc";
const FALLBACK_HANDLER = "0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5E4";
const SIGN_MESSAGE = "CREATE_PROXY_ADDRESS";

let walletPromise: Promise<IWeb3Wallet> | null = null;

// ============================================================
// 1. STEALTH ADDRESS + SAFE GENERATION
// ============================================================

export async function generateStealthProxy(signer: ethers.Signer, nonce = 0) {
  // Derive root seed
  const signature = (await signer.signMessage(SIGN_MESSAGE)) as `0x${string}`;

  // Derive keys
  const { spendingPrivateKey, viewingPrivateKey } = generateKeysFromSignature(signature);
  const spendingAccount = privateKeyToAccount(spendingPrivateKey);
  const spendingPublicKey = spendingAccount.publicKey;

  // Ephemeral key generation
  const viewingPrivateKeyNode = extractViewingPrivateKeyNode(viewingPrivateKey, 0);
  const { ephemeralPrivateKey } = generateEphemeralPrivateKey({
    viewingPrivateKeyNode,
    nonce: BigInt(nonce),
    chainId: 421614,
  });

  // Stealth Address derivation
  const { stealthAddresses } = generateStealthAddresses({
    spendingPublicKeys: [spendingPublicKey],
    ephemeralPrivateKey,
  });
  const stealthAddress = getAddress(stealthAddresses[0]);

  // Stealth Private Key (The actual owner of the Safe)
  const ephemeralPublicKey = privateKeyToAccount(ephemeralPrivateKey).publicKey;
  const { stealthPrivateKey } = await generateStealthPrivateKey({
    spendingPrivateKey,
    ephemeralPublicKey,
  });

  // Predict Safe address
  const salt = keccak256(stealthAddress as `0x${string}`);
  const predictedSafe = {
    safeAccountConfig: {
      owners: [stealthAddress],
      threshold: 1,
      fallbackHandler: FALLBACK_HANDLER,
    },
    safeDeploymentConfig: {
      safeVersion: "1.3.0" as any,
      saltNonce: salt,
    },
  };

  const protocolKit = await Safe.init({
    provider: RPC_URL,
    signer: stealthPrivateKey,
    predictedSafe,
  });

  const safeAddress = await protocolKit.getAddress();

  return {
    stealthPrivateKey,
    stealthAddress,
    safeAddress,
    salt,
    protocolKit,
    ephemeralPrivateKey,
    nonce,
  };
}

// ============================================================
// 2. SAFE DEPLOYMENT
// ============================================================

export async function deploySafeAccount(protocolKit: any, signer: ethers.Signer) {
  const safeAddress = await protocolKit.getAddress();
  const code = await signer.provider!.getCode(safeAddress);
  if (code !== "0x") return { safeAddress };

  const deployTx = await protocolKit.createSafeDeploymentTransaction();
  const feeData = await signer.provider!.getFeeData();
  
  const maxFeePerGas = feeData.maxFeePerGas ? (feeData.maxFeePerGas * 150n) / 100n : undefined;
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? (feeData.maxPriorityFeePerGas * 120n) / 100n : undefined;

  const tx = await signer.sendTransaction({
    to: deployTx.to,
    value: deployTx.value ? BigInt(deployTx.value) : 0n,
    data: deployTx.data,
    maxFeePerGas,
    maxPriorityFeePerGas,
  });

  await tx.wait();
  return { safeAddress };
}

// ============================================================
// 3. WALLETCONNECT INITIALIZATION
// ============================================================

export const getWeb3Wallet = async (): Promise<IWeb3Wallet> => {
  if (typeof window === "undefined") throw new Error("Client-side only");
  if (walletPromise) return walletPromise;

  walletPromise = (async () => {
    const { Core } = await import("@walletconnect/core");
    const { Web3Wallet } = await import("@walletconnect/web3wallet");

    const core = new Core({
      projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "6eecd34abc14b01b287d8d1805508f17",
    });

    const wallet = await Web3Wallet.init({
      core: core as any,
      metadata: {
        name: "Nyra Terminal",
        description: "Private Trading",
        url: window.location.origin,
        icons: [],
      },
    });

    wallet.on("session_request", async (event) => {
      const { method } = event.params.request;
      console.log("[WC] Request Method:", method);

      // CRITICAL: Must retrieve both from session storage
      const stealthKey = sessionStorage.getItem("nyra_stealth_key");
      const safeAddress = sessionStorage.getItem("nyra_safe_address");

      if (!stealthKey || !safeAddress) {
        console.error("[WC] Missing credentials in session storage");
        return;
      }

      // Small delay to ensure session is ready
      setTimeout(() => {
        switch (method) {
          case "eth_sendTransaction":
            handleSendTransaction(event, stealthKey, safeAddress);
            break;
          case "eth_signTypedData":
          case "eth_signTypedData_v4":
            handleSignTypedData(event, stealthKey);
            break;
          case "personal_sign":
            handlePersonalSign(event, stealthKey);
            break;
          default:
            console.warn("[WC] Unsupported method:", method);
        }
      }, 1000);
    });

    return wallet;
  })();

  return walletPromise;
};

// ============================================================
// 4A. eth_sendTransaction (Safe Execution)
// ============================================================

async function handleSendTransaction(event: any, stealthKey: string, safeAddress: string) {
  const wallet = await getWeb3Wallet();
  const { topic, id, params } = event;
  try {
    const txRequest = params.request.params[0];
    const protocolKit = await Safe.init({
      provider: RPC_URL,
      signer: stealthKey as `0x${string}`,
      safeAddress: safeAddress as `0x${string}`,
    });

    const safeTransaction = await protocolKit.createTransaction({
      transactions: [{
        to: txRequest.to,
        value: txRequest.value?.toString() || "0",
        data: txRequest.data || "0x",
        operation: OperationType.Call,
      }],
    });

    const signedSafeTx = await protocolKit.signTransaction(safeTransaction);
    
    // Execute directly (requires gas on the Stealth Address)
    const result = await protocolKit.executeTransaction(signedSafeTx);
    const txHash = (result as any)?.hash || (result as any)?.transactionHash;

    await wallet.respondSessionRequest({
      topic,
      response: { id, jsonrpc: "2.0", result: txHash },
    });
  } catch (e: any) {
    console.error("[WC] Transaction failed:", e);
    await wallet.respondSessionRequest({
      topic,
      response: { id, jsonrpc: "2.0", error: { code: 5000, message: e.message } },
    });
  }
}

// ============================================================
// 4B. eth_signTypedData (Hyperliquid Trading)
// ============================================================
// walletController.ts -> handleSignTypedData

async function handleSignTypedData(event: any, stealthKey: string) {
  const wallet = await getWeb3Wallet();
  const { topic, id, params } = event;
  if (!wallet.getActiveSessions()[topic]) return;

  const account = privateKeyToAccount(stealthKey as `0x${string}`);
  
  const client = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(RPC_URL),
  });

  try {
    const typedDataRaw = params.request.params[1];
    const parsed = typeof typedDataRaw === "string" ? JSON.parse(typedDataRaw) : typedDataRaw;

    // EXACT METHOD: Remove EIP712Domain
    const { EIP712Domain, ...types } = parsed.types;

    // Sign using the Stealth Key (the owner of the safe)
    const signature = await client.signTypedData({
      domain: parsed.domain,
      types: types,
      primaryType: parsed.primaryType,
      message: parsed.message,
    });

    console.log("[Nyra] Signature for Safe Account:", signature);

    await wallet.respondSessionRequest({
      topic,
      response: { 
        id, 
        jsonrpc: "2.0", 
        result: signature 
      },
    });
  } catch (e: any) {
    console.error("[Nyra] signTypedData failed:", e);
    await wallet.respondSessionRequest({
      topic,
      response: { id, jsonrpc: "2.0", error: { code: 5000, message: e.message } },
    });
  }
}

async function handlePersonalSign(event: any, stealthKey: string) {
  const wallet = await getWeb3Wallet();
  const { topic, id, params } = event;

  const account = privateKeyToAccount(stealthKey as `0x${string}`);
  const client = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(RPC_URL),
  });

  try {
    const signature = await client.signMessage({
      message: { raw: params.request.params[0] },
    });

    await wallet.respondSessionRequest({
      topic,
      response: { id, jsonrpc: "2.0", result: signature },
    });
  } catch (e: any) {
    await wallet.respondSessionRequest({
      topic,
      response: { id, jsonrpc: "2.0", error: { code: 5000, message: e.message } },
    });
  }
}
// ============================================================
// 5. RESET
// ============================================================

export const resetWalletConnect = async () => {
  localStorage.clear();
  sessionStorage.clear();
  const dbs = await window.indexedDB.databases();
  dbs.forEach((db) => db.name && window.indexedDB.deleteDatabase(db.name));
  window.location.reload();
};
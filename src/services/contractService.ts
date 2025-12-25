// src/services/contractService.ts

import { ethers, BrowserProvider, Contract, ContractTransactionResponse } from 'ethers';

// Extend the Window interface to include the ethereum property
declare global {
  interface Window {
    ethereum?: any;
  }
}
import { EventEmitter } from "eventemitter3";

// --- Configuration ---
const CONTRACT_ADDRESS = import.meta.env.VITE_PUBLIC_CONTRACT_ADDRESS || "";
const TOKEN_ADDRESS = import.meta.env.VITE_PUBLIC_TOKEN_ADDRESS || "";
console.log("Using Contract Address:", CONTRACT_ADDRESS);
// --- ABIs ---
const VAULT_ABI = [
  "function deposit(address token, uint256 amount) external",
  "function withdraw(uint256 amount) external" // Assuming withdraw takes amount, adjust if it takes shares
];

const FAUCET_ABI = [
  "function mint() external"
];

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

class ContractService {
  private emitter = new EventEmitter();

  // --- Event Management ---
  emit(event: string, ...args: any[]) {
    this.emitter.emit(event, ...args);
  }

  on(event: string, listener: (...args: any[]) => void) {
    this.emitter.on(event, listener);
  }

  off(event: string, listener: (...args: any[]) => void) {
    this.emitter.off(event, listener);
  }

  // --- Helper: Secure Signer Retrieval ---
  private async getSigner() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error("No crypto wallet found. Please install Metamask or a compatible wallet.");
    }

    // Validate Environment Variables
    if (!ethers.isAddress(TOKEN_ADDRESS)) {
      throw new Error("Invalid Token Contract Address defined in environment variables.");
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return signer;
  }

  // --- 1. Mint Token (Faucet) ---
  async mintToken(): Promise<string> {
    console.log("Minting token from faucet...",CONTRACT_ADDRESS);
    try {
      const signer = await this.getSigner();
      const faucetContract = new Contract(TOKEN_ADDRESS, FAUCET_ABI, signer);

      // Send Transaction
      const tx = await faucetContract.mint() as ContractTransactionResponse;
      const txHash = tx.hash;
      
      // Emit 'confirmed' immediately so UI shows "Mining..."
      this.emitter.emit("mintConfirmed", txHash);

      // Wait for block confirmation
      const receipt = await tx.wait();
      
      if (!receipt || receipt.status === 0) {
        throw new Error("Mint transaction reverted on-chain.");
      }

      return txHash;
    } catch (error: any) {
      console.error("Minting Error:", error);
      throw new Error(error.shortMessage || error.message || "Minting failed");
    }
  }

  // --- 2. Approve Token ---
  async approveToken(amount: string): Promise<string> {
    try {
      if (!ethers.isAddress(CONTRACT_ADDRESS)) {
        throw new Error("Invalid Vault Contract Address.");
      }
console.log("Approving",amount,"tokens for vault at",CONTRACT_ADDRESS,TOKEN_ADDRESS);
      const signer = await this.getSigner();
      const erc20 = new Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
      console.log("Token Decimals:",erc20);
      // Fetch decimals dynamically for precision
      const decimals = await erc20.decimals();
      console.log("Token Decimals:",decimals);
      const parsedAmount = ethers.parseUnits(amount, decimals);
      console.log("Approving",amount,"tokens for vault at",CONTRACT_ADDRESS,parsedAmount);
      const tx = await erc20.approve(CONTRACT_ADDRESS, parsedAmount) as ContractTransactionResponse;
      
      this.emitter.emit("approveConfirmed", tx.hash);
      
      const receipt = await tx.wait();
      
      if (!receipt || receipt.status === 0) {
        throw new Error("Approval transaction reverted.");
      }

      return tx.hash;
    } catch (error: any) {
      console.error("Approval Error:", error);
      throw new Error(error.shortMessage || error.message || "Approval failed");
    }
  }

  // --- 3. Deposit to Vault ---
  async depositAmount(amount: string): Promise<string> {
    try {
      const signer = await this.getSigner();
      
      // We need decimals again to ensure we deposit the exact approved amount
      const erc20 = new Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
      const decimals = await erc20.decimals();
      const parsedAmount = ethers.parseUnits(amount, decimals);

      const vaultContract = new Contract(CONTRACT_ADDRESS, VAULT_ABI, signer);

      // Check allowance first to prevent gas waste
      const allowance = await erc20.allowance(await signer.getAddress(), CONTRACT_ADDRESS);
      if (allowance < parsedAmount) {
        throw new Error("Insufficient allowance. Please approve tokens first.");
      }

      const tx = await vaultContract.deposit(TOKEN_ADDRESS, parsedAmount) as ContractTransactionResponse;
      
      this.emitter.emit("depositConfirmed", tx.hash);
      
      const receipt = await tx.wait();

      if (!receipt || receipt.status === 0) {
        throw new Error("Deposit transaction reverted.");
      }

      return tx.hash;
    } catch (error: any) {
      console.error("Deposit Error:", error);
      throw new Error(error.shortMessage || error.message || "Deposit failed");
    }
  }

  // --- 4. Withdraw from Vault ---
  async withdrawAmount(amount: string): Promise<string> {
    try {
      const signer = await this.getSigner();
      
      // Assuming withdraw takes raw units. 
      // If your vault uses 'shares' instead of token amounts, logic might differ slightly.
      const erc20 = new Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
      const decimals = await erc20.decimals();
      const parsedAmount = ethers.parseUnits(amount, decimals);

      const vaultContract = new Contract(CONTRACT_ADDRESS, VAULT_ABI, signer);

      const tx = await vaultContract.withdraw(parsedAmount) as ContractTransactionResponse;
      
      this.emitter.emit("withdrawConfirmed", tx.hash); // Added specific event for withdraw
      
      const receipt = await tx.wait();

      if (!receipt || receipt.status === 0) {
        throw new Error("Withdraw transaction reverted.");
      }

      return tx.hash;
    } catch (error: any) {
      console.error("Withdraw Error:", error);
      throw new Error(error.shortMessage || error.message || "Withdrawal failed");
    }
  }
}

export const contractService = new ContractService();

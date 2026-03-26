import {
    switchChain,
    writeContract,
    readContract,
    waitForTransactionReceipt,
  } from "@wagmi/core";
  import { erc20Abi, getAddress } from "viem";
  // Ensure this path correctly points to your RainbowKit/Wagmi setup
  import { wagmiConfig } from "../wagmi.config"; 
  
  export async function switchChainNetwork(chainId: number) {
    try {
      // We use wagmiConfig directly. 
      // The "as any" is required because Wagmi Configs are strictly typed 
      // to the chains defined in createConfig (e.g. 42161 | 26514).
      const result = await switchChain(wagmiConfig, { 
        chainId: chainId as any 
      });
      console.log(`[Network] Switched to ${chainId} ✓`);
      return result;
    } catch (err: any) {
      // If the error is "User rejected", we handle it gracefully
      if (err.code === 4001) throw new Error("User rejected network switch");
      
      console.error("Failed to switch chain:", err);
      throw err;
    }
  }
  
  /**
   * Standard ERC-20 Approval using Wagmi
   */
  export async function approveToken(tokenAddress: string, spender: string, amount: string) {
    try {
      const hash = await writeContract(wagmiConfig, {
        address: getAddress(tokenAddress),
        abi: erc20Abi,
        functionName: "approve",
        args: [getAddress(spender), BigInt(amount)],
      });
  
      console.log("[Approve] TX submitted:", hash);
  
      // waitForTransactionReceipt is much better than manual polling
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
      
      if (receipt.status === "reverted") throw new Error("Approval transaction reverted");
      console.log("[Approve] Mined ✓");
      return hash;
    } catch (err: any) {
      console.error("[Approve] Error:", err);
      throw err;
    }
  }
  
  /**
   * Read ERC-20 balanceOf
   */
  export async function getTokenBalance(tokenAddress: string, owner: string): Promise<string> {
    try {
      const result = await readContract(wagmiConfig, {
        address: getAddress(tokenAddress),
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [getAddress(owner)],
      });
  
      return result.toString();
    } catch (err) {
      console.error("[Balance] Error:", err);
      return "0";
    }
  }
  
  /**
   * Standard ERC-20 transfer
   */
  export async function transferToken(tokenAddress: string, to: string, amount: string) {
    try {
      const hash = await writeContract(wagmiConfig, {
        address: getAddress(tokenAddress),
        abi: erc20Abi,
        functionName: "transfer",
        args: [getAddress(to), BigInt(amount)],
      });
  
      console.log("[Transfer] TX submitted:", hash);
  
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
      if (receipt.status === "reverted") throw new Error("Transfer transaction reverted");
      
      console.log("[Transfer] Mined ✓");
      return hash;
    } catch (err: any) {
      console.error("[Transfer] Error:", err);
      throw err;
    }
  }

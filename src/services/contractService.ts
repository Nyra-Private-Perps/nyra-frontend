import { ethers } from 'ethers';
import { EventEmitter } from "eventemitter3";

const CONTRACT_ADDRESS=process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const TOKEN_ADDRESS=process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "";
const CONTRACT_ABI:any=[
  "function deposit(address token, uint256 amount) external"
]
const FAUCET_CONTRACT_ABI:any=[
  "function mint() external"
]
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
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

class ContractService {
  private emitter = new EventEmitter();

   // Emit an event
   emit(event: string, ...args: any[]) {
    this.emitter.emit(event, ...args);
  }

  // Listen for an event
  on(event: string, listener: (...args: any[]) => void) {
    this.emitter.on(event, listener);
  }

  // Remove listener
  off(event: string, listener: (...args: any[]) => void) {
    this.emitter.off(event, listener);
  }
  //Mint token
  async mintToken(
  ): Promise<string> {
    const provider = new ethers.BrowserProvider(window.ethereum);

    const signer = await provider.getSigner();
    if (!signer) {
      throw new Error("Signer required for campaign creation");
    }
  
    const faucetContract = new ethers.Contract(
      TOKEN_ADDRESS,
      FAUCET_CONTRACT_ABI,
      signer
    );
    const minttx = await faucetContract.mint();
     const txHash = minttx.hash;
      this.emitter.emit("mintConfirmed", txHash); // Emit event
    const mintreciept = await minttx.wait();
    console.log(mintreciept, "appreceipt");
    if(!mintreciept){
      throw new Error("Approval failed");
    }
    
   
    if (mintreciept) {
     
      return mintreciept;
    }

    throw new Error("Campaign creation failed - no event found");
  }
    

  //Approve deposit token
    async approveToken(
      amount: string
    ): Promise<string> {
      const provider = new ethers.BrowserProvider(window.ethereum);

      const signer = await provider.getSigner();
      if (!signer) {
        throw new Error("Signer required for campaign creation");
      }
    
      const erc20 = new ethers.Contract(
        TOKEN_ADDRESS,
        ERC20_ABI,
        signer
      );
      const apprtx = await erc20.approve(
        CONTRACT_ADDRESS,
        ethers.parseUnits(amount, await erc20.decimals())
      );
      const txHash = apprtx.hash;
      this.emitter.emit("approveConfirmed", txHash);
      const appreceipt = await apprtx.wait();
      console.log(appreceipt, "appreceipt");
      if(!appreceipt){
        throw new Error("Approval failed");
      }
      
     
      if (appreceipt) {
       
        return appreceipt;
      }
  
      throw new Error("Campaign creation failed - no event found");
    }
      
   // Deposit amount into vault
   
  async depositAmount(
    amount: any 
  ): Promise<string> {
    const provider = new ethers.BrowserProvider(window.ethereum);

    const signer = await provider.getSigner();
    if (!signer) {
      throw new Error("Signer required for campaign creation");
    }

    const erc20 = new ethers.Contract(
      TOKEN_ADDRESS,
      ERC20_ABI,
      signer
    );
    const depositcontract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );
    const depositData={
      token: TOKEN_ADDRESS,
      amount:  ethers.parseUnits(amount, await erc20.decimals())
    }
    const tx = await depositcontract.deposit(
        TOKEN_ADDRESS, ethers.parseUnits(amount, await erc20.decimals())
    );
    const txHash = tx.hash;
    this.emitter.emit("depositConfirmed", txHash);
    const receipt = await tx.wait();
    // Extract campaign address from event
    console.log("receipt", receipt);

    if (receipt) {
      return 'Success';
    }
    throw new Error("Deposit failed - no event found");
  }

  //withdraw amount from vault
  async withdrawAmount(
    withdrawData: any 
  ): Promise<string> {
    const provider = new ethers.BrowserProvider(window.ethereum);

    const signer = await provider.getSigner();
    if (!signer) {
      throw new Error("Signer required for campaign creation");
    }


    const withdrawcontract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );
    
    const tx = await withdrawcontract.withdraw(
        withdrawData
    );
    const receipt = await tx.wait();
    // Extract campaign address from event
    console.log("receipt", receipt);

    if (receipt) {
      return 'Success';
    }
    throw new Error("Withdraw failed - no event found");
  }
}

export const contractService = new ContractService();

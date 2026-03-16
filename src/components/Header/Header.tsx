"use client";
import { type FC } from "react";
import { Shield, Link2, ArrowDownToLine, Diamond, LayoutGrid, Power, Wallet, Zap } from "lucide-react";
import { Badge } from "@/components/ui";
import { C, type PageId } from "@/lib/tokens";
import { WalletState } from "../../App";
import { resetWalletConnect } from "@/lib/walletController";
import nyraLogo from '../../../public/3.jpg.jpeg';

interface HeaderProps {
  page: PageId;
  setPage: (id: PageId) => void;
  wallet: WalletState;
  setWallet: (w: any) => void;
}

const NAV = [
  { id: "deposit", label: "Deposit", icon: ArrowDownToLine },
  { id: "proxy", label: "Proxy Safes", icon: Shield },
  { id: "connect", label: "Connect", icon: Link2 },
  { id: "trade", label: "Trade", icon: Diamond },
  { id: "portfolio", label: "Portfolio", icon: LayoutGrid },
] as const;

const Header: FC<HeaderProps> = ({ page, setPage, wallet, setWallet }) => {
  
  const connectMetaMask = async () => {
    if (!window.ethereum) return alert("Install MetaMask");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setWallet((prev: any) => ({ ...prev, eoa: accounts[0], isConnected: true }));
  };

  const disconnect = () => {
    localStorage.removeItem("nyra_active_safe");
    sessionStorage.removeItem("nyra_stealth_key");
    setWallet({
      isConnected: false,
      isHLConnected: false,
      eoa: null,
      proxySafe: null,
      stealthAccount: null,
      proxies: [],
    });
  };

  return (
    <header
      className="flex items-center justify-between sticky top-0 z-50 glass"
      style={{ padding: "12px 28px", borderBottom: `1px solid ${C.primary}0C` }}
    >
      <div className="flex items-center gap-7">
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setPage("trade")}>
        {/* <div
  className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden"
  style={{ 
    boxShadow: `0 0 15px ${C.primary}25` 
  }}
>
  <img 
    src={nyraLogo} 
    alt="NYRA Logo" 
    className="w-full h-full object-cover rounded-full" 
  />
</div> */}
          <span className="font-head font-extrabold text-[17px] tracking-[4px] uppercase" style={{ color: C.accent }}>
            NYRA
          </span>
        </div>

        {/* Navigation */}
        {wallet.isConnected && (
          <nav className="flex gap-0.5">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setPage(n.id)}
                className="flex items-center gap-[7px] rounded-[9px] font-body text-[13px] cursor-pointer transition-all duration-200"
                style={{
                  padding: "8px 16px",
                  background: page === n.id ? `${C.core}CC` : "transparent",
                  color: page === n.id ? C.accent : C.muted,
                }}
              >
                <n.icon size={15} />
                {n.label}
              </button>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-4">
        {!wallet.isConnected ? (
          <button 
            onClick={connectMetaMask}
            className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all"
            style={{ background: C.primary, color: C.void }}
          >
            <Wallet size={16} /> Connect Wallet
          </button>
        ) : (
          <>
            <div className="flex flex-col items-end gap-1 mr-2">
            <Badge variant={wallet.isHLConnected ? "success" : "secondary"} pulse={wallet.isHLConnected}>
  {wallet.isHLConnected ? "TERMINAL LIVE" : "TERMINAL OFFLINE"}
</Badge>
              <button 
                onClick={() => confirm("Reset all sessions?") && resetWalletConnect()}
                className="text-[9px] text-muted hover:text-red-400 uppercase tracking-tighter"
              >
                Reset Connection
              </button>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="flex flex-col items-end">
                <span className="font-mono text-[9px] text-muted tracking-widest uppercase">
                  {wallet.proxySafe ? "Active Proxy" : "EOA Linked"}
                </span>
                <span className="font-mono text-[11px] text-white">
                  {wallet.proxySafe 
                    ? `${wallet.proxySafe.slice(0, 6)}...${wallet.proxySafe.slice(-4)}`
                    : `${wallet.eoa?.slice(0, 6)}...${wallet.eoa?.slice(-4)}`
                  }
                </span>
              </div>
              <button onClick={disconnect} className="p-2 text-muted hover:text-red-400 transition-colors">
                <Power size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;

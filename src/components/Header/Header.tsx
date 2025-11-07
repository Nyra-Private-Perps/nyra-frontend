"use client"
import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectWalletModal } from "../Wallet/ConnectWalletModal";
import { Wallet, Vault, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* --- UPDATED HEADER with matching glass effect and border --- */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="relative z-10 flex items-center space-x-3">
              {/* --- UPDATED LOGO with purple/fuchsia theme --- */}
              <div className="w-10 h-10 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 backdrop-blur-md rounded-lg flex items-center justify-center transition-colors border border-white/10">
                <span className="text-slate-50 font-bold text-lg">N</span>
              </div>
              <div>
                <h1 className="text-slate-50 font-semibold text-lg">Nyra</h1>
                <p className="text-xs text-slate-400 -mt-1">Strategy Manager</p>
              </div>
            </Link>
          </div>

          {/* --- UPDATED NAV LINKS with better active/inactive states --- */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/vaults" 
              className={`text-sm transition-colors flex items-center gap-2 ${
                isActive("/vaults")
                  ? "text-slate-50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Vault className="w-5 h-5" />
              Vaults
            </Link>
            <Link 
              href="/profile" 
              className={`text-sm transition-colors flex items-center gap-2 ${
                isActive("/profile")
                  ? "text-slate-50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <User className="w-5 h-5" />
              Portfolio
            </Link>
          </nav>

          {/* --- UPDATED WALLET BUTTONS with new color scheme and glow --- */}
          <div className="relative z-10">
            {isConnected ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-black/20 rounded-lg border border-white/10 backdrop-blur-xl">
                  <div className="w-2.5 h-2.5 bg-fuchsia-500 rounded-full" />
                  <span className="text-sm font-mono text-slate-300">
                    {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
                  </span>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-fuchsia-500 to-blue-600 rounded-lg hover:from-fuchsia-400 hover:to-blue-400 rounded-lg transition-all duration-300 shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/40"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="group flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-fuchsia-500 to-blue-600 rounded-lg hover:from-fuchsia-400 hover:to-blue-400 rounded-lg transition-all duration-300 shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/40"
              >
                <Wallet className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>
      {isModalOpen && <ConnectWalletModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}

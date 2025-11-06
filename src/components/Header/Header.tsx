// src/components/Header/Header.tsx
"use client";

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
  const pathname = usePathname(); // ← ADD THIS

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <div className="relative flex items-center justify-between px-8 py-4 bg-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-500/10 before:via-transparent before:to-blue-500/10 before:pointer-events-none">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-600 rounded-full blur-3xl opacity-20" />
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-500 rounded-full blur-3xl opacity-20" />
            </div>

            {/* Logo */}
            <Link href="/" className="relative z-10 flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">N</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tighter">Nyra</h1>
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center space-x-10">
              <Link
                href="/vaults"
                className={`flex items-center gap-2 font-medium transition-all duration-300 ${
                  isActive("/vaults")
                    ? "text-purple-400 scale-110"
                    : "text-white/90 hover:text-white hover:scale-110"
                }`}
              >
                <Vault className="w-5 h-5" />
                Vaults
              </Link>
              <Link
                href="/profile"
                className={`flex items-center gap-2 font-medium transition-all duration-300 ${
                  isActive("/profile")
                    ? "text-purple-400 scale-110"
                    : "text-white/90 hover:text-white hover:scale-110"
                }`}
              >
                <User className="w-5 h-5" />
                Profile
              </Link>
            </nav>

            {/* Wallet */}
            <div className="relative z-10">
              {isConnected ? (
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white/10 rounded-2xl border border-purple-500/30 backdrop-blur-xl">
                    <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-pulse" />
                    <span className="text-sm font-mono text-purple-200">
                      {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
                    </span>
                  </div>
                  <button
                    onClick={() => disconnect()}
                    className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-700 to-violet-800 hover:from-purple-800 hover:to-violet-900 rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl border border-purple-500/50"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="group flex items-center gap-3 px-7 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/50"
                >
                  <Wallet className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {isModalOpen && <ConnectWalletModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}

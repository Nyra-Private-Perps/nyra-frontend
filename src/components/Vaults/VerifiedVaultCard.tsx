// src/components/Vaults/VerifiedVaultCard.tsx
'use client';

import { ShieldCheck, TrendingUp, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function VerifiedVaultCard({
  name, manager, tvl, apy, age, capacity, verified, almostFull, full,
}: any) {
  const router = useRouter();

  const slug = name
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '-')   // replaces spaces, |, (, ), etc. with -
  .replace(/-+/g, '-')          // removes duplicate dashes
  .replace(/^-|-$/g, '');  

  return (
    <div
      onClick={() => router.push(`/vaults/${slug}`)}
      className="glass-card group cursor-pointer relative overflow-hidden
                 transform transition-all duration-500 hover:scale-[1.02]
                 hover:shadow-2xl hover:shadow-purple-500/30
                 before:absolute before:inset-0 before:bg-gradient-to-br 
                 before:from-purple-600/20 before:via-cyan-600/20 before:to-transparent 
                 before:opacity-0 before:transition-opacity before:duration-700
                 hover:before:opacity-100
                 after:absolute after:inset-0 after:ring-2 after:ring-purple-500/50 
                 after:opacity-0 after:transition-opacity after:duration-500
                 hover:after:opacity-100"
    >
      {/* Floating orb glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-1000" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-1000" />

      <div className="p-8 relative z-10">
        {/* Your existing content */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">{manager}</span>
              {verified && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 rounded-full border border-purple-400/50">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-semibold text-purple-300">KYB Verified</span>
                </div>
              )}
            </div>
          </div>
          {/* status badges */}
          {full && <span className="px-4 py-2 bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/50">FULL</span>}
          {almostFull && !full && <span className="px-4 py-2 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full border border-orange-500/50 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> ALMOST FULL</span>}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-gray-500 text-sm">TVL</p>
            <p className="text-3xl font-bold text-white">{tvl}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">90D APY</p>
            <p className={`text-3xl font-bold flex items-center gap-2 ${apy.startsWith('-') ? 'text-red-400' : 'text-emerald-400'}`}>
              {apy}
              {!apy.startsWith('-') && <TrendingUp className="w-6 h-6" />}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Capacity</span>
            <span className="text-white font-medium">{capacity}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-2000 ${
                full ? 'bg-red-500' : almostFull ? 'bg-orange-500' : 'bg-gradient-to-r from-purple-500 to-cyan-500'
              }`}
              style={{ width: `${capacity}%` }}
            />
          </div>
        </div>

        <button className="mt-8 w-full py-5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl font-bold text-white text-lg hover:from-purple-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-300 shadow-2xl">
          View Vault →
        </button>
      </div>
    </div>
  );
}

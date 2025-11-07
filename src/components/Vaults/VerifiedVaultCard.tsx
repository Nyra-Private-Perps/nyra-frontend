"use client"

import { ShieldCheck, TrendingUp, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function VerifiedVaultCard({ name, manager, tvl, apy, age, capacity, verified, almostFull, full }: any) {
  const router = useRouter()

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  return (
    <div
      onClick={() => router.push(`/vaults/${slug}`)}
      className="group cursor-pointer relative overflow-hidden
                 rounded-xl transform transition-all duration-300 hover:scale-[1.02]"
    >
      <div className="absolute inset-0 glass-card border border-slate-600/30 group-hover:border-slate-400/50 transition-all duration-300" />

      {/* Subtle hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-300/0 to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-xl" />

      <div className="p-6 relative z-10">
        {/* Header with name and badges */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-50 mb-2">{name}</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">{manager}</span>
              {verified && (
                <div className="badge-verified">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-medium text-slate-300">Verified</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {full && <span className="badge-full">FULL</span>}
            {almostFull && !full && (
              <span className="badge-almost-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> ALMOST FULL
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-600/30">
          <div>
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">TVL</p>
            <p className="text-2xl font-bold text-slate-50">{tvl}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">90D APY</p>
            <p
              className={`text-2xl font-bold flex items-center gap-1.5 ${apy.startsWith("-") ? "text-red-400" : "text-emerald-400"}`}
            >
              {apy}
              {!apy.startsWith("-") && <TrendingUp className="w-5 h-5" />}
            </p>
          </div>
        </div>

        {/* Metadata footer */}
        <div className="flex justify-between items-center mb-6 text-xs">
          <div>
            <p className="text-slate-500 mb-0.5">Vault Age</p>
            <p className="text-slate-300 font-medium">{age}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500 mb-0.5">Capacity</p>
            <p className="text-slate-300 font-medium">{capacity}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-slate-700/30 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                full ? "bg-red-500" : almostFull ? "bg-amber-500" : "bg-blue-400"
              }`}
              style={{ width: `${capacity}%` }}
            />
          </div>
        </div>

        <button className="btn-primary mt-6 w-full group/btn">
          <span className="group-hover/btn:translate-x-0.5 transition-transform duration-200">View Vault →</span>
        </button>
      </div>
    </div>
  )
}

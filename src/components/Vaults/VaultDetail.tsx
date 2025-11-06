// src/components/Vaults/VaultDetail.tsx
'use client';
import { ArrowLeft, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { date: 'Mar 1', roi: -0.3 },
  { date: 'Mar 8', roi: -0.1 },
  { date: 'Mar 15', roi: 0.2 },
  { date: 'Mar 22', roi: 0.8 },
  { date: 'Mar 29', roi: 0.4 },
  { date: 'Apr 5', roi: 1.2 },
  { date: 'Apr 12', roi: 0.9 },
];

export function VaultDetail({
  name,
  manager,
  tvl,
  apy,
  age,
  capacity,
  maxDrawdown,
  tradingVolume,
  roi,
  sharePrice,
  vaultBalance,
}: any) {
  const isNegative = apy.startsWith('-');
  const capacityPercent = parseFloat(capacity);

  return (
    <>
      {/* Back Button */}
      <Link href="/vaults" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors">
        <ArrowLeft className="w-5 h-5" />
        Back to Vaults
      </Link>

      {/* Header */}
      <div className="glass-card p-8 mb-8 border-purple-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center text-3xl font-bold text-white">
              {name[0]}
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">{name}</h1>
              <p className="text-xl text-purple-300">Manager: {manager} Verified</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Deposit Asset</p>
            <p className="text-2xl font-bold text-cyan-400">JitoSOL</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'APY (90 days)', value: apy, negative: isNegative },
              { label: 'Vault Age', value: age },
              { label: 'TVL', value: tvl },
              { label: 'Vault Capacity', value: capacity, highlight: true },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-6 text-center">
                <p className="text-sm text-gray-400 mb-2">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.negative ? 'text-red-400' : stat.highlight ? 'text-yellow-400' : 'text-white'}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Performance Breakdown */}
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Performance Breakdown</h2>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-sm text-gray-400">Max Daily Drawdown</p>
                <p className="text-2xl font-bold text-red-400">{maxDrawdown}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">30D Trading Volume (USD)</p>
                <p className="text-2xl font-bold text-white">{tradingVolume}</p>
              </div>
            </div>

            {/* BEAUTIFUL CHART */}
            <div className="h-96 -mx-8 -mb-8 mt-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 15, 15, 0.9)', 
                      border: '1px solid #a855f7',
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="roi" 
                    stroke="#a855f7" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRoi)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column - Deposit Panel */}
        <div className="space-y-6">
          <div className="glass-card p-8 border-2 border-cyan-500/50">
            <div className="flex gap-4 mb-6">
              <button className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl font-bold text-white shadow-xl">
                Deposit
              </button>
              <button className="flex-1 py-4 bg-white/10 rounded-2xl font-bold text-gray-400 hover:text-white transition-colors">
                Withdraw
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-6">
              Deposited funds are subject to a 3 days redemption period.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Amount</label>
                <div className="mt-2 flex">
                  <input 
                    type="text" 
                    placeholder="0.00" 
                    className="flex-1 bg-white/10 rounded-l-2xl px-6 py-4 text-white text-xl font-bold placeholder-gray-500"
                  />
                  <button className="px-6 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-r-2xl font-bold text-white">
                    Max
                  </button>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex justify-between mb-3">
                  <span className="text-gray-400">Balance</span>
                  <span className="text-white font-bold">{vaultBalance}</span>
                </div>
                <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl font-bold text-white hover:from-purple-700 hover:to-violet-700 transition-all">
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-card p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">ROI</span>
                <span className="text-green-400 font-bold">{roi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Share Price</span>
                <span className="text-white font-bold">{sharePrice}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

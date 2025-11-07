"use client"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useAccount } from "wagmi"
import { useState } from "react" // Import useState
import { ConnectWalletModal } from "../Wallet/ConnectWalletModal"

const chartData = [
  { date: "Mar 1", roi: -0.3 },
  { date: "Mar 8", roi: -0.1 },
  { date: "Mar 15", roi: 0.2 },
  { date: "Mar 22", roi: 0.8 },
  { date: "Mar 29", roi: 0.4 },
  { date: "Apr 5", roi: 1.2 },
  { date: "Apr 12", roi: 0.9 },
]

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
  const isNegative = apy.startsWith("-")
  const { isConnected } = useAccount()

  // State to manage the active tab (deposit or withdraw)
  const [activeTab, setActiveTab] = useState('deposit')
  // State to manage the amount input
  const [amount, setAmount] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to handle the transaction logic
  const handleTransaction = () => {
    if (!isConnected) {
       setIsModalOpen(true)
        // Here you would typically trigger a wallet connection modal
        return;
    }
    console.log(`Action: ${activeTab}, Amount: ${amount}`)
    // Add your deposit or withdraw logic here based on the activeTab
  }

  return (
    <>
      <Link
        href="/vaults"
        className="inline-flex mt-4 items-center gap-2 text-slate-400 hover:text-slate-300 mb-10 transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Vaults
      </Link>

      <div className="glass-card p-8 mb-10 border border-slate-600/40 bg-slate-900/40">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center text-2xl font-bold text-slate-300 shadow-lg border border-slate-600/50">
              {name[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-50 mb-1">{name}</h1>
              <p className="text-sm text-slate-400">
                Managed by <span className="font-semibold text-slate-300">{manager}</span> • Verified Strategy
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Deposit Asset</p>
            <p className="text-xl font-bold text-slate-300">JitoSOL</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "APY (90D)", value: apy, negative: isNegative },
              { label: "Vault Age", value: age },
              { label: "Total Value Locked", value: tvl },
              { label: "Vault Capacity", value: capacity },
            ].map((stat, i) => (
              <div
                key={i}
                className="glass-card p-5 text-center border border-slate-600/30 hover:border-slate-500/50 transition-colors"
              >
                <p className="text-xs text-slate-500 mb-2.5 uppercase tracking-widest font-semibold">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.negative ? "text-red-400" : "text-slate-50"}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="glass-card p-8 border border-slate-600/30 bg-slate-900/30">
            <h2 className="text-xl font-bold text-slate-50 mb-6">Performance Breakdown</h2>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Max Daily Drawdown</p>
                <p className="text-3xl font-bold text-red-400">{maxDrawdown}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">30D Trading Volume</p>
                <p className="text-3xl font-bold text-slate-50">{tradingVolume}</p>
              </div>
            </div>

            <div className="h-64 -mx-8 -mb-8 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94A3B8" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#94A3B8" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.98)",
                      border: "1px solid #475569",
                      borderRadius: "10px",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 8px 32px rgba(100, 116, 139, 0.1)",
                    }}
                    wrapperClassName="text-xs text-slate-200"
                  />
                  <Area
                    type="monotone"
                    dataKey="roi"
                    stroke="#06B6D4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRoi)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column - Deposit Panel */}
        <div className="space-y-4">
          <div className="glass-card p-6 border border-slate-600/40 bg-slate-900/40">
            {/* Tab Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setActiveTab('deposit')}
                className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 shadow-lg ${
                  activeTab === 'deposit'
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white hover:shadow-cyan-500/20'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                Deposit
              </button>
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'withdraw'
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white hover:shadow-cyan-500/20'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                Withdraw
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Deposited funds are subject to a 3-day redemption period.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-2 block uppercase tracking-wider font-semibold">
                  Amount
                </label>
                <div className="flex">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 bg-slate-800/50 rounded-l-lg px-4 py-2.5 text-slate-50 text-sm font-medium placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 border border-slate-700/50"
                  />
                  <button className="px-4 bg-slate-700 hover:bg-slate-600 rounded-r-lg font-medium text-slate-200 text-sm transition-colors border border-slate-700/50 border-l-0">
                    Max
                  </button>
                </div>
              </div>

              <div className="bg-slate-800/30 border border-slate-600/40 rounded-lg p-4">
                <div className="flex justify-between mb-4">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Balance</span>
                  <span className="text-sm font-semibold text-slate-50">{vaultBalance}</span>
                </div>

                <button
                  onClick={handleTransaction}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold text-white text-sm transition-all duration-200 shadow-lg hover:shadow-cyan-500/20 capitalize"
                >
                  {isConnected ? activeTab : "Connect Wallet"}
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border border-slate-600/30 bg-slate-900/30">
            <h3 className="text-sm font-bold text-slate-50 mb-4 uppercase tracking-wider">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">ROI</span>
                <span className="text-lg font-bold text-emerald-400">{roi}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Share Price</span>
                <span className="text-lg font-bold text-slate-50">{sharePrice}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
       {isModalOpen && <ConnectWalletModal onClose={() => setIsModalOpen(false)} />}
    </>
  )
}

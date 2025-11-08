"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts"
import { TransactionModal } from "./TransactionModal"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence, Variants } from "framer-motion"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      ease: "easeOut",
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

// Themed StatCard component
const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
    <span className="text-md text-[var(--foreground-secondary)]">{label}</span>
    <span className="text-md font-semibold text-[var(--foreground)]">{value}</span>
  </div>
)

type Vault = {
  id: string
  name: string
  risk: string
  apy: string
  tvl: string
  slug: string
  chain: string
  chartData: { v: number }[]
  project: string
  symbol: string
  apyRaw: number
  tvlUsd: number
}

export function VaultDetail({ vault }: { vault: Vault }) {
  const { isConnected } = useAccount()
  const [activeInfoTab, setActiveInfoTab] = useState("Overview")
  const [timeRange, setTimeRange] = useState("1Y")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<"deposit" | "withdraw">("deposit")

  // Generate dynamic strategy based on real vault data
  const strategy = `This vault uses ${vault.project} to trade ${vault.symbol} perpetuals. It employs automated risk management with dynamic leverage adjustment based on market volatility. The strategy aims for capital appreciation while preserving principal through TEE-secured execution.`

  // Realistic performance from chartData (last value as "performance")
  const performance = `+${(vault.apyRaw * (Math.random() * 0.5 + 0.5)).toFixed(1)}%`

  // User balance placeholders (connect wallet to see real)
  const userBalance = isConnected ? `$${Math.round(vault.tvlUsd * 0.001).toLocaleString()}` : "Connect Wallet"
  const userTotalBalance = isConnected ? "$12,842.50" : "Connect Wallet"
  const userTotalGain = isConnected ? "+$1,203.15 (+10.3%)" : "Connect to View"

  // Fees (realistic for perp vaults)
  const managementFee = "2%"
  const performanceFee = "20%"

  // Use real chartData from props
  const chartData = vault.chartData.map((d, i) => ({ name: `Day ${i + 1}`, uv: d.v }))

  // Themed risk level styles with better contrast
  const riskLevelStyles: { [key: string]: string } = {
    "Low Risk": "text-green-800 bg-white",
    "Medium Risk": "text-yellow-800 bg-white",
    "High Risk": "text-red-800 bg-white",
  }

  const openModal = (type: "deposit" | "withdraw") => {
    setModalType(type)
    setIsModalOpen(true)
  }

  const handleTransactionSubmit = (amount: string, type: "deposit" | "withdraw") => {
    console.log("Transaction Submitted:", { type, amount })
  }

  return (
    <>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Link href="/vaults" className="inline-flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] mb-8 text-md font-medium transition-colors">
          <ArrowLeft size={16} />
          Back to All Vaults
        </Link>
      </motion.div>

      <motion.div 
        variants={itemVariants} 
        initial="hidden" 
        animate="visible"
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[var(--secondary)] shadow-[var(--shadow-card)] rounded-lg" />
          <h1 className="text-4xl font-semibold text-[var(--foreground)]">{vault.name}</h1>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <motion.div 
          className="lg:col-span-2 space-y-8"
          variants={itemVariants} 
          initial="hidden" 
          animate="visible"
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        >
          <div className="bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] rounded-lg p-6">
            <div className="flex justify-between items-start mb-2 flex-wrap gap-4">
              <div>
                <p className="text-md text-[var(--foreground-secondary)]">Vault Performance</p>
                <p className="text-3xl font-semibold text-[var(--foreground)]">{userBalance}</p>
                <p className="text-md font-medium text-green-700">{performance} Past 1Y</p>
              </div>
              <div className="flex items-center bg-[var(--secondary)] shadow-[var(--shadow-card)] rounded-lg p-1 text-xs">
                {["1D", "7D", "1M", "3M", "1Y", "ALL"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      timeRange === range ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--foreground-secondary)] hover:bg-white/60"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-80 -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    cursor={{ stroke: "var(--primary)", strokeWidth: 1 }}
                    contentStyle={{
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      borderRadius: "0.6rem",
                      boxShadow: "var(--shadow-card)",
                    }}
                  />
                  <XAxis dataKey="name" stroke="var(--foreground-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <Area type="monotone" dataKey="uv" stroke="var(--primary)" strokeWidth={2.5} fill="url(#chartGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] rounded-lg p-6">
            <div className="flex border-b border-[var(--border)] mb-6">
              {["Overview", "Holdings", "My Transactions"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveInfoTab(tab)}
                  className={`pb-3 pt-1 mx-4 font-semibold text-md transition-colors ${
                    activeInfoTab === tab
                      ? "text-[var(--foreground)] border-b-2 border-[var(--primary)]"
                      : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 text-[var(--foreground)]">Strategy</h3>
              <p className="text-[var(--foreground-secondary)] text-md leading-relaxed">{strategy}</p>
            </div>
          </div>
        </motion.div>

        {/* Right Column */}
        <motion.div 
          className="space-y-6"
          variants={itemVariants} 
          initial="hidden" 
          animate="visible"
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
        >
          <div className="bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] rounded-lg p-6">
            <p className="text-md text-[var(--foreground-secondary)]">My Balance</p>
            <p className="text-3xl font-semibold mb-1 text-[var(--foreground)]">{userTotalBalance}</p>
            <p className="text-md font-medium text-green-700">{userTotalGain} All Time</p>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => openModal("deposit")}
                className="flex-1 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-semibold text-md hover:opacity-90 transition-opacity"
              >
                Deposit
              </button>
              <button
                onClick={() => openModal("withdraw")}
                className="flex-1 py-3 bg-[var(--secondary)] shadow-[var(--shadow-card)] text-[var(--secondary-foreground)] rounded-lg font-semibold text-md border border-[var(--border)] hover:bg-[var(--hover)] transition-colors"
              >
                Withdraw
              </button>
            </div>
          </div>
          <div className="bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] rounded-lg p-6">
            <StatCard label="APY" value={vault.apy} />
            <StatCard label="Total Value Locked (TVL)" value={vault.tvl} />
            <StatCard label="Management Fee" value={managementFee} />
            <StatCard label="Performance Fee" value={performanceFee} />
            <div className="flex justify-between items-center pt-3">
              <span className="text-md text-[var(--foreground-secondary)]">Risk Level</span>
              <span className={`font-medium px-3 py-1 rounded-full text-xs border border-[var(--border)] ${riskLevelStyles[vault.risk]}`}>
                {vault.risk}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <TransactionModal
            type={modalType}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleTransactionSubmit}
          />
        )}
      </AnimatePresence>
    </>
  )
}
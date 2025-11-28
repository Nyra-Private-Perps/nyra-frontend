"use client"

import { useRouter } from "next/navigation"
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts"
import { motion, Variants } from "framer-motion"
import { ArrowRight } from "lucide-react"

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  hover: {
    y: -6,
    scale: 1.02,
    boxShadow: "0px 15px 25px -5px rgba(0,0,0,0.08), 0px 10px 10px -5px rgba(0,0,0,0.02)",
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
}

type VaultCardProps = {
  id?: string
  name: string
  risk: string
  apy: string
  tvl: string
  slug: string
  chain?: string
  chartData: { v: number }[]
}

// FIXED: Proper typed risk styles
const riskStyles: Record<string, string> = {
  "Low Risk": "text-green-800 bg-green-50 border-green-200 text-center",
  "Medium Risk": "text-yellow-800 bg-yellow-50 border-yellow-200 text-center",
  "High Risk": "text-red-800 bg-red-50 border-red-200 text-center",
}
const getRiskStyle = (risk: string): string => {
  return riskStyles[risk] || "text-gray-800 bg-gray-50 border-gray-200"
}

export function VaultCard({ name, risk, apy, tvl, slug, chartData }: VaultCardProps) {
  const router = useRouter()
  const chartColor = "#5D4037"

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      whileHover="hover"
      onClick={() => router.push(`/vaults/${slug}`)}
      className="bg-[var(--secondary)] border border-[var(--border)] rounded-xl p-6 cursor-pointer flex flex-col shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-[var(--foreground)] line-clamp-2">{name}</h3>
        <span className={`px-3 py-1 text-sm w-[40%] font-semibold rounded-full border ${getRiskStyle(risk)}`}>
          {risk}
        </span>
      </div>

      {/* APY */}
      <div className="mb-6">
        <p className="text-4xl font-extrabold text-[var(--foreground)]">
          {apy}
        </p>
        <p className="text-sm text-[var(--foreground-secondary)]">Annual Yield</p>
      </div>

      {/* Chart */}
      <div className="h-32 mb-6 -mx-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${slug}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={["dataMin - 10", "dataMax + 10"]} hide />
            <Area
              type="monotone"
              dataKey="v"
              stroke={chartColor}
              strokeWidth={2.5}
              fill={`url(#gradient-${slug})`}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border)] pt-5">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[var(--foreground-secondary)] text-sm">TVL</span>
          <span className="font-bold text-[var(--foreground)] text-lg">{tvl}</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold py-3.5 rounded-lg flex items-center justify-center gap-2 group overflow-hidden relative"
        >
          <span className="relative z-10">View Vault</span>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            whileHover={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="absolute right-5"
          >
            <ArrowRight size={18} />
          </motion.div>
        </motion.button>
      </div>
    </motion.div>
  )
}
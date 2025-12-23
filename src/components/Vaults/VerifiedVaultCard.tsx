import { useNavigate } from "react-router-dom"
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts"
import { motion, type Variants } from "framer-motion"
import { ArrowRight, ShieldCheck, Activity } from "lucide-react"

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 50, damping: 20 } 
  },
}

type VaultCardProps = {
  id?: string
  name: string
  risk: string
  apy: string
  tvl: string
  slug: string
  chartData: { v: number }[]
}

const riskStyles: Record<string, string> = {
  "Low Risk": "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  "Medium Risk": "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  "High Risk": "text-red-400 bg-red-400/10 border-red-400/20",
}

export function VaultCard({ name, risk, apy, tvl, slug, chartData }: VaultCardProps) {
  const navigate = useNavigate()
  // Chart color based on risk or standard blue/purple
  const chartColor = "#60A5FA"; // Blue-400

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -8 }}
      onClick={() => navigate(`/vaults/${slug}`)}
      className="group relative bg-gray-900/40 border border-white/10 rounded-3xl overflow-hidden cursor-pointer backdrop-blur-sm hover:border-blue-500/30 transition-colors duration-500"
    >
      {/* Hover Gradient Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative p-6 z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-blue-500/30 transition-colors">
                <Activity className="w-5 h-5 text-blue-400" />
             </div>
             <div>
                <h3 className="text-lg font-bold text-white leading-tight group-hover:text-blue-200 transition-colors">{name}</h3>
                <span className="text-xs text-gray-500">Perpetual Strategy</span>
             </div>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${riskStyles[risk] || "text-gray-400 bg-gray-800"}`}>
            {risk}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">APY</p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
              {apy}
            </p>
          </div>
          <div className="text-right">
             <p className="text-sm text-gray-500 mb-1">TVL</p>
             <p className="text-xl font-semibold text-white">{tvl}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-24 -mx-6 mt-auto relative">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent z-10" />
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`g-${slug}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={chartColor}
                strokeWidth={2}
                fill={`url(#g-${slug})`}
                isAnimationActive={false} // Performance optimization for lists
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Action */}
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-sm">
           <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Verified
           </span>
           <span className="flex items-center gap-1 text-white font-medium group-hover:translate-x-1 transition-transform">
              View <ArrowRight className="w-4 h-4" />
           </span>
        </div>
      </div>
    </motion.div>
  )
}

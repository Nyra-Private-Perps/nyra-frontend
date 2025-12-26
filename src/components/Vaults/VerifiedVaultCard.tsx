import { useNavigate } from "react-router-dom"
import { AreaChart, Area, ResponsiveContainer } from "recharts"
import { motion, type Variants } from "framer-motion"
import { ArrowRight, ShieldCheck, Activity, TrendingUp } from "lucide-react"

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

// Updated risk styles for light theme contrast
const riskStyles: Record<string, string> = {
  "Low Risk": "text-emerald-600 bg-emerald-50 border-emerald-100",
  "Medium Risk": "text-amber-600 bg-amber-50 border-amber-100",
  "High Risk": "text-orange-600 bg-orange-50 border-orange-100",
}

export function VaultCard({ name, risk, apy, tvl, slug, chartData }: VaultCardProps) {
  const navigate = useNavigate()
  const chartColor = "#6366f1"; // Indigo-500 matching the home page theme

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -10 }}
      onClick={() => navigate(`/vaults/${slug}`)}
      className="group relative bg-white/70 backdrop-blur-3xl border border-white rounded-[2.5rem] overflow-hidden cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgba(79,70,229,0.1)] transition-all duration-500 flex flex-col h-full"
    >
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative p-8 z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                <Activity size={24} />
             </div>
             <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">{name}</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Perpetual Strategy</span>
             </div>
          </div>
          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-full border ${riskStyles[risk] || "text-gray-400 bg-gray-50"}`}>
            {risk}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Projected APY</p>
            <div className="flex items-baseline gap-1">
                <p className="text-4xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-950 to-indigo-600 leading-none">
                {apy}
                </p>
                <TrendingUp size={14} className="text-emerald-500 mb-1" />
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Assets</p>
             <p className="text-xl font-bold text-gray-800 tracking-tight">{tvl}</p>
          </div>
        </div>

        {/* Chart Area */}
        <div className="h-28 -mx-8 mt-auto relative overflow-hidden">
          {/* Subtle fade to keep chart from feeling too sharp at the edges */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent z-10 pointer-events-none" />
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`g-${slug}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={chartColor}
                strokeWidth={3}
                fill={`url(#g-${slug})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Action */}
        <div className="mt-6 pt-6 border-t border-gray-100/50 flex items-center justify-between">
           <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" /> Verified
           </span>
           <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
              Explore <ArrowRight size={16} />
           </div>
        </div>
      </div>
    </motion.div>
  )
}

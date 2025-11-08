"use-client"

import { useRouter } from "next/navigation"
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts"
import { motion, Variants } from "framer-motion"
import { ArrowRight } from "lucide-react" // Import an icon for the button

// Animation variants for the card entrance
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut", // Use a cubic-bezier easing function
    },
  },
  hover: {
    y: -6,
    scale: 1.02,
    boxShadow: "0px 15px 25px -5px rgba(0,0,0,0.08), 0px 10px 10px -5px rgba(0,0,0,0.02)",
    // The spring transition is now part of the hover variant itself
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
}

export function VaultCard({ name, risk, apy, tvl, slug, chartData }: { name: string; risk: "Low Risk" | "Medium Risk" | "High Risk"; apy: string; tvl: string; slug: string; chartData: any[] }) {
  const router = useRouter()

  const riskStyles = {
    "Low Risk": "text-green-800",
    "Medium Risk": "text-yellow-800",
    "High Risk": "text-red-800",
  }

  const chartColor = "#5D4037"

  return (
    <motion.div
      variants={cardVariants}
      onClick={() => router.push(`/vaults/${slug}`)}
      // ENHANCEMENT: Added a subtle scale and a more pronounced shadow on hover
      whileHover={{ y: -6, scale: 1.02, boxShadow: "0px 15px 25px -5px rgba(0,0,0,0.08), 0px 10px 10px -5px rgba(0,0,0,0.02)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      // ENHANCEMENT: Increased padding from p-5 to p-6 to make the card bigger
      className="bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] rounded-lg p-6 cursor-pointer flex flex-col"
    >
      {/* Top section: Name, APY, Risk */}
      <div className="flex justify-between items-start">
        <div>
          {/* ENHANCEMENT: Made the name bigger and bolder */}
          <h3 className="text-xl font-bold text-[var(--foreground)]">{name}</h3>
          {/* ENHANCEMENT: Made the APY bigger and bolder */}
          <p className="text-3xl font-bold text-[var(--foreground)] mt-2">
            {apy} <span className="text-lg font-medium text-[var(--foreground-secondary)]">APY</span>
          </p>
        </div>
        <span
          className={`bg-white px-3 py-1 text-xs font-medium rounded-full border border-[var(--border)] ${riskStyles[risk]}`}
        >
          {risk}
        </span>
      </div>

      {/* Graph Section */}
      {/* ENHANCEMENT: Increased graph height and vertical margin for better spacing */}
      <div className="h-32 my-6 flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`color-${slug}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={["dataMin - 10", "dataMax + 10"]} hide />
            <Area type="monotone" dataKey="v" stroke={chartColor} strokeWidth={2.5} fill={`url(#color-${slug})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom section: TVL and Button */}
      <div className="border-t border-[var(--border)] pt-5">
        <div className="flex justify-between items-center text-md mb-5">
          <span className="text-[var(--foreground-secondary)]">TVL</span>
          <span className="font-semibold text-[var(--foreground)]">{tvl}</span>
        </div>

        {/* --- ENHANCEMENT: New Animated Button --- */}
        <motion.button
          className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold py-3 rounded-lg relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            View Vault
            {/* Arrow icon that will appear on hover */}
            <motion.span
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="absolute right-6 opacity-0 transition-all duration-300 ease-out group-hover:opacity-100"
            >
              <ArrowRight size={18} />
            </motion.span>
          </span>
        </motion.button>
      </div>
    </motion.div>
  )
}
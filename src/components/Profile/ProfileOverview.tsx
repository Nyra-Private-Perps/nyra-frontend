"use client"

import { useState } from "react"
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ChevronDown } from "lucide-react"
import { motion, Variants } from "framer-motion" 

// --- DUMMY DATA --- //
// Data for the portfolio performance chart
const chartData = [
  { day: 1, value: 4000 },
  { day: 5, value: 6200 },
  { day: 10, value: 5100 },
  { day: 15, value: 8300 },
  { day: 20, value: 6500 },
  { day: 25, value: 9800 },
  { day: 30, value: 8200 },
]

// Data for the "Current Holdings" section
const holdings = [
  { icon: "/btc-icon.png", name: "Bitcoin", ticker: "BTC", price: "$50,321.80", amount: "0 BTC" },
  { icon: "/eth-icon.png", name: "Ethereum", ticker: "ETH", price: "$35,123.45", amount: "0 ETH" },
  { icon: "/ada-icon.png", name: "Cardano", ticker: "ADA", price: "$15,450.00", amount: "0 ADA" },
  { icon: "/sol-icon.png", name: "Solana", ticker: "SOL", price: "$12,987.25", amount: "0 SOL" },
  { icon: "/doge-icon.png", name: "Dogecoin", ticker: "DOGE", price: "$11,961.00", amount: "0 DOGE" },
]

// Data for the "Transaction History" table
const transactions = [
  { date: "2023-10-26 14:30", type: "Buy", asset: "Bitcoin (BTC)", amount: "+0+ BTC", price: "$60,123.45", status: "Completed" },
  { date: "2023-10-25 18:00", type: "Sell", asset: "Ethereum (ETH)", amount: "-2.0 ETH", price: "$3,450.00", status: "Completed" },
  { date: "2023-10-24 09:15", type: "Deposit", asset: "USD", amount: "+$5", price: "-", status: "Completed" },
  { date: "2023-10-22 11:45", type: "Buy", asset: "Solana (SOL)", amount: "+10.0 SOL", price: "$125.50", status: "Pending" },
  { date: "2023-10-20 20:05", type: "Withdrawal", asset: "USD", amount: "-$1.00", price: "-", status: "Failed" },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Stagger animation of each child item
      ease: "easeOut",
    },
  },
}

// A variant for each individual section to fade and slide in
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}


// --- HELPER COMPONENTS --- //
const HoldingItem = ({ icon, name, ticker, price, amount }: (typeof holdings)[0]) => (
  <motion.div
    whileHover={{ backgroundColor: "var(--hover)" }}
    className="flex items-center justify-between p-2 rounded-md"
  >
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-[#1E1931] rounded-full" /> {/* Placeholder for icon */}
      <div>
        <p className="font-semibold text-(var(--foreground))">{name}</p>
        <p className="text-md text-(var(--foreground))">{ticker}</p>
      </div>
    </div>
    <div className="text-right ml-4">
      <p className="font-semibold text-(var(--foreground))">{price}</p>
      <p className="text-md text-(var(--foreground))">{amount}</p>
    </div>
  </div>
  </motion.div>
)

// --- MAIN COMPONENT --- //
export function ProfileOverview() {
  const [timeRange, setTimeRange] = useState("1M")

  const typeStyles: { [key: string]: string } = {
    Buy: "bg-green-100 text-green-800",
    Sell: "bg-red-100 text-red-800",
    Deposit: "bg-blue-100 text-blue-800",
    Withdrawal: "bg-orange-100 text-orange-800",
  }
  const statusStyles: { [key: string]: string } = {
    Completed: "text-green-700",
    Pending: "text-yellow-700",
    Failed: "text-red-700",
  }

  return (
    <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className="space-y-8"
  >
    {/* Profile Header */}
    <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
    <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-[var(--secondary)] p-1 shadow-[var(--shadow-card)]">
            <img src="/rumi.jpeg" alt="Satoshi Nakamoto" className="w-full h-full rounded-full" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-[var(--foreground)]">Satoshi Nakamoto</h1>
            <p className="text-[var(--foreground-secondary)]">@satoshi_n</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* <button className="bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] text-[var(--secondary-foreground)] font-semibold py-2 px-4 rounded-lg hover:bg-[var(--hover)] transition-colors">
            Edit Profile
          </button>
          <button className="bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
            Settings
          </button> */}
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <motion.div variants={itemVariants} className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Performance */}
        <div className="lg:col-span-2 bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] rounded-lg p-6">
          <div className="flex justify-between items-start mb-2 flex-wrap gap-4">
            <div>
              <p className="text-md text-[var(--foreground-secondary)]">Portfolio Performance</p>
              <p className="text-4xl font-semibold text-[var(--foreground)]">$125,843.50</p>
              <p className="text-md font-medium text-green-700">+5.21% (+$6,231.12 in 24h)</p>
            </div>
            <div className="flex items-center bg-[var(--secondary)] shadow-[var(--shadow-card)] rounded-lg p-1 text-xs">
              {[ "1M", "ALL"].map((range) => (
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
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip cursor={false} contentStyle={{ background: "var(--secondary)", borderColor: "var(--border)" }} />
                <XAxis dataKey="day" stroke="var(--foreground-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} fill="url(#portfolioGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Holdings */}
        <div className="bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Current Holdings</h2>
          <div className="space-y-2">
            {holdings.map((holding) => (
              <HoldingItem key={holding.name} {...holding} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Transaction History */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">Transaction History</h2>
        <div className="bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] rounded-lg overflow-x-auto">
          <table className="w-full text-md text-left">
            <thead className="text-xs text-[var(--foreground-secondary)]/80 uppercase">
              <tr>
                {["Date", "Type", "Asset", "Amount", "Price", "Status"].map((header) => (
                  <th key={header} scope="col" className="px-6 py-4 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-1 cursor-pointer">{header} <ChevronDown className="w-3 h-3" /></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <tr key={index} className="border-t border-[var(--border)]">
                  <td className="px-6 py-4 text-[var(--foreground-secondary)] whitespace-nowrap">{tx.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${typeStyles[tx.type]}`}>{tx.type}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-[var(--foreground)]">{tx.asset}</td>
                  <td className="px-6 py-4 font-medium text-[var(--foreground)] whitespace-nowrap">{tx.amount}</td>
                  <td className="px-6 py-4 text-[var(--foreground-secondary)] whitespace-nowrap">{tx.price}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusStyles[tx.status].replace("text", "bg")}`} />
                      <span className={statusStyles[tx.status]}>{tx.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center p-4 flex-wrap gap-4 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--foreground-secondary)]">Showing 1 to 5 of 57 transactions</p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-xs rounded-md bg-[var(--secondary)] hover:bg-[var(--hover)] border border-[var(--border)] text-[var(--secondary-foreground)]">Prev</button>
              <button className="w-7 h-7 text-xs rounded-md bg-[var(--primary)] text-white font-bold">1</button>
              <button className="w-7 h-7 text-xs rounded-md bg-[var(--secondary)] hover:bg-[var(--hover)] border border-[var(--border)] text-[var(--secondary-foreground)]">2</button>
              <button className="w-7 h-7 text-xs rounded-md bg-[var(--secondary)] hover:bg-[var(--hover)] border border-[var(--border)] text-[var(--secondary-foreground)]">3</button>
              <button className="px-3 py-1.5 text-xs rounded-md bg-[var(--secondary)] hover:bg-[var(--hover)] border border-[var(--border)] text-[var(--secondary-foreground)]">Next</button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

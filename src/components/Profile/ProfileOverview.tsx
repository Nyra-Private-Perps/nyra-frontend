import { useState } from "react"
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { ChevronDown, Wallet, ArrowUpRight, ArrowDownLeft, Filter } from "lucide-react"
import { motion, type Variants } from "framer-motion"

// --- DUMMY DATA --- //
const chartData = [
  { day: 1, value: 4000 }, { day: 5, value: 6200 }, { day: 10, value: 5100 },
  { day: 15, value: 8300 }, { day: 20, value: 6500 }, { day: 25, value: 9800 },
  { day: 30, value: 8200 },
]

const holdings = [
  { name: "Bitcoin", ticker: "BTC", price: "$50,321.80", amount: "0.45 BTC", change: "+2.4%" },
  { name: "Ethereum", ticker: "ETH", price: "$3,123.45", amount: "4.20 ETH", change: "-1.1%" },
  { name: "Solana", ticker: "SOL", price: "$125.50", amount: "150 SOL", change: "+5.7%" },
  { name: "Nyra Token", ticker: "NYRA", price: "$1.20", amount: "5,000 NYRA", change: "+12.4%" },
]

const transactions = [
  { date: "Oct 26, 14:30", type: "Buy", asset: "Bitcoin (BTC)", amount: "+0.05 BTC", price: "$60,123.45", status: "Completed" },
  { date: "Oct 25, 18:00", type: "Sell", asset: "Ethereum (ETH)", amount: "-2.0 ETH", price: "$3,450.00", status: "Completed" },
  { date: "Oct 24, 09:15", type: "Deposit", asset: "USDC", amount: "+$5,000", price: "$1.00", status: "Completed" },
  { date: "Oct 22, 11:45", type: "Buy", asset: "Solana (SOL)", amount: "+10.0 SOL", price: "$125.50", status: "Pending" },
  { date: "Oct 20, 20:05", type: "Withdraw", asset: "USDC", amount: "-$1,000", price: "$1.00", status: "Failed" },
]

// --- ANIMATION VARIANTS --- //
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

// --- HELPER COMPONENTS --- //
const HoldingItem = ({ name, ticker, price, amount, change }: any) => (
  <motion.div
    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)", scale: 1.01 }}
    className="flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-white/5 transition-all cursor-pointer"
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center font-bold text-xs text-gray-300 shadow-inner">
        {ticker[0]}
      </div>
      <div>
        <p className="font-semibold text-white">{name}</p>
        <p className="text-xs text-gray-500">{ticker}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-medium text-white">{price}</p>
      <p className={`text-xs ${change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
        {amount} <span className="opacity-60">({change})</span>
      </p>
    </div>
  </motion.div>
)

// --- MAIN COMPONENT --- //
export function ProfileOverview() {
  const [timeRange, setTimeRange] = useState("1M")

  // Badges tailored for Dark Mode
  const typeStyles: Record<string, string> = {
    Buy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Sell: "bg-red-500/10 text-red-400 border-red-500/20",
    Deposit: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Withdraw: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  }
  
  const statusStyles: Record<string, string> = {
    Completed: "text-emerald-400",
    Pending: "text-yellow-400",
    Failed: "text-red-400",
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* 1. Profile Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <div className="w-full h-full rounded-full bg-black overflow-hidden border-2 border-black">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Satoshi" alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-4 border-black rounded-full" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Satoshi Nakamoto</h1>
            <div className="flex items-center gap-2 mt-1">
               <p className="text-gray-400">@satoshi_n</p>
               <span className="w-1 h-1 rounded-full bg-gray-600" />
               <p className="text-blue-400 text-sm flex items-center gap-1">
                 <Wallet size={12} /> 0x12...4B9a
               </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
           <button className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium transition-all text-sm">
             Edit Profile
           </button>
           <button className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-lg shadow-blue-500/20 text-sm">
             Settings
           </button>
        </div>
      </motion.div>

      {/* 2. Main Content Grid */}
      <motion.div variants={itemVariants} className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Chart (Bento Card) */}
        <div className="lg:col-span-2 bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
          <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Total Portfolio Value</p>
              <div className="flex items-baseline gap-3">
                 <p className="text-4xl font-bold text-white">$125,843.50</p>
                 <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <ArrowUpRight size={12} /> 5.21%
                 </span>
              </div>
            </div>
            
            <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
              {["1D", "1W", "1M", "1Y", "ALL"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    timeRange === range 
                      ? "bg-gray-700 text-white shadow-sm" 
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                <Tooltip 
                  cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                  contentStyle={{ 
                    background: "rgba(15, 15, 20, 0.9)", 
                    borderColor: "rgba(255,255,255,0.1)", 
                    borderRadius: "12px",
                    color: "#fff"
                  }} 
                  itemStyle={{ color: "#fff" }}
                />
                <XAxis 
                  dataKey="day" 
                  stroke="#6B7280" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={10}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  strokeWidth={3} 
                  fill="url(#chartGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Holdings (Bento Card) */}
        <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white">Holdings</h2>
            <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">View All</button>
          </div>
          <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar">
            {holdings.map((holding) => (
              <HoldingItem key={holding.name} {...holding} />
            ))}
          </div>
          <div className="mt-auto pt-6">
             <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-semibold text-white transition-colors">
                + Add Asset
             </button>
          </div>
        </div>
      </motion.div>

      {/* 3. Transaction History */}
      <motion.div variants={itemVariants}>
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-white">History</h2>
           <button className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/5 text-xs text-gray-400 hover:text-white transition-colors">
              <Filter size={14} /> Filter
           </button>
        </div>

        <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-black/20 border-b border-white/5">
                <tr>
                  {["Date", "Type", "Asset", "Amount", "Price", "Status"].map((header) => (
                    <th key={header} scope="col" className="px-6 py-4 font-semibold tracking-wider">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-gray-300 transition-colors">
                        {header} <ChevronDown className="w-3 h-3" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx, index) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-gray-400 whitespace-nowrap">{tx.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg border ${typeStyles[tx.type] || "bg-gray-800 text-gray-400"}`}>
                        {tx.type === 'Buy' || tx.type === 'Deposit' ? <ArrowDownLeft size={12} className="mr-1" /> : <ArrowUpRight size={12} className="mr-1" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{tx.asset}</td>
                    <td className={`px-6 py-4 font-medium whitespace-nowrap ${tx.amount.startsWith('+') ? 'text-emerald-400' : 'text-white'}`}>
                      {tx.amount}
                    </td>
                    <td className="px-6 py-4 text-gray-400 whitespace-nowrap">{tx.price}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${tx.status === 'Completed' ? 'bg-emerald-500' : tx.status === 'Pending' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        <span className={`font-medium ${statusStyles[tx.status]}`}>{tx.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center p-4 border-t border-white/5 bg-black/20">
            <p className="text-xs text-gray-500">Showing 1-5 of 57</p>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-50">Prev</button>
              <button className="px-3 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-gray-300">Next</button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

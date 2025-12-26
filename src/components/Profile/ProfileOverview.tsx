"use client"

import { useState } from "react"
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { ChevronDown, Wallet, ArrowUpRight, ArrowDownLeft, Filter, Settings, Edit3, Sparkles } from "lucide-react"
import { motion, AnimatePresence, type Variants } from "framer-motion"

// --- DUMMY DATA (Untouched) ---
const chartData = [
  { day: 1, value: 4000 }, { day: 5, value: 6200 }, { day: 10, value: 5100 },
  { day: 15, value: 8300 }, { day: 20, value: 6500 }, { day: 25, value: 9800 },
  { day: 30, value: 8200 },
]

const holdings = [
  { name: "Bitcoin", ticker: "BTC", price: "$50,321.80", amount: "0.45 BTC", change: "+2.4%", color: "bg-orange-100 text-orange-500 border-orange-200" },
  { name: "Ethereum", ticker: "ETH", price: "$3,123.45", amount: "4.20 ETH", change: "-1.1%", color: "bg-blue-100 text-blue-500 border-blue-200" },
  { name: "Solana", ticker: "SOL", price: "$125.50", amount: "150 SOL", change: "+5.7%", color: "bg-indigo-100 text-indigo-500 border-indigo-200" },
  { name: "Nyra Token", ticker: "NYRA", price: "$1.20", amount: "5,000 NYRA", change: "+12.4%", color: "bg-purple-100 text-purple-500 border-purple-200" },
]

const transactions = [
  { date: "Oct 26, 14:30", type: "Buy", asset: "Bitcoin (BTC)", amount: "+0.05 BTC", price: "$60,123.45", status: "Completed" },
  { date: "Oct 25, 18:00", type: "Sell", asset: "Ethereum (ETH)", amount: "-2.0 ETH", price: "$3,450.00", status: "Completed" },
  { date: "Oct 24, 09:15", type: "Deposit", asset: "USDC", amount: "+$5,000", price: "$1.00", status: "Completed" },
  { date: "Oct 22, 11:45", type: "Buy", asset: "Solana (SOL)", amount: "+10.0 SOL", price: "$125.50", status: "Pending" },
  { date: "Oct 20, 20:05", type: "Withdraw", asset: "USDC", amount: "-$1,000", price: "$1.00", status: "Failed" },
]

// --- HIGH-END ANIMATION VARIANTS ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.08, delayChildren: 0.1 } 
  },
}

const cardReveal: Variants = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)", scale: 0.98 },
  visible: { 
    opacity: 1, y: 0, filter: "blur(0px)", scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 20 } 
  },
}

const rowReveal: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
}

// --- HELPER COMPONENTS ---
const ShimmerEffect = () => (
  <motion.div
    initial={{ x: "-100%" }}
    animate={{ x: "100%" }}
    transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 5 }}
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10"
  />
)

const HoldingItem = ({ name, ticker, price, amount, change, color }: any) => (
  <motion.div
    variants={rowReveal}
    whileHover={{ backgroundColor: "rgba(255,255,255,0.9)", x: 5, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-indigo-100 hover:shadow-sm transition-all cursor-pointer group"
  >
    <div className="flex items-center gap-4">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg border ${color} shadow-sm group-hover:rotate-12 transition-transform duration-500`}>
        {ticker[0]}
      </div>
      <div>
        <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{name}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{ticker}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-bold text-slate-800">{price}</p>
      <div className="flex items-center justify-end gap-1.5 mt-0.5">
        <span className="text-[11px] font-bold text-slate-400">{amount}</span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-tight ${change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
          {change}
        </span>
      </div>
    </div>
  </motion.div>
)

export function ProfileOverview() {
  const [timeRange, setTimeRange] = useState("1M")

  const typeStyles: Record<string, string> = {
    Buy: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Sell: "bg-rose-50 text-rose-700 border-rose-100",
    Deposit: "bg-indigo-50 text-indigo-700 border-indigo-100",
    Withdraw: "bg-orange-50 text-orange-700 border-orange-100",
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-12 pb-20">
      
      {/* 1. Header with Breathing Avatar */}
      <motion.div variants={cardReveal} className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
          <div className="relative">
            {/* Animated Ring */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-2 bg-gradient-to-tr from-pink-400 via-purple-400 to-indigo-400 rounded-full opacity-40 blur-sm" 
            />
            <div className="relative w-32 h-32 rounded-full bg-white p-[3px] shadow-2xl">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Satoshi" alt="Avatar" className="w-full h-full rounded-full object-cover ring-2 ring-white" />
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-1 right-1 w-7 h-7 bg-emerald-500 border-4 border-white rounded-full shadow-md z-10" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl font-bold text-slate-900 tracking-tighter leading-tight"
            >
              Satoshi Nakamoto
            </motion.h1>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
              <span className="text-slate-400 font-semibold text-lg tracking-tight">@satoshi_n</span>
              <span className="hidden md:block w-1.5 h-1.5 bg-indigo-100 rounded-full" />
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50/50 text-indigo-600 border border-indigo-100 rounded-2xl text-sm font-mono font-bold cursor-pointer"
              >
                 <Wallet size={14} /> 0x12...4B9a
              </motion.div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 self-center">
           <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 px-6 py-3 rounded-[1.2rem] bg-white border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest shadow-sm hover:shadow-md transition-all">
             <Edit3 size={14} /> Edit Profile
           </motion.button>
           <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 px-6 py-3 rounded-[1.2rem] bg-slate-900 text-white font-bold text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all">
             <Settings size={14} /> Settings
           </motion.button>
        </div>
      </motion.div>

      {/* 2. Main Bento Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Chart Card */}
        <motion.div variants={cardReveal} className="lg:col-span-2 bg-white/60 backdrop-blur-3xl border border-white rounded-[3rem] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.02)] relative overflow-hidden group">
          <ShimmerEffect />
          <div className="relative z-20 flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2">Portfolio Analytics</p>
              <div className="flex items-baseline gap-4">
                 <motion.span 
                   key={timeRange}
                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                   className="font-display text-6xl font-bold text-slate-900 tracking-tighter"
                 >
                   $125,843.50
                 </motion.span>
                 <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-black rounded-xl">
                    <ArrowUpRight size={16} strokeWidth={3} /> 5.21%
                 </div>
              </div>
            </div>
            <div className="flex bg-slate-50 border border-slate-100 p-1.5 rounded-2xl backdrop-blur-sm">
              {["1W", "1M", "1Y", "ALL"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
                    timeRange === range ? "bg-white text-indigo-600 shadow-lg scale-105" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-72 w-full relative z-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="8 8" />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.06)', 
                    padding: '12px 20px',
                    fontSize: '14px',
                    fontWeight: '800'
                  }} 
                />
                <XAxis dataKey="day" hide />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="url(#lineGradient)" 
                  strokeWidth={5} 
                  fill="url(#chartGradient)" 
                  animationDuration={3000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Holdings Card */}
        <motion.div variants={cardReveal} className="bg-white/60 backdrop-blur-3xl border border-white rounded-[3rem] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.02)] flex flex-col relative overflow-hidden group">
          <div className="relative z-20 flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Holdings <Sparkles size={16} className="text-indigo-400" />
            </h2>
            <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-400">View All</button>
          </div>
          <div className="space-y-1 overflow-y-auto no-scrollbar flex-grow relative z-20">
            {holdings.map((holding) => (
              <HoldingItem key={holding.name} {...holding} />
            ))}
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-8 w-full py-4 rounded-2xl bg-indigo-600 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
          >
             + ADD ASSET
          </motion.button>
        </motion.div>
      </div>

      {/* 3. Staggered Activity Log Table */}
      <motion.div variants={cardReveal} className="space-y-6">
        <div className="flex justify-between items-center px-4">
           <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recent Activity</h2>
           <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-indigo-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all">
              <Filter size={14} /> Refine Log
           </button>
        </div>

        <div className="bg-white/60 backdrop-blur-3xl border border-white rounded-[2.5rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.03)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100">
                  {["Date", "Type", "Asset", "Amount", "Price", "Status"].map((header) => (
                    <th key={header} scope="col" className="px-8 py-7">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map((tx, index) => (
                  <motion.tr 
                    key={index} 
                    variants={rowReveal}
                    className="hover:bg-indigo-50/20 transition-all duration-300 group cursor-default"
                  >
                    <td className="px-8 py-6 text-slate-500 font-medium">{tx.date}</td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-sm ${typeStyles[tx.type]}`}>
                        {tx.type === 'Buy' || tx.type === 'Deposit' ? <ArrowDownLeft size={12} className="mr-1.5" /> : <ArrowUpRight size={12} className="mr-1.5" />}
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-bold text-slate-900">{tx.asset}</td>
                    <td className={`px-8 py-6 font-mono font-bold whitespace-nowrap text-[15px] ${tx.amount.startsWith('+') ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.amount}
                    </td>
                    <td className="px-8 py-6 text-slate-400 font-mono text-xs">{tx.price}</td>
                    <td className="px-8 py-6">
                      <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm group-hover:border-indigo-100 transition-colors">
                        <motion.span 
                          animate={tx.status === 'Pending' ? { scale: [1, 1.3, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className={`w-2 h-2 rounded-full ${tx.status === 'Completed' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : tx.status === 'Pending' ? 'bg-amber-400' : 'bg-rose-500'}`} 
                        />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${tx.status === 'Completed' ? 'text-emerald-600' : tx.status === 'Pending' ? 'text-amber-600' : 'text-rose-600'}`}>{tx.status}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

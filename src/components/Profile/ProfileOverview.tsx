"use client"

import React from "react"
import { motion } from "framer-motion"
import { 
  AreaChart, Area, ResponsiveContainer, 
  XAxis, YAxis, Tooltip, CartesianGrid 
} from "recharts"
import { 
  Shield, Fingerprint, Copy, TrendingUp, 
  Settings2, RefreshCw, ArrowUpRight, ArrowDownLeft 
} from "lucide-react"

// --- STYLES ---
const glassCard = "bg-white/65 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]"

// --- DATA ---
const chartData = [
  { val: 2000 }, { val: 2200 }, { val: 1900 }, { val: 2400 }, 
  { val: 2100 }, { val: 2800 }, { val: 2600 }, { val: 3200 }
]

const holdings = [
  { name: "ETH-PERP", platform: "Uniswap v3", value: "$12,450", change: "+12.5%", pnl: "+$450.23", color: "blue", type: "eth" },
  { name: "BTC-PERP", platform: "GMX Leverage", value: "$8,240", change: "+5.2%", pnl: "+$120.40", color: "orange", type: "btc" },
  { name: "ARB-PERP", platform: "Gains Network", value: "$4,100", change: "-1.2%", pnl: "-$24.50", color: "cyan", type: "arb" },
]

export function ProfileOverview() {
  return (
    <div className="space-y-10">
      {/* 1. PROFILE HEADER SECTION */}
      <section className="flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
        <div className="flex items-center gap-8 group">
          <div className="relative size-28 shrink-0">
            {/* Spinning Dashed Borders from Design */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-500/30"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-dotted border-cyan-500/30 scale-110"
            />
            <div className="relative h-full w-full rounded-full overflow-hidden border-4 border-white shadow-[0_0_20px_rgba(79,70,229,0.3)]">
              <img 
                alt="User Avatar" 
                className="h-full w-full object-cover" 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
              />
            </div>
            <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-white shadow-lg flex items-center justify-center text-emerald-500 z-10">
              <Shield size={18} fill="currentColor" fillOpacity={0.1} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-cyan-500 transition-all duration-300">
                nyra_whale.eth
              </h1>
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 text-xs font-bold uppercase tracking-wider border border-indigo-500/20">Pro</span>
            </div>
            <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
              <div className="flex items-center gap-2 hover:text-indigo-600 cursor-pointer transition-colors">
                <Fingerprint size={16} />
                <span className="font-mono">0x71C...399A</span>
                <Copy size={14} className="opacity-50" />
              </div>
              <div className="flex items-center gap-2 text-emerald-500">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold">Privacy: High</span>
              </div>
            </div>
          </div>
        </div>
        <button className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-indigo-500/50 hover:text-indigo-600 hover:shadow-lg hover:-translate-y-0.5 transition-all">
          Edit Profile
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: CHART & HOLDINGS */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* TOTAL NET WORTH CARD */}
          <div className={`relative h-[450px] rounded-[2rem] overflow-hidden ${glassCard}`}>
            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
            
            <div className="relative h-full flex flex-col items-center justify-center z-10">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center z-20"
              >
                <p className="text-[11px] font-black text-slate-400 tracking-[0.3em] uppercase mb-1">Total Net Worth</p>
                <h2 className="text-7xl font-black text-slate-900 tracking-tighter">
                  $142,590<span className="text-3xl text-slate-300">.00</span>
                </h2>
                <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-bold border border-emerald-500/20">
                  <TrendingUp size={16} /> +2.4% (24h)
                </div>
              </motion.div>

              {/* Chart Overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-[250px] opacity-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="val" 
                      stroke="#6366f1" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorVal)" 
                      animationDuration={2500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* PORTFOLIO HOLDINGS GRID */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-bold text-slate-800">Portfolio Holdings</h3>
              <button className="text-sm font-bold text-indigo-600 hover:text-indigo-400 transition-colors uppercase tracking-widest">Manage Assets</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {holdings.map((item, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`p-6 rounded-2xl relative overflow-hidden group cursor-pointer ${glassCard}`}
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="size-12 rounded-xl bg-slate-50 flex items-center justify-center shadow-inner group-hover:bg-indigo-50 transition-colors">
                      {/* Using dynamic letters as placeholders for icons in design */}
                      <span className="font-black text-slate-300 group-hover:text-indigo-400 text-xl">{item.name[0]}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${item.change.startsWith('+') ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                      {item.change}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.name}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.platform}</p>
                  </div>
                  <div className="mt-5 pt-5 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-slate-300 font-black uppercase mb-1">Value</p>
                      <p className="text-xl font-bold text-slate-900">{item.value}</p>
                    </div>
                    <div className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-slate-300 font-black uppercase mb-1">PnL</p>
                      <p className={`text-sm font-bold ${item.pnl.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{item.pnl}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVITY STREAM */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-slate-800">Activity Stream</h3>
            <button className="size-8 rounded-full hover:bg-white flex items-center justify-center transition-all text-slate-400 hover:text-indigo-600">
              <Settings2 size={18} />
            </button>
          </div>
          
          <div className={`${glassCard} rounded-[2.5rem] p-8 min-h-[700px] flex flex-col relative`}>
            {/* The Timeline Line */}
            <div className="absolute left-[2.45rem] md:left-1/2 top-10 bottom-20 w-0.5 bg-gradient-to-b from-transparent via-slate-200 to-transparent -translate-x-1/2" />
            
            <div className="space-y-10 relative">
              <TimelineItem 
                side="right" 
                title="Collateral +" 
                time="2m ago" 
                desc="Increased ETH-PERP position" 
                val="+ 5.00 ETH" 
                status="success" 
                icon={<ArrowUpRight size={18}/>} 
              />
              <TimelineItem 
                side="left" 
                title="Close Short" 
                time="4h ago" 
                desc="SOL-PERP Limit Order" 
                val="$2,450.00" 
                status="danger" 
                icon={<ArrowDownLeft size={18}/>} 
              />
              <TimelineItem 
                side="right" 
                title="Swapping" 
                time="Pending" 
                desc="USDC to WBTC bridge" 
                status="pending" 
                icon={<RefreshCw size={18} className="animate-spin" />} 
              />
            </div>

            <div className="mt-auto pt-8 text-center">
              <button className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em] hover:text-cyan-500 transition-colors">View Full History</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineItem({ side, title, time, desc, val, status, icon }: any) {
  const isRight = side === 'right';
  const colorClass = status === 'success' ? 'bg-emerald-50 text-emerald-500' : 
                     status === 'danger' ? 'bg-rose-50 text-rose-500' : 
                     'bg-indigo-50 text-indigo-500';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative flex items-center justify-between md:justify-normal group ${!isRight ? 'md:flex-row-reverse' : ''}`}
    >
      {/* Icon Node */}
      <div className={`flex items-center justify-center size-10 rounded-full border border-white shadow-sm shrink-0 z-10 md:order-1 transition-transform group-hover:scale-110 ${colorClass} ${isRight ? 'md:translate-x-1/2' : 'md:-translate-x-1/2'}`}>
        {icon}
      </div>

      {/* Content Card */}
      <div className={`w-[calc(100%-3.5rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer ${status === 'pending' ? 'bg-gradient-to-br from-white to-indigo-50/30' : ''}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-slate-800 text-sm">{title}</span>
          {status === 'pending' ? (
            <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-black uppercase">Pending</span>
          ) : (
            <span className="text-[10px] text-slate-400 font-bold">{time}</span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mb-2">{desc}</p>
        {val && <div className={`text-sm font-black ${status === 'success' ? 'text-emerald-500' : 'text-slate-900'}`}>{val}</div>}
      </div>
    </motion.div>
  )
}

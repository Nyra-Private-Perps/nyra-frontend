import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { ArrowLeft, Info, Wallet, TrendingUp, Layers, History, Coins, ExternalLink, ShieldCheck, Activity } from "lucide-react"
import { Link } from "react-router-dom" 
import { motion, AnimatePresence } from "framer-motion"
import { contractService } from "../../services/contractService"
import { TransactionModal } from "./TransactionModal" // Ensure you have this file
import { ErrorModal, InProgressModal, ModalWrapper, SuccessModal } from "../DepositAnimation/StatusModals" // Ensure you have these

// --- Types ---
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

// --- Helper Components ---

const StatRow = ({ label, value, subValue }: { label: string; value: string; subValue?: string }) => (
  <div className="flex justify-between items-center py-4 border-b border-white/5 last:border-0 group">
    <span className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">{label}</span>
    <div className="text-right">
      <span className="font-mono text-white text-base font-medium">{value}</span>
      {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
    </div>
  </div>
)

const EmptyState = ({ message, icon: Icon }: { message: string; icon: any }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
      <Icon className="text-gray-500 w-6 h-6" />
    </div>
    <p className="text-gray-400 text-sm">{message}</p>
  </div>
)

const HoldingsTable = () => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="text-xs text-gray-500 uppercase bg-white/5">
        <tr>
          <th className="px-6 py-4 rounded-l-lg">Asset</th>
          <th className="px-6 py-4">Balance</th>
          <th className="px-6 py-4">Value (USD)</th>
          <th className="px-6 py-4 rounded-r-lg text-right">Allocation</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {/* Mock Data Row */}
        <tr className="hover:bg-white/5 transition-colors">
          <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-300">ETH</div>
            Ethereum
          </td>
          <td className="px-6 py-4 text-gray-300">14.52</td>
          <td className="px-6 py-4 text-gray-300">$42,350.12</td>
          <td className="px-6 py-4 text-right text-emerald-400">45%</td>
        </tr>
         <tr className="hover:bg-white/5 transition-colors">
          <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-[10px] text-green-300">USDC</div>
            USDC
          </td>
          <td className="px-6 py-4 text-gray-300">51,200.00</td>
          <td className="px-6 py-4 text-gray-300">$51,200.00</td>
          <td className="px-6 py-4 text-right text-emerald-400">55%</td>
        </tr>
      </tbody>
    </table>
  </div>
)

const TransactionsTable = () => (
  <EmptyState message="No recent transactions found for this vault." icon={History} />
)

// --- Main Component ---

export function VaultDetail({ vault }: { vault: Vault }) {
  const { isConnected } = useAccount()
  
  // State
  const [activeInfoTab, setActiveInfoTab] = useState<"Overview" | "Holdings" | "Transactions">("Overview")
  const [timeRange, setTimeRange] = useState("1M")
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<"deposit" | "withdraw">("deposit")
  
  // Transaction Flow States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)

  // Chart Data Preparation
  const chartData = vault.chartData.map((d, i) => ({ 
    name: `Day ${i + 1}`, 
    uv: d.v,
    formatted: `$${d.v.toFixed(2)}`
  }))

  // Handlers
  const openModal = (type: "deposit" | "withdraw") => {
    setModalType(type)
    setIsModalOpen(true)
  }

  const handleTransactionSubmit = async (amount: string, type: "deposit" | "withdraw") => {
    setIsModalOpen(false) // Close input modal
    setIsProcessing(true) // Open loading modal
    
    try {
      if (type === "deposit") {
        setProcessingStep(1) // Step 1: Approve
        // Mocking delays for UI demonstration
        await new Promise(r => setTimeout(r, 1500))
        
        setProcessingStep(2) // Step 2: Confirming Approval
        await new Promise(r => setTimeout(r, 1500))

        setProcessingStep(3) // Step 3: Deposit
        // In real app: await contractService.depositAmount(amount)
        await new Promise(r => setTimeout(r, 1500))
        
        setProcessingStep(4) // Step 4: Finalizing
        await new Promise(r => setTimeout(r, 1000))

        setIsProcessing(false)
        setIsSuccess(true)
      } else {
        setProcessingStep(1)
        await new Promise(r => setTimeout(r, 2000))
        setIsProcessing(false)
        setIsSuccess(true)
      }
    } catch (error) {
      console.error(error)
      setIsProcessing(false)
      setIsError(true)
    }
  }

  const resetStatusModals = () => {
    setIsSuccess(false)
    setIsError(false)
    setProcessingStep(0)
  }

  // --- Render ---
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6 }}
      className="text-white relative"
    >
      {/* 1. Breadcrumbs */}
      <Link 
        to="/vaults" 
        className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
        <span className="text-sm font-medium">Back to Strategies</span>
      </Link>

      {/* 2. Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
         <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                  <Activity className="text-white w-6 h-6" />
               </div>
               <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">{vault.name}</h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
               <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-bold border border-blue-500/20 flex items-center gap-1">
                  <Layers size={12} /> {vault.chain}
               </span>
               <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                 vault.risk.includes("High") ? "bg-red-500/10 text-red-400 border-red-500/20" :
                 vault.risk.includes("Medium") ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                 "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
               }`}>
                  <ShieldCheck size={12} /> {vault.risk}
               </span>
               <a href="#" className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors ml-2">
                  View Contract <ExternalLink size={10} />
               </a>
            </div>
         </div>

         <div className="flex flex-col items-start lg:items-end">
            <p className="text-gray-400 text-sm font-medium mb-1">Current APY</p>
            <div className="flex items-baseline gap-2">
               <span className="text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  {vault.apy}
               </span>
               <span className="text-emerald-500 text-sm font-bold bg-emerald-500/10 px-2 py-0.5 rounded">+2.4% this week</span>
            </div>
         </div>
      </div>

      {/* 3. Main Grid Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-8">
           
           {/* Chart Container */}
           <div className="bg-gray-900/60 border border-white/10 rounded-3xl p-1 backdrop-blur-xl shadow-2xl">
              <div className="p-6 md:p-8">
                 <div className="flex justify-between items-center mb-8">
                    <div>
                       <p className="text-gray-400 text-sm font-medium">Total Value Locked</p>
                       <p className="text-2xl font-bold text-white mt-1">{vault.tvl}</p>
                    </div>
                    
                    {/* Time Range Selector */}
                    <div className="bg-white/5 rounded-xl p-1 border border-white/5 flex gap-1">
                       {["1D", "1W", "1M", "ALL"].map(range => (
                          <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              timeRange === range 
                                ? 'bg-white/10 text-white shadow-sm border border-white/10' 
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            {range}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={chartData}>
                          <defs>
                             <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis 
                            dataKey="name" 
                            hide 
                            axisLine={false} 
                            tickLine={false} 
                          />
                          <Tooltip 
                             contentStyle={{ 
                               backgroundColor: "rgba(10, 10, 10, 0.9)", 
                               border: "1px solid rgba(255,255,255,0.1)", 
                               borderRadius: "12px",
                               boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)"
                             }}
                             itemStyle={{ color: "#fff", fontWeight: "bold" }}
                             labelStyle={{ color: "#9ca3af", marginBottom: "4px" }}
                             cursor={{ stroke: "rgba(255,255,255,0.2)", strokeWidth: 1, strokeDasharray: "4 4" }}
                          />
                          <Area 
                             type="monotone" 
                             dataKey="uv" 
                             stroke="#3B82F6" 
                             strokeWidth={3} 
                             fill="url(#chartGradient)" 
                             animationDuration={1500}
                          />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           {/* Info Tabs */}
           <div className="bg-gray-900/60 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl min-h-[400px]">
              <div className="flex border-b border-white/5 bg-white/5 px-6">
                 {["Overview", "Holdings", "Transactions"].map(tab => (
                    <button
                       key={tab}
                       onClick={() => setActiveInfoTab(tab as any)}
                       className={`relative py-5 px-6 text-sm font-semibold transition-colors ${
                         activeInfoTab === tab ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
                       }`}
                    >
                       {tab}
                       {activeInfoTab === tab && (
                         <motion.div 
                           layoutId="activeTab" 
                           className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                         />
                       )}
                    </button>
                 ))}
              </div>
              
              <div className="p-8">
                 <AnimatePresence mode="wait">
                    {activeInfoTab === "Overview" && (
                       <motion.div 
                         key="overview"
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -10 }}
                         transition={{ duration: 0.3 }}
                       >
                          <h3 className="text-lg font-bold text-white mb-4">Strategy Logic</h3>
                          <p className="text-gray-400 leading-relaxed text-base mb-6">
                             This vault utilizes <span className="text-white font-semibold">{vault.project}</span> to execute delta-neutral arbitrage strategies on {vault.symbol} perpetuals. 
                             By leveraging a Trusted Execution Environment (TEE), the algorithm analyzes order book depth across fragmented liquidity venues 
                             to identify mispricing opportunities without revealing intent to the public mempool.
                          </p>
                          
                          <h3 className="text-lg font-bold text-white mb-4">Fees & Limits</h3>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Management Fee</p>
                                <p className="text-xl font-mono text-white">0%</p>
                             </div>
                             <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Performance Fee</p>
                                <p className="text-xl font-mono text-white">10%</p>
                             </div>
                          </div>
                       </motion.div>
                    )}
                    {activeInfoTab === "Holdings" && (
                       <motion.div 
                         key="holdings"
                         initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                       >
                          <HoldingsTable />
                       </motion.div>
                    )}
                    {activeInfoTab === "Transactions" && (
                       <motion.div 
                         key="txs"
                         initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                       >
                          <TransactionsTable />
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="space-y-6">
           
           {/* Your Position Card */}
           <div className="relative overflow-hidden rounded-3xl p-1 bg-gradient-to-b from-blue-500/20 to-purple-500/10 border border-white/10 shadow-2xl">
              <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-xl rounded-3xl" />
              <div className="relative p-6 z-10">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                       <Wallet className="text-blue-400 w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Your Position</h3>
                 </div>
                 
                 <div className="mb-8">
                    <p className="text-gray-400 text-sm font-medium mb-1">Current Balance</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-white">{isConnected ? "$1,240.50" : "$0.00"}</p>
                      {isConnected && <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">+12%</span>}
                    </div>
                    {isConnected && <p className="text-xs text-gray-500 mt-2">~ 0.54 ETH</p>}
                 </div>

                 <div className="flex gap-3">
                    <button 
                      onClick={() => openModal("deposit")} 
                      className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 active:scale-95"
                    >
                       Deposit
                    </button>
                    <button 
                      onClick={() => openModal("withdraw")} 
                      className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold transition-all active:scale-95"
                    >
                       Withdraw
                    </button>
                 </div>
                 
                 {!isConnected && (
                    <div className="mt-6 pt-4 border-t border-white/10">
                       <div className="flex gap-3 text-xs text-yellow-500/80 bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10">
                          <Info className="shrink-0 w-4 h-4" />
                          <p>Connect your wallet to view your real balance and start trading.</p>
                       </div>
                    </div>
                 )}
              </div>
           </div>

           {/* Stats Card */}
           <div className="bg-gray-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Vault Stats</h3>
              <div className="space-y-1">
                 <StatRow label="24h Volume" value="$4,250,000" />
                 <StatRow label="Sharpe Ratio" value="2.45" subValue="Top 5%" />
                 <StatRow label="Max Drawdown" value="-4.12%" />
                 <StatRow label="Last Harvest" value="4h ago" />
              </div>
           </div>
           
           {/* Help Card */}
           <div className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border border-white/5 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-3">
                 <Coins className="text-indigo-400" />
                 <h3 className="font-bold text-white">Need Funds?</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">Mint testnet tokens to start testing strategies without risk.</p>
              <Link to="/faucet" className="block w-full py-3 text-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-indigo-300 transition-colors">
                 Go to Faucet
              </Link>
           </div>

        </div>
      </div>

      {/* --- Modals --- */}
      <AnimatePresence>
         {isModalOpen && (
            <TransactionModal 
               type={modalType} 
               onClose={() => setIsModalOpen(false)} 
               onSubmit={handleTransactionSubmit} 
            />
         )}
         {isProcessing && (
            <ModalWrapper>
               <InProgressModal step={processingStep} maxSteps={4} />
            </ModalWrapper>
         )}
         {isSuccess && (
            <ModalWrapper>
               <SuccessModal onClose={resetStatusModals} />
            </ModalWrapper>
         )}
         {isError && (
            <ModalWrapper>
               <ErrorModal onClose={resetStatusModals} />
            </ModalWrapper>
         )}
      </AnimatePresence>
    </motion.div>
  )
}
"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts"
import { TransactionModal } from "./TransactionModal"
import { ArrowLeft, Info, Activity, ShieldCheck, Wallet } from "lucide-react"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { contractService } from "../../services/contractService";
import { ErrorModal, InProgressModal, ModalWrapper, SuccessModal } from "../DepositAnimation/StatusModals"
import { Link } from "react-router-dom"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, ease: "easeOut" },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

// Styled StatCard component - Keeping your original logic/props
const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-4 border-b border-white/5 last:border-0 group">
    <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{label}</span>
    <span className="text-sm font-mono font-medium text-white">{value}</span>
  </div>
)

// Keeping your original Table structures exactly as they were
const HoldingsTable = () => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="text-xs text-gray-500 uppercase bg-white/5">
        <tr>
          <th scope="col" className="px-6 py-4 font-medium rounded-l-lg">Token</th>
          <th scope="col" className="px-6 py-4 font-medium">Value</th>
          <th scope="col" className="px-6 py-4 font-medium text-right rounded-r-lg">Amount</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        <tr>
          <td colSpan={3} className="text-center py-16 px-6 text-gray-500">
            You do not have any holdings in this vault yet.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

const TransactionsTable = () => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="text-xs text-gray-500 uppercase bg-white/5">
        <tr>
          <th scope="col" className="px-6 py-4 font-medium rounded-l-lg">Date</th>
          <th scope="col" className="px-6 py-4 font-medium">Type</th>
          <th scope="col" className="px-6 py-4 font-medium">Asset</th>
          <th scope="col" className="px-6 py-4 font-medium">Amount</th>
          <th scope="col" className="px-6 py-4 font-medium">Price</th>
          <th scope="col" className="px-6 py-4 font-medium text-right rounded-r-lg">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        <tr>
          <td colSpan={6} className="text-center py-16 px-6 text-gray-500">
            You have no transactions for this vault yet.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

export function VaultDetail({ vault }: { vault: any }) {
  const { isConnected } = useAccount()
  const [activeInfoTab, setActiveInfoTab] = useState<"Overview" | "Holdings" | "My Transactions">("Overview")
  const [timeRange, setTimeRange] = useState("1Y")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<"deposit" | "withdraw">("deposit")
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [displayPerformance, setDisplayPerformance] = useState("");

  const strategy = `This vault uses ${vault.project} to trade ${vault.symbol} perpetuals. It employs automated risk management with dynamic leverage adjustment based on market volatility. The strategy aims for capital appreciation while preserving principal through TEE-secured execution.`
  const userBalance = isConnected ? `$${Math.round(vault.tvlUsd * 0.001).toLocaleString()}` : "Connect Wallet"
  const userTotalBalance = isConnected ? "$100" : "Connect Wallet"
  const userTotalGain = isConnected ? "+$10 (+1.3%)" : "Connect to View"

  const chartData = vault.chartData.map((d: any, i: number) => ({ name: `Day ${i + 1}`, uv: d.v }))

  const riskLevelStyles: { [key: string]: string } = {
    "Low Risk": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    "Medium Risk": "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    "High Risk": "text-red-400 bg-red-500/10 border-red-500/20",
  }

  useEffect(() => {
    const calculatedPerformance = `+${(vault.apyRaw * (Math.random() * 0.5 + 0.5)).toFixed(1)}%`;
    setDisplayPerformance(calculatedPerformance);
  }, [vault.apyRaw]);

  useEffect(() => {
    if (!isConnected) return;
    const handleApproveConfirmed = (txHash: string) => setProcessingStep(2);
    const handleDepositConfirmed = (txHash: string) => {
      setProcessingStep(4);
      setTimeout(() => { setIsProcessing(false); setIsSuccess(true); }, 2000);
    };
    contractService.on("approveConfirmed", handleApproveConfirmed);
    contractService.on("depositConfirmed", handleDepositConfirmed);
    return () => {
      contractService.off("approveConfirmed", handleApproveConfirmed);
      contractService.off("depositConfirmed", handleDepositConfirmed);
    };
  }, [isConnected]);

  const openModal = (type: "deposit" | "withdraw") => {
    setModalType(type);
    setIsModalOpen(true);
  }

  const handleTransactionSubmit = async (amount: string, type: "deposit" | "withdraw") => {
    setIsTxModalOpen(false);
    setIsProcessing(true);
    try {
      if (type === "deposit") {
        setProcessingStep(1);
        const approveTx = await contractService.approveToken(amount);
        setProcessingStep(2);
        if (!approveTx) throw new Error("User rejected approval transaction");
        setProcessingStep(3);
        const depositTx = await contractService.depositAmount(amount);
        if (!depositTx) throw new Error("User rejected deposit transaction");
      } else {
        setProcessingStep(1);
        const success = await contractService.withdrawAmount(amount);
        if (!success) throw new Error("Withdrawal failed");
        setProcessingStep(4);
        setTimeout(() => { setIsProcessing(false); setIsSuccess(true); }, 1500);
      }
    } catch (error) {
      setIsProcessing(false);
      setIsError(true);
    }
  };

  const resetStatusModals = () => {
    setIsSuccess(false);
    setIsError(false);
    setProcessingStep(0);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Link to="/vaults" className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 text-sm font-medium transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to All Vaults
        </Link>
      </motion.div>

      <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
        <div className="flex items-center gap-4 mb-10">
           <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
              <Activity className="text-blue-400 w-6 h-6" />
           </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">{vault.name}</h1>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <motion.div className="lg:col-span-2 space-y-8" variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          
          {/* Chart Section */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">Vault Performance</p>
                <p className="text-3xl font-bold text-white">{userBalance}</p>
                <p className="text-sm font-bold text-emerald-400 mt-1">{displayPerformance} Past 1Y</p>
              </div>
              <div className="flex bg-white/5 border border-white/5 rounded-xl p-1">
                {["1M", "ALL"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      timeRange === range ? "bg-white/10 text-white shadow-sm border border-white/10" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-80 -ml-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    cursor={{ stroke: "#3B82F6", strokeWidth: 1, strokeDasharray: "4 4" }}
                    contentStyle={{
                      background: "#0a0a0a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <XAxis dataKey="name" hide />
                  <Area type="monotone" dataKey="uv" stroke="#3B82F6" strokeWidth={3} fill="url(#chartGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden min-h-[400px]">
            <div className="flex border-b border-white/5 px-6 bg-white/5">
            {["Overview", "Holdings", "My Transactions"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveInfoTab(tab as any)}
                  className={`relative py-5 px-6 text-sm font-bold transition-colors ${
                    activeInfoTab === tab ? "text-blue-400" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab}
                  {activeInfoTab === tab && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  )}
                </button>
              ))}
            </div>
            <div className="p-8">
              <AnimatePresence mode="wait">
                {activeInfoTab === 'Overview' && (
                  <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <h3 className="text-lg font-bold text-white mb-4">Strategy Logic</h3>
                    <p className="text-gray-400 text-md leading-relaxed">{strategy}</p>
                  </motion.div>
                )}
                {activeInfoTab === 'Holdings' && (
                  <motion.div key="holdings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <HoldingsTable />
                  </motion.div>
                )}
                {activeInfoTab === 'My Transactions' && (
                  <motion.div key="transactions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    <TransactionsTable />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Right Column */}
        <motion.div className="space-y-6" variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
          
          {/* Balance Card */}
          <div className="bg-gradient-to-b from-blue-600/10 to-purple-600/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Wallet className="text-blue-400 w-5 h-5" />
                <h3 className="text-lg font-bold text-white">My Position</h3>
              </div>
              <p className="text-sm font-medium text-gray-400 mb-1">Total Balance</p>
              <p className="text-4xl font-bold text-white mb-1">{userTotalBalance}</p>
              <p className="text-sm font-bold text-emerald-400 mb-8">{userTotalGain} All Time</p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => openModal("deposit")}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  Deposit
                </button>
                <button
                  onClick={() => openModal("withdraw")}
                  className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-bold transition-all active:scale-95"
                >
                  Withdraw
                </button>
              </div>

              <div className="flex items-start gap-3 text-xs p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 mt-8 text-blue-300/80">
                <Info size={16} className="shrink-0" />
                <span>Mint your NYRA tokens from the Faucet before depositing.</span>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Vault Stats</h3>
            <StatCard label="Current APY" value={vault.apy} />
            <StatCard label="TVL" value={vault.tvl} />
            <div className="flex justify-between items-center pt-4">
              <span className="text-sm text-gray-400">Risk Level</span>
              <span className={`font-bold px-3 py-1 rounded-full text-[10px] border flex items-center gap-1.5 ${riskLevelStyles[vault.risk]}`}>
                <ShieldCheck size={12} /> {vault.risk}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {(isModalOpen || isTxModalOpen) && (
          <TransactionModal
            type={modalType}
            onClose={() => { setIsModalOpen(false); setIsTxModalOpen(false); }}
            onSubmit={handleTransactionSubmit}
          />
        )}
        {isProcessing && (
          <ModalWrapper><InProgressModal step={processingStep} maxSteps={4} /></ModalWrapper>
        )}
        {isSuccess && (
          <ModalWrapper><SuccessModal onClose={resetStatusModals} /></ModalWrapper>
        )}
        {isError && (
          <ModalWrapper><ErrorModal onClose={resetStatusModals} /></ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  )
}

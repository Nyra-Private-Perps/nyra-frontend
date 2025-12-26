import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts"
import { TransactionModal } from "./TransactionModal"
import { ArrowLeft, Info, Activity, ShieldCheck, Wallet, TrendingUp } from "lucide-react"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import { contractService } from "../../services/contractService";
import { ErrorModal, InProgressModal, ModalWrapper, SuccessModal } from "../DepositAnimation/StatusModals"
import { Link } from "react-router-dom"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const StatRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-4 border-b border-indigo-50 last:border-0">
    <span className="text-sm font-medium text-gray-400">{label}</span>
    <span className="text-base font-bold text-gray-900 tracking-tight">{value}</span>
  </div>
)

export function VaultDetail({ vault }: { vault: any }) {
  const { isConnected } = useAccount()
  const [activeInfoTab, setActiveInfoTab] = useState<"Overview" | "Holdings" | "My Transactions">("Overview")
  const [timeRange, setTimeRange] = useState("1M")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<"deposit" | "withdraw">("deposit")
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [displayPerformance, setDisplayPerformance] = useState("");

  const strategy = `This vault uses ${vault.project} to trade ${vault.symbol} perpetuals. It employs automated risk management with dynamic leverage adjustment based on market volatility. The strategy aims for capital appreciation while preserving principal through TEE-secured execution.`
  const userBalance = isConnected ? `$${Math.round(vault.tvlUsd * 0.001).toLocaleString()}` : "$0.00"
  const userTotalBalance = isConnected ? "$100" : "$0.00"
  const userTotalGain = isConnected ? "+$10 (+1.3%)" : "+$0.00"

  const chartData = vault.chartData.map((d: any, i: number) => ({ name: `Day ${i + 1}`, uv: d.v }))

  const riskLevelStyles: { [key: string]: string } = {
    "Low Risk": "text-emerald-600 bg-emerald-50 border-emerald-100",
    "Medium Risk": "text-amber-600 bg-amber-50 border-amber-100",
    "High Risk": "text-orange-600 bg-orange-50 border-orange-100",
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
    <div className="max-w-[1300px] mx-auto">
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-10">
        <Link to="/vaults" className="inline-flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-widest hover:text-indigo-600 transition-colors">
          <ArrowLeft size={16} /> Back to All Vaults
        </Link>
      </motion.div>

      {/* Header Title Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12 flex items-center gap-6">
        <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200">
          <Activity className="text-white w-8 h-8" />
        </div>
        <div>
          <h1 className="text-5xl font-bold text-gray-950 tracking-tighter">{vault.name}</h1>
          <p className="text-gray-400 font-medium uppercase text-xs tracking-[0.2em] mt-1">Aggregated Perpetual Strategy</p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-10 items-start">
        {/* Left/Middle: Chart & Logic */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Main Chart Card */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible" className="bg-white/70 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white shadow-[0_30px_60px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-start mb-10 flex-wrap gap-4">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Vault Performance</p>
                <h2 className="text-5xl font-bold text-gray-950 tracking-tighter mb-2">{userBalance}</h2>
                <div className="flex items-center gap-1 text-emerald-500 font-bold text-sm">
                  <TrendingUp size={16} /> {displayPerformance} Past 1Y
                </div>
              </div>
              <div className="flex bg-indigo-50/50 p-1.5 rounded-2xl border border-indigo-50">
                {["1W", "1M", "ALL"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                      timeRange === range ? "bg-white text-indigo-600 shadow-md" : "text-gray-400 hover:text-indigo-400"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-72 -ml-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid #eef2ff",
                      borderRadius: "16px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                    }}
                  />
                  <XAxis dataKey="name" hide />
                  <Area type="monotone" dataKey="uv" stroke="#6366f1" strokeWidth={4} fill="url(#chartGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Logic & Tabs Card */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible" className="bg-white/70 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white shadow-[0_30px_60px_rgba(0,0,0,0.02)] min-h-[400px]">
            <div className="flex gap-10 border-b border-indigo-50 mb-10">
              {["Overview", "Holdings", "My Transactions"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveInfoTab(tab as any)}
                  className={`pb-5 text-sm font-bold uppercase tracking-widest transition-all relative ${
                    activeInfoTab === tab ? "text-indigo-600" : "text-gray-400 hover:text-indigo-400"
                  }`}
                >
                  {tab}
                  {activeInfoTab === tab && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeInfoTab}
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeInfoTab === 'Overview' && (
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight">Strategy Logic</h3>
                      <Info size={16} className="text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-lg leading-relaxed mb-8 font-light">{strategy}</p>
                    <div className="flex gap-3">
                       <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">Automated Risk Mgmt</span>
                       <span className="px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-100">Dynamic Leverage</span>
                    </div>
                  </div>
                )}
                {activeInfoTab === 'Holdings' && <div className="text-gray-400 text-sm italic font-light py-10">Searching decentralized ledgers for your positions...</div>}
                {activeInfoTab === 'My Transactions' && <div className="text-gray-400 text-sm italic font-light py-10">No recent activity detected on-chain.</div>}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right Column: Actions & Stats */}
        <div className="space-y-10">
          
          {/* "My Position" - Reference Image Layout */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible" className="bg-white rounded-[2.5rem] p-10 border border-white shadow-[0_40px_100px_rgba(79,70,229,0.05)] relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Wallet size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-950 tracking-tight">My Position</h3>
              </div>
              
              <div className="mb-10">
                <p className="text-sm font-medium text-gray-400 mb-1">Total Balance</p>
                <div className="flex items-baseline gap-2">
                   <h2 className="text-6xl font-bold text-gray-950 tracking-tighter">{userTotalBalance}</h2>
                   <span className="text-gray-400 font-bold text-sm">USD</span>
                </div>
                <p className="text-sm font-bold text-emerald-500 mt-2">{userTotalGain} All Time</p>
              </div>
              
              <div className="flex gap-4 mb-10">
                <button
                  onClick={() => openModal("deposit")}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100 active:scale-95"
                >
                  Deposit
                </button>
                <button
                  onClick={() => openModal("withdraw")}
                  className="flex-1 py-4 bg-white border border-indigo-50 text-gray-600 hover:bg-indigo-50 rounded-2xl font-bold transition-all active:scale-95"
                >
                  Withdraw
                </button>
              </div>

              <div className="flex items-start gap-3 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-indigo-900/60 text-xs leading-relaxed font-medium">
                <Info size={18} className="shrink-0 text-indigo-400" />
                <span>Mint your NYRA tokens from the Faucet before depositing into the vault.</span>
              </div>
            </div>
          </motion.div>

          {/* "Vault Stats" - Reference Image Layout */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible" className="bg-white/70 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white shadow-[0_30px_60px_rgba(0,0,0,0.02)]">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Vault Stats</h3>
            <div className="space-y-2">
              <StatRow label="Current APY" value="6.4%" />
              <StatRow label="TVL" value="$213.9M" />
              <div className="flex justify-between items-center py-4">
                <span className="text-sm font-medium text-gray-400">Risk Level</span>
                <span className={`font-bold px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest border flex items-center gap-2 ${riskLevelStyles[vault.risk]}`}>
                  <ShieldCheck size={14} /> {vault.risk}
                </span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Preservation of Modals */}
      <AnimatePresence>
        {(isModalOpen || isTxModalOpen) && (
          <TransactionModal
            type={modalType}
            onClose={() => { setIsModalOpen(false); setIsTxModalOpen(false); }}
            onSubmit={handleTransactionSubmit}
          />
        )}
        {isProcessing && <ModalWrapper><InProgressModal step={processingStep} maxSteps={4} /></ModalWrapper>}
        {isSuccess && <ModalWrapper><SuccessModal onClose={resetStatusModals} /></ModalWrapper>}
        {isError && <ModalWrapper><ErrorModal onClose={resetStatusModals} /></ModalWrapper>}
      </AnimatePresence>
    </div>
  )
}

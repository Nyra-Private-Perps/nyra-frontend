"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts"
import { TransactionModal } from "./TransactionModal"
import { ArrowLeft, Info } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { contractService } from "@/services/contractService"
import { ErrorModal, InProgressModal, ModalWrapper, SuccessModal } from "../DepositAnimation/StatusModals"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      ease: "easeOut",
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

// Themed StatCard component
const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
    <span className="text-md text-[var(--foreground-secondary)]">{label}</span>
    <span className="text-md font-semibold text-[var(--foreground)]">{value}</span>
  </div>
)

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

const HoldingsTable = () => (
  <div>
    <table className="w-full text-sm text-left">
      <thead className="text-xs text-[var(--foreground-secondary)]/80 uppercase">
        <tr>
          <th scope="col" className="px-6 py-3 font-medium">Token</th>
          <th scope="col" className="px-6 py-3 font-medium">Value</th>
          <th scope="col" className="px-6 py-3 font-medium text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {/* Empty state message */}
        <tr>
          <td colSpan={3} className="text-center py-10 px-6 text-[var(--foreground-secondary)]">
            You do not have any holdings in this vault yet.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

const TransactionsTable = () => (
  <div>
    <table className="w-full text-sm text-left">
      <thead className="text-xs text-[var(--foreground-secondary)]/80 uppercase">
        <tr>
          <th scope="col" className="px-6 py-3 font-medium">Date</th>
          <th scope="col" className="px-6 py-3 font-medium">Type</th>
          <th scope="col" className="px-6 py-3 font-medium">Asset</th>
          <th scope="col" className="px-6 py-3 font-medium">Amount</th>
          <th scope="col" className="px-6 py-3 font-medium">Price</th>
          <th scope="col" className="px-6 py-3 font-medium text-right">Status</th>
        </tr>
      </thead>
      <tbody>
        {/* Empty state message */}
        <tr>
          <td colSpan={6} className="text-center py-10 px-6 text-[var(--foreground-secondary)]">
            You have no transactions for this vault yet.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);


export function VaultDetail({ vault }: { vault: Vault }) {
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

  // ADDED: State for client-side performance display
  const [displayPerformance, setDisplayPerformance] = useState("");

  // Generate dynamic strategy based on real vault data
  const strategy = `This vault uses ${vault.project} to trade ${vault.symbol} perpetuals. It employs automated risk management with dynamic leverage adjustment based on market volatility. The strategy aims for capital appreciation while preserving principal through TEE-secured execution.`

  // User balance placeholders (connect wallet to see real)
  const userBalance = isConnected ? `$${Math.round(vault.tvlUsd * 0.001).toLocaleString()}` : "Connect Wallet"
  const userTotalBalance = isConnected ? "$100" : "Connect Wallet"
  const userTotalGain = isConnected ? "+$10 (+1.3%)" : "Connect to View"

  // Fees (realistic for perp vaults)
  // const managementFee = "2%"
  // const performanceFee = "20%"

  // Use real chartData from props
  const chartData = vault.chartData.map((d, i) => ({ name: `Day ${i + 1}`, uv: d.v }))

  // Themed risk level styles with better contrast
  const riskLevelStyles: { [key: string]: string } = {
    "Low Risk": "text-green-800 bg-white",
    "Medium Risk": "text-yellow-800 bg-white",
    "High Risk": "text-red-800 bg-white",
  }

  // ADDED: useEffect to calculate performance client-side
  useEffect(() => {
    const calculatedPerformance = `+${(vault.apyRaw * (Math.random() * 0.5 + 0.5)).toFixed(1)}%`;
    setDisplayPerformance(calculatedPerformance);
  }, [vault.apyRaw]); // Dependency on apyRaw to recalculate if it changes

  useEffect(() => {
    if (!isConnected) return;

    // Listener for when the 'approve' transaction is confirmed on-chain
    const handleApproveConfirmed = (txHash: string) => {
      console.log("Approve confirmed:", txHash);
      setProcessingStep(2); // Move to step 3: "Confirm Deposit"
    };

    // Listener for when the 'deposit' transaction is confirmed on-chain
    const handleDepositConfirmed = (txHash: string) => {
      console.log("Deposit confirmed:", txHash);
      setProcessingStep(4); // Move to step 4: "Deploying to Contract"
      
      // Simulate final deployment delay
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
      }, 2000);
    };

    contractService.on("approveConfirmed", handleApproveConfirmed);
    contractService.on("depositConfirmed", handleDepositConfirmed);

    // Cleanup function to remove listeners when the component unmounts
    return () => {
      contractService.off("approveConfirmed", handleApproveConfirmed);
      contractService.off("depositConfirmed", handleDepositConfirmed);
    };
  }, [isConnected]); // Re-run this effect if the wallet connection state changes


  const openModal = (type: "deposit" | "withdraw") => {
    setModalType(type)
    setIsModalOpen(true)
  }

    const handleTransactionSubmit = async (amount: string, type: "deposit" | "withdraw") => {
      setIsTxModalOpen(false); // Close the input modal
      setIsProcessing(true);   // Open the in-progress modal
      
      try {
        if (type === "deposit") {
          setProcessingStep(1); // Start at step 1: "Approve NYRA Token"
          const approveTx = await contractService.approveToken(amount);
          
          // After the user submits the transaction in their wallet, we move to the next step
          setProcessingStep(2); // Step 2: "Approving NYRA Token" (waiting for confirmation)
          
          if (!approveTx) {
            throw new Error("User rejected approval transaction");
          }
          setProcessingStep(3);
          const depositTx = await contractService.depositAmount(amount);
  
          if (!depositTx) {
             throw new Error("User rejected deposit transaction");
          }
          
          // --- The 'useEffect' listener will handle moving to step 4 and success ---
  
        } else { // Handle Withdrawal
          setProcessingStep(1); // Or define withdrawal-specific steps
          const success = await contractService.withdrawAmount(amount);
          if (!success) throw new Error("Withdrawal failed");
          
          setProcessingStep(4); // Or max withdrawal steps
          // Simulate final delay
          setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
          }, 1500);
        }
      } catch (error) {
        console.error("Transaction failed:", error);
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
    <>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Link href="/vaults" className="inline-flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] mb-8 text-md font-medium transition-colors">
          <ArrowLeft size={16} />
          Back to All Vaults
        </Link>
      </motion.div>

      <motion.div 
        variants={itemVariants} 
        initial="hidden" 
        animate="visible"
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      >
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-4xl font-semibold text-[var(--foreground)]">{vault.name}</h1>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <motion.div 
          className="lg:col-span-2 space-y-8"
          variants={itemVariants} 
          initial="hidden" 
          animate="visible"
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        >
          <div className="bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] rounded-lg p-6">
            <div className="flex justify-between items-start mb-2 flex-wrap gap-4">
              <div>
                <p className="text-lg text-[var(--foreground-secondary)]">Vault Performance</p>
                <p className="text-3xl font-semibold text-[var(--foreground)]">{userBalance}</p>
                {/* MODIFIED: Use displayPerformance */}
                <p className="text-md font-medium text-green-700">{displayPerformance} Past 1Y</p>
              </div>
              <div className="flex items-center bg-[var(--secondary)] shadow-[var(--shadow-card)] rounded-lg p-1 text-xs">
                {/* {["1D", "7D", "1M", "3M", "1Y", "ALL"].map((range) => ( */}
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
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    cursor={{ stroke: "var(--primary)", strokeWidth: 1 }}
                    contentStyle={{
                      background: "var(--secondary)",
                      borderColor: "var(--border)",
                      borderRadius: "0.6rem",
                      boxShadow: "var(--shadow-card)",
                    }}
                  />
                  <XAxis dataKey="name" stroke="var(--foreground-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <Area type="monotone" dataKey="uv" stroke="var(--primary)" strokeWidth={2.5} fill="url(#chartGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] rounded-lg p-6">
            <div className="flex border-b border-[var(--border)] mb-6">
            {["Overview", "Holdings", "My Transactions"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveInfoTab(tab as any)}
                  className={`pb-3 pt-1 mx-4 font-semibold text-sm transition-colors ${
                    activeInfoTab === tab
                      ? "text-[var(--foreground)] border-b-2 border-[var(--primary)]"
                      : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div>
              {activeInfoTab === 'Overview' && (
                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <h3 className="font-semibold text-lg mb-3 text-[var(--foreground)]">Strategy</h3>
                  <p className="text-[var(--foreground-secondary)] text-md leading-relaxed">{strategy}</p>
                </motion.div>
              )}
              {activeInfoTab === 'Holdings' && (
                <motion.div key="holdings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <HoldingsTable />
                </motion.div>
              )}
              {activeInfoTab === 'My Transactions' && (
                <motion.div key="transactions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <TransactionsTable />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Column */}
        <motion.div 
          className="space-y-6"
          variants={itemVariants} 
          initial="hidden" 
          animate="visible"
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
        >
          <div className="bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] rounded-lg p-6">
            <p className="text-md text-[var(--foreground-secondary)]">My Balance</p>
            <p className="text-3xl font-semibold mb-1 text-[var(--foreground)]">{userTotalBalance}</p>
            <p className="text-md font-medium text-green-700">{userTotalGain} All Time</p>
            <div className="flex items-center justify-center text-xs text-center p-2 rounded-md bg-[var(--secondary)] text-[var(--foreground-secondary)] mt-6">
            <Info size={14} />
            <span>Mint your NYRA tokens from the Faucet before depositing.</span>
          </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => openModal("deposit")}
                className="flex-1 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-semibold text-md hover:opacity-90 transition-opacity"
              >
                Deposit
              </button>
              <button
                onClick={() => openModal("withdraw")}
                className="flex-1 py-3 bg-[var(--secondary)] shadow-[var(--shadow-card)] text-[var(--secondary-foreground)] rounded-lg font-semibold text-md border border-[var(--border)] hover:bg-[var(--hover)] transition-colors"
              >
                Withdraw
              </button>
            </div>
          </div>
          <div className="bg-[var(--secondary)] shadow-[var(--shadow-card)] border border-[var(--border)] rounded-lg p-6">
            <StatCard label="APY" value={vault.apy} />
            <StatCard label="Total Value Locked (TVL)" value={vault.tvl} />
            {/* <StatCard label="Management Fee" value={managementFee} />
            <StatCard label="Performance Fee" value={performanceFee} /> */}
            <div className="flex justify-between items-center pt-3">
              <span className="text-md text-[var(--foreground-secondary)]">Risk Level</span>
              <span className={`font-medium px-3 py-1 rounded-full text-xs border border-[var(--border)] ${riskLevelStyles[vault.risk]}`}>
                {vault.risk}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
      {isModalOpen && (
          <TransactionModal
            type={modalType}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleTransactionSubmit}
          />
        )}
        {isTxModalOpen && (
          <TransactionModal
            type={modalType}
            onClose={() => setIsTxModalOpen(false)}
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
    </>
  )
}

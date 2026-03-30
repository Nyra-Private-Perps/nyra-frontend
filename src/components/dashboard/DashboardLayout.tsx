"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useAccount, useSignTypedData, useBalance, useSwitchChain } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Shield, Plus, ChevronRight, X, Loader2, Check,
  ArrowUpRight, Link2, ArrowDownLeft, Layers, RefreshCw,
  AlertCircle, ArrowRightLeft, Fuel, ExternalLink, ChevronLeft,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Header from './Header';
import { onPendingRequest, resolveRequest, type PendingRequest } from '@/lib/walletController';
import {
  apiRegister, apiGenerateAddress, apiDeriveKey, apiStealthAddresses,
  getStoredEOA, getHLUserState, apiGetBalance, apiDeposit,
  apiWithdraw, apiBridge, apiGetBridgeStatus, apiWithdrawAvailable,
  getHLSpotState
} from '@/lib/api/hyperStealth';
import { prepareForPairing, setSessionProposalHandler } from '@/lib/walletController';
import { approveToken, switchChainNetwork } from '@/lib/walletHelpers';
import { getAddress, parseUnits } from 'viem';

const ARBITRUM_ID = 42161;
const HORIZEN_ID  = 26514;

type MainTab     = 'BRIDGE' | 'WITHDRAW_TEE' | 'PA';
type TxStatus    = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR';
type TerminalView = 'ACTIONS' | 'DEPOSIT_INPUT' | 'DEPOSIT_STEPS' | 'WITHDRAW_INPUT' | 'WITHDRAW_STEPS' | 'CONNECT_HANDSHAKE' | 'SIGNING_REQUIRED' | 'CONNECT_STATUS';
type ConnectStep = 'idle' | 'pairing' | 'approving' | 'success';
type TxStep      = 'signing' | 'relaying' | 'finalizing' | 'success';

interface Proxy {
  num: number;
  address: string;
  connected: boolean;
  balance: string;
  pnl: string;
  hlBalance: number;
}

/* ─── Stable amount input — no AnimatePresence on error to prevent layout shift ── */
function AmountField({
  value,
  onChange,
  maxLabel,
  onMax,
  error,
  placeholder = '0.00',
  suffix,
  big = true,
}: {
  value: string;
  onChange: (v: string) => void;
  maxLabel?: string;
  onMax?: () => void;
  error?: string | null;
  placeholder?: string;
  suffix?: string;
  big?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {maxLabel && onMax && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Amount (USDC)</span>
          <button
            type="button"
            onClick={onMax}
            className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold transition-colors px-2 py-0.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/18 border border-purple-500/20"
          >
            MAX · {maxLabel}
          </button>
        </div>
      )}
      <div className={`flex items-center gap-2 rounded-2xl border bg-white/3 px-4 py-3 transition-colors ${
        error ? 'border-red-500/40' : 'border-white/10 focus-within:border-purple-500/35'
      }`}>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={e => {
            // Only allow valid numeric input
            const v = e.target.value;
            if (v === '' || /^\d*\.?\d*$/.test(v)) onChange(v);
          }}
          placeholder={placeholder}
          className={`flex-1 bg-transparent outline-none placeholder:text-gray-700 min-w-0 ${
            big ? 'text-2xl font-semibold' : 'text-base font-medium'
          } ${error ? 'text-red-400' : 'text-white'}`}
        />
        {suffix && <span className="text-xs text-gray-600 font-medium flex-shrink-0">{suffix}</span>}
      </div>
      {/* Static error — no AnimatePresence to avoid layout glitch */}
      {error && (
        <div className="flex items-center gap-1.5 text-red-400 min-h-[18px]">
          <AlertCircle size={11} className="flex-shrink-0" />
          <p className="text-[11px] font-medium">{error}</p>
        </div>
      )}
      {/* Reserve space when no error to prevent layout shift */}
      {!error && <div className="min-h-[18px]" />}
    </div>
  );
}

/* ─── WC URI input — styled to match theme ──────────────── */
function WcInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-4 rounded-xl font-mono text-[11px] text-white placeholder:text-gray-600 outline-none transition-colors"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.45)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      />
    </div>
  );
}

export default function DashboardLayout({ onNavigate }: { onNavigate: (p: any) => void }) {
  const { address, chain } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChain } = useSwitchChain();

  const [activeTab, setActiveTab]     = useState<MainTab>('BRIDGE');
  const [selectedProxy, setSelectedProxy] = useState<Proxy | null>(null);
  const [proxies, setProxies]         = useState<Proxy[]>([]);
  const [loading, setLoading]         = useState(true);
  const [serverBalance, setServerBalance] = useState('0'); // available (deposited - credited)
  const [withdrawProxy, setWithdrawProxy] = useState(0); // total bridged into TEE
  const [txStatus, setTxStatus]       = useState<TxStatus>('IDLE');
  const [error, setError]             = useState<string | null>(null);
  const [creating, setCreating]       = useState(false);
  const [newestProxyAddress, setNewestProxyAddress] = useState<string | null>(null);
  const [refreshingBalance, setRefreshingBalance]   = useState<string | null>(null);

  // Separate amount state for each context to avoid cross-contamination
  const [bridgeAmount, setBridgeAmount]   = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [teeAmount, setTeeAmount]         = useState('');

  const [wcUri, setWcUri]         = useState('');
  const [destination, setDestination] = useState('');
  const [view, setView]           = useState<TerminalView>('ACTIONS');
  const [txStep, setTxStep]       = useState<TxStep>('signing');
  const [progress, setProgress]   = useState(0);
  const [connectStep, setConnectStep] = useState<ConnectStep>('idle');
  const [pendingReq, setPendingReq]   = useState<PendingRequest | null>(null);
  const [hlConnected, setHlConnected] = useState(false);
  const directConnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [bridgePhase, setBridgePhase] = useState<'idle'|'switching'|'approving'|'bridging'|'waiting'|'done'|'error'>('idle');
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [mobileShowTerminal, setMobileShowTerminal] = useState(false);

  const signingHandledRef = useRef(false);
  const signingActiveRef  = useRef(false);
  const selectedProxyRef  = useRef<Proxy | null>(null);

  const HORIZEN_USDC_ADDRESS = (import.meta as any).env?.VITE_HORIZEN_USDC_ADDRESS;
  const CENTRAL_WALLET       = (import.meta as any).env?.VITE_CENTRAL_WALLET;

  const TX_STEPS = [
    { id: 'signing',    label: 'Authorize',   desc: 'Sign secure permit' },
    { id: 'relaying',   label: 'Relaying',    desc: 'Submitting to sequencer' },
    { id: 'finalizing', label: 'Finalizing',  desc: 'Confirming settlement' },
  ];

  // Horizen wallet balance
  const { data: walletBal } = useBalance({
    address,
    token: HORIZEN_USDC_ADDRESS as `0x${string}`,
    chainId: HORIZEN_ID,
  });

  // Chain guard — always enforce Arbitrum unless bridging
  const isOnArbitrum = chain?.id === ARBITRUM_ID;
  const isOnHorizen  = chain?.id === HORIZEN_ID;
  const wrongChain   = !isOnArbitrum && !isOnHorizen;

  // Derived max values
  const depositMax  = Number(serverBalance) / 1e6;
  const withdrawMax = Number(withdrawProxy) / 1e6;
  const bridgeMax   = Number(walletBal?.formatted ?? 0);
  const teeMax      = Number(serverBalance) / 1e6;

  // Per-field error calculation (no useEffect — computed inline, stable)
  const getBridgeError  = useCallback(() => {
    const v = parseFloat(bridgeAmount);
    if (!bridgeAmount || isNaN(v)) return null;
    if (v <= 0) return 'Amount must be greater than 0';
    if (v > bridgeMax) return `Exceeds wallet balance ($${bridgeMax.toFixed(2)} available)`;
    return null;
  }, [bridgeAmount, bridgeMax]);

  const getDepositError = useCallback(() => {
    const v = parseFloat(depositAmount);
    if (!depositAmount || isNaN(v)) return null;
    if (v <= 0) return 'Amount must be greater than 0';
    if (v > depositMax) return `Exceeds server balance ($${depositMax.toFixed(2)} available)`;
    if (v < 5) return 'Minimum deposit is 5 USDC';
    if (v > 8000) return 'Maximum deposit is 8,000 USDC';
    return null;
  }, [depositAmount, depositMax]);

  const getWithdrawError = useCallback(() => {
    const v = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(v)) return null;
    if (v <= 0) return 'Amount must be greater than 0';
    if (v > withdrawMax) return `Exceeds proxy balance ($${withdrawMax.toFixed(2)} available)`;
    return null;
  }, [withdrawAmount, withdrawMax]);

  const getTeeError = useCallback(() => {
    const v = parseFloat(teeAmount);
    if (!teeAmount || isNaN(v)) return null;
    if (v <= 0) return 'Amount must be greater than 0';
    if (v > teeMax) return `Exceeds TEE balance ($${teeMax.toFixed(2)} available)`;
    return null;
  }, [teeAmount, teeMax]);

  // Data loading
  const loadData = async () => {
    const eoa = getStoredEOA() || address;
    if (!eoa || !signTypedDataAsync) { setLoading(false); return; }
    let spotUsdc=0;
    try {
      const res = await apiStealthAddresses(eoa, signTypedDataAsync);
      const list = await Promise.all(res.stealthAddresses.map(async (s: any, i: number) => {
        let connected = false, balance = '0', pnl = '0';
        try {
          const state = await getHLUserState(s.address);
          const spotBalance= await getHLSpotState(s.address);
          console.log(spotBalance,"spot balance");
          const usdcSpot = spotBalance?.balances?.find(
            (b: any) => b.coin === 'USDC' || b.coin === 'USDC:0xe3b'
          );
          console.log(usdcSpot?.total,"spot balance2");
        spotUsdc = usdcSpot ? Number(usdcSpot.total ?? 0) : 0;
          if (state?.marginSummary && Number(state.marginSummary.accountValue) > 0) {
            connected = true; balance = state.marginSummary.accountValue; pnl = state.marginSummary.unrealizedPnl;
          }
        } catch {}
        return { num: i + 1, address: s.address, connected, balance, pnl,hlBalance: spotUsdc ?? '0' };
      }));
      setProxies(list);
      const bal = await apiGetBalance(eoa);
      console.log(bal,"balance")
      setServerBalance(bal.available);   // available = deposited - credited
      setWithdrawProxy(spotUsdc || 0);   // total sent to HL
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    setProxies([]); setLoading(false); setSelectedProxy(null); setMobileShowTerminal(false);
  }, [address]);

  useEffect(() => { selectedProxyRef.current = selectedProxy; }, [selectedProxy]);

  // Signing listener
  useEffect(() => {
    const unsub = onPendingRequest((req: any) => {
      if (req) {
        if (req.missingKeys) {
          if (!selectedProxyRef.current) return;
          flushSync(() => { setError('Stealth key not found. Please recreate this proxy.'); setView('ACTIONS'); setConnectStep('idle'); });
          return;
        }
        if (!selectedProxyRef.current) return;
        signingActiveRef.current = true; signingHandledRef.current = false;
        flushSync(() => { setPendingReq(req); setView('SIGNING_REQUIRED'); });
      } else {
        if (!signingHandledRef.current) { signingActiveRef.current = false; flushSync(() => { setPendingReq(null); }); }
      }
    });
    return () => unsub();
  }, []);

  const handleSwitchToPA = async () => {
    setActiveTab('PA');
    if (loading) return;
    setLoading(true);
    try { await loadData(); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // Bridge — switches to Horizen, then switches BACK to Arbitrum after done
  const handleBridge = async () => {
    setBridgePhase('switching'); setBridgeError(null);
    try {
      const rawAmount = parseUnits(bridgeAmount, 6).toString();
      await switchChainNetwork(HORIZEN_ID);
      setBridgePhase('approving');
      await approveToken(HORIZEN_USDC_ADDRESS, CENTRAL_WALLET, rawAmount);
      setBridgePhase('bridging');
      const res = await apiBridge(address!, rawAmount, signTypedDataAsync);
      setBridgePhase('waiting');
      let delivered = false;
      while (!delivered) {
        const s = await apiGetBridgeStatus(res.txHash);
        if (s.status === 'DELIVERED') delivered = true;
        else if (s.status === 'FAILED') throw new Error('Bridge transaction failed on-chain');
        else await new Promise(r => setTimeout(r, 3000));
      }
      // Switch back to Arbitrum after bridge completes
      await switchChainNetwork(ARBITRUM_ID);
      setBridgePhase('done');
      await loadData();
    } catch (e: any) { setBridgeError(e.message || 'Bridge failed'); setBridgePhase('error'); }
  };

  const handleTeeWithdraw = async () => {
    if (!address || !teeAmount) return;
    setTxStatus('PROCESSING');
    try {
      const rawAmount = parseUnits(teeAmount, 6).toString();
      await apiWithdrawAvailable(address, address, rawAmount, signTypedDataAsync);
      setTxStatus('SUCCESS');
      setTimeout(() => { setActiveTab('PA'); loadData(); setTxStatus('IDLE'); }, 2000);
    } catch (e: any) { setError(e.message || 'Withdrawal failed'); setTxStatus('ERROR'); }
  };

  const handleConnect = async () => {
    if (!selectedProxy || !wcUri.startsWith('wc:')) { setError('Invalid WalletConnect URI'); setView('ACTIONS'); return; }
    // Ensure on Arbitrum before connecting
    if (!isOnArbitrum) {
      try { await switchChainNetwork(ARBITRUM_ID); } catch { setError('Please switch to Arbitrum first'); return; }
    }
    signingActiveRef.current = false;
    const storedAddress = localStorage.getItem('nyra_active_stealth');
    const storedKey     = localStorage.getItem('nyra_stealth_key');
    const keyMatchesProxy = storedAddress?.toLowerCase() === selectedProxy.address.toLowerCase();
    if (!keyMatchesProxy || !storedKey) {
      setConnectStep('pairing');
      try {
        const { stealthPrivateKey } = await apiDeriveKey(address!, selectedProxy.address, signTypedDataAsync);
        localStorage.setItem('nyra_active_stealth', selectedProxy.address);
        localStorage.setItem('nyra_stealth_key', stealthPrivateKey);
        sessionStorage.setItem('nyra_stealth_address', selectedProxy.address);
        sessionStorage.setItem('nyra_stealth_key', stealthPrivateKey);
      } catch (e: any) { setError('Failed to load proxy key: ' + e.message); setView('ACTIONS'); return; }
    } else {
      sessionStorage.setItem('nyra_stealth_address', selectedProxy.address);
      sessionStorage.setItem('nyra_stealth_key', storedKey);
    }
    setView('CONNECT_STATUS'); setConnectStep('pairing'); setTxStatus('IDLE'); setError(null);
    try {
      const wc = await prepareForPairing();
      setSessionProposalHandler(async (proposal: any) => {
        try {
          const signerAddress = getAddress(selectedProxy.address);
          const required = proposal.params.requiredNamespaces?.eip155 ?? {};
          const methods = required.methods?.length > 0 ? required.methods
            : ['eth_sendTransaction','personal_sign','eth_signTypedData_v4','eth_sign','eth_signTypedData'];
          await wc.approveSession({
            id: proposal.id,
            namespaces: { eip155: { accounts: [`eip155:42161:${signerAddress}`], methods, events: ['accountsChanged','chainChanged'], chains: ['eip155:42161'] } },
          });
          if (!signingActiveRef.current) {
            setConnectStep('approving');
            await new Promise<void>(resolve => {
              const t = setTimeout(() => resolve(), 2500);
              const p = setInterval(() => { if (signingActiveRef.current) { clearTimeout(t); clearInterval(p); resolve(); } }, 100);
            });
            if (!signingActiveRef.current) {
              setHlConnected(true);
              setProxies(prev => prev.map(p => p.address === selectedProxy.address ? { ...p, connected: true } : { ...p, connected: false }));
              setSelectedProxy(prev => prev ? { ...prev, connected: true } : prev);
              setConnectStep('success');
              setTimeout(() => { setConnectStep('idle'); setView('ACTIONS'); setWcUri(''); }, 1500);
            }
          }
        } catch (e: any) { throw new Error(e.message || 'Session approval rejected'); }
        finally { setSessionProposalHandler(null); }
      });
      await wc.core.pairing.pair({ uri: wcUri });
    } catch (err: any) {
      setSessionProposalHandler(null); setError(err.message || 'Connection failed');
      setTxStatus('ERROR'); setView('ACTIONS');
    }
  };

  const handleDepositFlow = async () => {
    if (!selectedProxy || !address) return;
    setView('DEPOSIT_STEPS'); setError(null);
    try {
      setTxStep('signing'); setProgress(20);
      await new Promise(r => setTimeout(r, 800));
      setTxStep('relaying'); setProgress(60);
      await apiDeposit(address, selectedProxy.address, parseUnits(depositAmount, 6).toString(), signTypedDataAsync);
      setTxStep('finalizing'); setProgress(90);
      await new Promise(r => setTimeout(r, 1200));
      setTxStep('success'); setProgress(100);
      setTimeout(() => { setView('ACTIONS'); loadData(); }, 2000);
    } catch (err: any) { setError(err.message || 'Deposit failed'); setTxStatus('ERROR'); }
  };

  const handleWithdrawFlow = async () => {
    if (!selectedProxy || !address || !destination) return;
    setView('WITHDRAW_STEPS'); setError(null);
    try {
      setTxStep('signing'); setProgress(20);
      await new Promise(r => setTimeout(r, 800));
      setTxStep('relaying'); setProgress(60);
      await apiWithdraw(address, selectedProxy.address, destination, parseUnits(withdrawAmount, 6).toString(), signTypedDataAsync);
      setTxStep('finalizing'); setProgress(90);
      await new Promise(r => setTimeout(r, 1200));
      setTxStep('success'); setProgress(100);
      setTimeout(() => { setView('ACTIONS'); loadData(); }, 2500);
    } catch (err: any) { setError(err.message || 'Withdraw failed'); setTxStatus('ERROR'); }
  };

  const handleApproveSign = async () => {
    if (!pendingReq) return;
    signingHandledRef.current = true; signingActiveRef.current = false;
    if (directConnectTimerRef.current) clearTimeout(directConnectTimerRef.current);
    setPendingReq(null); setView('CONNECT_STATUS'); setConnectStep('success');
    resolveRequest(true);
    setTimeout(() => {
      setConnectStep('idle'); setHlConnected(true);
      setProxies(prev => prev.map(p => p.address === selectedProxy?.address ? { ...p, connected: true } : { ...p, connected: false }));
      setSelectedProxy(prev => prev ? { ...prev, connected: true } : prev);
      setView('ACTIONS'); loadData();
    }, 2200);
  };

  const handleRejectSign = () => {
    signingHandledRef.current = true; signingActiveRef.current = false;
    resolveRequest(false); setPendingReq(null); setView('ACTIONS'); setConnectStep('idle');
  };

  const openProxy = (p: Proxy) => {
    setSelectedProxy(p); setView('ACTIONS'); setMobileShowTerminal(true);
    // Pre-fill amounts to max on open
    setDepositAmount('');
    setWithdrawAmount('');
  };

  const closeTerminal = () => {
    setSelectedProxy(null); setView('ACTIONS'); setMobileShowTerminal(false);
  };

  const refreshProxyBalance = async (e: React.MouseEvent, proxy: Proxy) => {
    e.stopPropagation();
    if (refreshingBalance === proxy.address) return;
    setRefreshingBalance(proxy.address);
    try {
      const state = await getHLUserState(proxy.address);
      const newBalance = state?.marginSummary?.accountValue ?? '0';
      const newPnl     = state?.marginSummary?.unrealizedPnl ?? '0';
      const updated = { ...proxy, balance: newBalance, pnl: newPnl, connected: Number(newBalance) > 0 };
      setProxies(prev => prev.map(x => x.address === proxy.address ? updated : x));
      if (selectedProxy?.address === proxy.address) setSelectedProxy(updated);
    } catch (e) { console.error(e); }
    finally { setRefreshingBalance(null); }
  };

  // ── Wrong chain banner ──────────────────────────────────
  const WrongChainBanner = () => wrongChain ? (
    <div className="mx-4 mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/8 border border-amber-500/25">
      <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-amber-400 font-medium">Wrong network</p>
        <p className="text-[10px] text-amber-400/70 mt-0.5">Switch to Arbitrum One to use Nyra</p>
      </div>
      <button
        onClick={() => switchChain({ chainId: ARBITRUM_ID })}
        className="flex-shrink-0 text-[10px] font-bold text-amber-400 border border-amber-400/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors"
      >
        Switch
      </button>
    </div>
  ) : null;

  // ── SHARED TERMINAL CONTENT ─────────────────────────────
  const TerminalContent = () => (
    <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
      <AnimatePresence mode="wait">

        {/* ACTIONS */}
        {view === 'ACTIONS' && selectedProxy && (
          <motion.div key="actions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {/* Dual balance card */}
            <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Hyperliquid Balance</span>
                  <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full border ${
                    selectedProxy.connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/20 border-white/8'
                  }`}>{selectedProxy.connected ? '● Synced' : '○ Standby'}</span>
                </div>
                <div className="text-3xl font-semibold text-white">
                  {Number(selectedProxy.balance) > 0
                    ? `$${Number(selectedProxy.balance).toLocaleString()}`
                    : <span className="text-gray-600 text-xl font-normal">No position</span>}
                </div>
                {Number(selectedProxy.balance) > 0 && (
                  <div className={`text-xs font-medium ${Number(selectedProxy.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {Number(selectedProxy.pnl) >= 0 ? '+' : ''}{selectedProxy.pnl} Unrealized PnL
                  </div>
                )}
              </div>
              {/* 3-column balance breakdown */}
              <div className="border-t border-white/5 grid grid-cols-2 divide-x divide-white/5" style={{ background: 'rgba(255,255,255,0.015)' }}>
                {[
                  { label: 'Available to deposit',      value: depositMax.toFixed(2), tip: 'Deposited to Hyperliquid', color: 'text-purple-400' },
                  { label: 'Withdraw Balance',  value: selectedProxy?.hlBalance,                       tip: 'Ready to deposit / withdraw', color: depositMax >= 5 ? 'text-emerald-400' : 'text-amber-400' },
                ].map(b => (
                  <div key={b.label} className="px-3 py-2.5 text-center" title={b.tip}>
                    <p className="text-[9px] text-gray-600 font-medium uppercase tracking-wider mb-1">{b.label}</p>
                    <p className={`text-xs font-semibold tabular-nums ${b.color}`}>${b.value}</p>
                  </div>
                ))}
              </div>
              {depositMax < 5 && (
                <div className="border-t border-amber-500/20 px-4 py-3 flex items-start gap-2.5" style={{ background: 'rgba(245,158,11,0.04)' }}>
                  <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[9px] text-amber-400 font-bold">!</span>
                  </div>
                  <div>
                    <p className="text-[11px] text-amber-400 font-medium">Low available balance</p>
                    <p className="text-[10px] text-amber-400/70 mt-0.5 leading-relaxed">Need at least $5 USDC to deposit. Bridge funds first.</p>
                    <button onClick={() => { setActiveTab('BRIDGE'); closeTerminal(); }}
                      className="mt-1 text-[10px] text-amber-400 font-semibold hover:text-amber-300 underline underline-offset-2 transition-colors">
                      Go to Bridge →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {selectedProxy.connected ? (
              <motion.div key="conn-act" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[10px] text-emerald-400 font-medium">Session Active — Trading Enabled</p>
                </div>
                <motion.a href="https://app.hyperliquid.xyz/trade" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-xl btn-purple text-white font-semibold text-sm"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <ExternalLink size={14} /> Start Trading
                </motion.a>
                <div className="grid grid-cols-2 gap-2">
                  <ActionBtn icon={<ArrowDownLeft size={16} />} label="Deposit" sub="Fund account" onClick={() => setView('DEPOSIT_INPUT')} />
                  <ActionBtn icon={<ArrowUpRight size={16} />} label="Withdraw" sub="Extract funds" onClick={() => setView('WITHDRAW_INPUT')} />
                </div>
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <WcInput value={wcUri} onChange={setWcUri} placeholder="wc:... (re-pair session)" />
                  <button onClick={handleConnect} disabled={!wcUri.startsWith('wc:')}
                    className="w-full h-10 rounded-xl text-[10px] font-medium text-purple-400 hover:text-purple-300 border border-purple-500/20 hover:border-purple-500/40 bg-purple-500/8 hover:bg-purple-500/15 transition-all disabled:opacity-25 disabled:cursor-not-allowed">
                    Re-pair Session
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="disc-act" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <ActionBtn icon={<ArrowDownLeft size={16} />} label="Deposit" sub="From server" onClick={() => setView('DEPOSIT_INPUT')} />
                  <ActionBtn icon={<ArrowUpRight size={16} />} label="Withdraw" sub="Extract funds" onClick={() => setView('WITHDRAW_INPUT')} />
                </div>
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Connect Hyperliquid</p>
                  <WcInput value={wcUri} onChange={setWcUri} placeholder="wc:abc... (paste from Hyperliquid)" />
                  <motion.button onClick={handleConnect} disabled={!wcUri.startsWith('wc:')}
                    className="w-full h-11 rounded-xl btn-purple text-white font-medium text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    Connect to Hyperliquid
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* DEPOSIT INPUT */}
        {view === 'DEPOSIT_INPUT' && (
          <motion.div key="dep_in" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">Deposit Funds</h3>
              <p className="text-xs text-gray-500 mt-0.5">Transfer from server balance to proxy</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/2 border border-white/6 space-y-3">
              <AmountField
                value={depositAmount} onChange={setDepositAmount}
                maxLabel={`$${depositMax.toFixed(2)}`} onMax={() => setDepositAmount(depositMax.toFixed(2))}
                error={getDepositError()}
              />
              <p className="text-[10px] text-gray-600">Min 5 USDC · Max 8,000 USDC</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setView('ACTIONS')} className="h-11 rounded-xl bg-white/5 border border-white/8 text-sm text-gray-400 hover:bg-white/8 transition-all">Back</button>
              <motion.button onClick={handleDepositFlow}
                disabled={!!getDepositError() || !depositAmount || depositAmount === '0'}
                className="h-11 rounded-xl btn-purple text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                Deposit Now
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* WITHDRAW INPUT */}
        {view === 'WITHDRAW_INPUT' && (
          <motion.div key="with_in" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">Withdraw Assets</h3>
              <p className="text-xs text-gray-500 mt-0.5">Extract funds to any address</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/2 border border-white/6 space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wider block mb-2">Destination Address</label>
                <div className="rounded-xl border border-white/10 px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <input type="text" value={destination} onChange={e => setDestination(e.target.value)}
                    placeholder="0x..." className="w-full bg-transparent text-sm font-mono text-white outline-none placeholder:text-gray-600" />
                </div>
              </div>
              <div className="border-t border-white/5 pt-3">
                <AmountField
                  value={withdrawAmount} onChange={setWithdrawAmount}
                  maxLabel={`$${withdrawMax.toFixed(2)}`} onMax={() => setWithdrawAmount(withdrawMax.toFixed(2))}
                  error={getWithdrawError()}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setView('ACTIONS')} className="h-11 rounded-xl bg-white/5 border border-white/8 text-sm text-gray-400 hover:bg-white/8 transition-all">Cancel</button>
              <motion.button onClick={handleWithdrawFlow}
                disabled={!!getWithdrawError() || !withdrawAmount || withdrawAmount === '0' || !destination}
                className="h-11 rounded-xl btn-purple text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                Withdraw
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* TX STEPS */}
        {(view === 'DEPOSIT_STEPS' || view === 'WITHDRAW_STEPS') && (
          <motion.div key="steps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pt-2">
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div className="h-full progress-purple rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
            </div>
            <div className="space-y-2">
              {TX_STEPS.map((s, i) => {
                const isCurrent = txStep === s.id;
                const isDone = progress > (i + 1) * 30 || txStep === 'success';
                return (
                  <div key={s.id} className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${isCurrent ? 'bg-purple-500/8 border-purple-500/20' : 'opacity-30 border-transparent'}`}>
                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-emerald-500 border-emerald-500' : isCurrent ? 'border-purple-500 text-purple-400' : 'border-white/10'}`}>
                      {isDone ? <Check size={14} className="text-white" /> : isCurrent ? <Loader2 size={14} className="animate-spin" /> : <span className="text-[10px] font-semibold">{i + 1}</span>}
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${isCurrent ? 'text-white' : 'text-white/20'}`}>{s.label}</p>
                      <p className="text-[10px] text-gray-600">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* CONNECT STATUS */}
        {view === 'CONNECT_STATUS' && (
          <motion.div key="conn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-8 space-y-6 text-center flex flex-col items-center">
            <div className="relative w-20 h-20">
              {connectStep === 'success' ? (
                <div className="w-full h-full bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/25">
                  <Check size={28} className="text-emerald-400" />
                </div>
              ) : (
                <>
                  <svg className="w-20 h-20 animate-spin text-purple-500/25" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="226" strokeDashoffset="150" />
                  </svg>
                  <Link2 className="absolute inset-0 m-auto text-purple-400 animate-pulse" size={22} />
                </>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                {connectStep === 'pairing' ? 'Pairing Node' : connectStep === 'approving' ? 'Awaiting Auth' : connectStep === 'success' ? 'Connected!' : 'Connecting...'}
              </h4>
              <p className="text-xs text-gray-500 mt-1.5">
                {connectStep === 'pairing' ? 'Establishing P2P relay...' : connectStep === 'approving' ? 'Hyperliquid requesting authentication...' : connectStep === 'success' ? 'Session active.' : 'Please wait...'}
              </p>
            </div>
          </motion.div>
        )}

        {/* SIGNING REQUIRED */}
        {view === 'SIGNING_REQUIRED' && pendingReq && (
          <motion.div key="sign" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield size={24} className="text-purple-400" />
              </div>
              <h3 className="text-base font-semibold text-white">Identity Authentication</h3>
              <p className="text-xs text-gray-500 mt-1.5 px-4">Hyperliquid requires a signature to initialise your private identity.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/2 border border-white/6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">Protocol Action</span>
                <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-400 font-mono">{pendingReq.params.request.method}</Badge>
              </div>
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 font-mono text-[9px] text-gray-600">
                AUTHENTICATE_SESSION_STEALTH_V2:ENABLE_TRADING
              </div>
            </div>
            <div className="space-y-2">
              <motion.button onClick={handleApproveSign} className="w-full h-11 btn-purple rounded-2xl text-white font-medium text-sm" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                Confirm & Sign
              </motion.button>
              <button onClick={handleRejectSign} className="w-full py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors">Reject Request</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── BRIDGE CONTENT ──────────────────────────────────────
  const BridgeContent = () => (
    <motion.div key="bridge" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Funding</h2>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">Stargate V2 Cross-Chain</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
          <Fuel size={12} className="text-purple-400" />
          <span className="text-[10px] text-purple-400 font-medium">Cross-chain</span>
        </div>
      </div>

      {bridgePhase === 'idle' || bridgePhase === 'error' ? (
        <div className="space-y-4">
          {/* From */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs text-gray-500">From</label>
              <span className="text-[10px] text-purple-400 font-medium">Wallet: ${bridgeMax.toFixed(2)}</span>
            </div>
            <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${getBridgeError() ? 'border-red-500/40 bg-red-500/3' : 'border-white/8 bg-white/3 hover:border-purple-500/25'}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">HZ</div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">USDC.e</p>
                <p className="text-xs text-gray-500">Horizen EON</p>
              </div>
              <div className="ml-auto flex flex-col items-end gap-1">
                <input type="text" inputMode="decimal" value={bridgeAmount}
                  onChange={e => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setBridgeAmount(v); }}
                  placeholder="0"
                  className={`bg-transparent text-right text-2xl font-semibold w-24 outline-none placeholder:text-gray-700 ${getBridgeError() ? 'text-red-400' : 'text-white'}`} />
                <button onClick={() => setBridgeAmount(bridgeMax.toFixed(2))} className="text-[9px] text-purple-400 font-bold hover:text-purple-300 transition-colors">USE MAX</button>
              </div>
            </div>
            {getBridgeError() && (
              <div className="flex items-center gap-1.5 text-red-400 px-1">
                <AlertCircle size={11} /><p className="text-[11px] font-medium">{getBridgeError()}</p>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center">
              <ArrowDownLeft size={14} className="text-gray-400" />
            </div>
          </div>

          {/* To */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500">To</label>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/3 border border-white/8">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">ARB</div>
              <div>
                <p className="text-sm font-medium text-white">USDC</p>
                <p className="text-xs text-gray-500">Arbitrum One</p>
              </div>
              <div className="ml-auto text-gray-400 text-sm tabular-nums">~{bridgeAmount || '0'}</div>
            </div>
          </div>

          <p className="text-xs text-gray-600 text-center">Bridge from Horizen EON → Arbitrum · ~2–5 min</p>

          {bridgePhase === 'error' && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/8 border border-red-500/20">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">{bridgeError}</p>
            </div>
          )}

          <motion.button onClick={handleBridge}
            disabled={!!getBridgeError() || !bridgeAmount || bridgeAmount === '0'}
            className="w-full h-12 rounded-2xl btn-purple text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            Bridge Liquidity
          </motion.button>
        </div>

      ) : bridgePhase === 'done' ? (
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
            <Check size={28} className="text-emerald-400" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Bridge Complete</h3>
            <p className="text-sm text-gray-400">Funds delivered. You can now deposit to any proxy account.</p>
          </div>
          <button onClick={() => { setBridgePhase('idle'); setBridgeError(null); setBridgeAmount(''); }}
            className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/8 transition-all">
            Bridge More
          </button>
        </div>

      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 text-center mb-4">Cross-chain transfer in progress · Do not close</p>
          {[
            { id: 'switching', label: 'Switch Network',       desc: 'Connecting to Horizen EON' },
            { id: 'approving', label: 'Approve Token Spend',  desc: 'Sign approval in wallet' },
            { id: 'bridging',  label: 'Submit Bridge',        desc: 'Confirm in wallet' },
            { id: 'waiting',   label: 'Waiting for Delivery', desc: '~2–5 min' },
          ].map((step, i) => {
            const phases = ['switching','approving','bridging','waiting','done'];
            const isDone = phases.indexOf(bridgePhase) > phases.indexOf(step.id);
            const isCurrent = bridgePhase === step.id;
            return (
              <div key={step.id} className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all ${isCurrent ? 'bg-purple-500/8 border-purple-500/25' : isDone ? 'bg-emerald-500/5 border-emerald-500/15' : 'opacity-30 border-transparent'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border-2 ${isDone ? 'bg-emerald-500 border-emerald-500' : isCurrent ? 'border-purple-500 text-purple-400' : 'border-white/10 text-white/20'}`}>
                  {isDone ? <Check size={14} className="text-white" /> : isCurrent ? <Loader2 size={14} className="animate-spin" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${isCurrent ? 'text-white' : isDone ? 'text-emerald-400' : 'text-white/20'}`}>{step.label}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );

  // ── TEE WITHDRAW CONTENT ────────────────────────────────
  const WithdrawTeeContent = () => (
    <motion.div key="tee" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-white">TEE Withdrawal</h2>
        <p className="text-xs text-gray-500 mt-0.5">Move undeposited funds to Arbitrum</p>
      </div>
      <div className="p-4 rounded-2xl bg-white/3 border border-white/8 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Available in TEE</span>
          <span className="text-[10px] text-purple-400 font-mono font-semibold">${teeMax.toFixed(2)} USDC</span>
        </div>
        <AmountField value={teeAmount} onChange={setTeeAmount}
          maxLabel={`$${teeMax.toFixed(2)}`} onMax={() => setTeeAmount(teeMax.toFixed(2))}
          error={getTeeError()} suffix="USDC" />
      </div>
      <motion.button onClick={handleTeeWithdraw} disabled={!!getTeeError() || !teeAmount || teeAmount === '0'}
        className="w-full h-12 rounded-2xl btn-purple text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        Withdraw to Arbitrum
      </motion.button>
    </motion.div>
  );

  // ── PROXY LIST ──────────────────────────────────────────
  const ProxyList = () => (
    <motion.div key="pa" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-white">Registry</h2>
          <p className="text-xs text-gray-500 mt-0.5">Your stealth proxy accounts</p>
        </div>
        <motion.button
          onClick={async () => {
            if (!address || !signTypedDataAsync) return;
            setCreating(true);
            try {
              await apiRegister(address, signTypedDataAsync);
              const { stealthAddress } = await apiGenerateAddress(address);
              const { stealthPrivateKey } = await apiDeriveKey(address, stealthAddress, signTypedDataAsync);
              localStorage.setItem('nyra_eoa', address);
              localStorage.setItem('nyra_active_stealth', stealthAddress);
              localStorage.setItem('nyra_stealth_key', stealthPrivateKey);
              sessionStorage.setItem('nyra_stealth_address', stealthAddress);
              sessionStorage.setItem('nyra_stealth_key', stealthPrivateKey);
              setNewestProxyAddress(stealthAddress);
              setTimeout(() => setNewestProxyAddress(null), 30000);
            } catch (e) { console.error(e); }
            finally { await loadData(); setCreating(false); }
          }}
          className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 hover:bg-purple-500/20 transition-all"
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          {creating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
        </motion.button>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[420px] pr-1 custom-scrollbar">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 rounded-2xl shimmer" />)
        ) : proxies.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <Shield size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No proxy accounts yet</p>
            <p className="text-xs mt-1">Click + to create your first stealth proxy</p>
          </div>
        ) : (
          proxies.map(p => {
            const isNew = newestProxyAddress === p.address;
            const isRefreshing = refreshingBalance === p.address;
            return (
              <motion.div key={p.address}
                initial={isNew ? { opacity: 0, y: -12, scale: 0.97 } : { opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                onClick={() => openProxy(p)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                  selectedProxy?.address === p.address ? 'bg-purple-500/10 border-purple-500/25'
                  : isNew ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-white/2 border-white/6 hover:border-white/12'
                }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    selectedProxy?.address === p.address ? 'bg-purple-500 text-white'
                    : isNew ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 text-white/30'
                  }`}>{p.num}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-400 truncate">{p.address.slice(0, 12)}...</span>
                      {isNew && (
                        <span className="new-badge inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-bold text-emerald-400 flex-shrink-0">✦ NEW</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.connected ? 'bg-emerald-400' : 'bg-white/15'}`} />
                      <span className={`text-[10px] font-medium ${p.connected ? 'text-emerald-400' : 'text-white/25'}`}>{p.connected ? 'Active' : 'Inactive'}</span>
                      {Number(p.balance) > 0 && <span className="text-[10px] text-purple-400 ml-1">${Number(p.balance).toFixed(2)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <motion.button onClick={e => refreshProxyBalance(e, p)} title="Refresh balance"
                    className="w-7 h-7 rounded-lg bg-white/4 hover:bg-purple-500/15 border border-white/6 hover:border-purple-500/30 flex items-center justify-center text-white/20 hover:text-purple-400 transition-all"
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <RefreshCw size={11} className={isRefreshing ? 'spin-once text-purple-400' : ''} />
                  </motion.button>
                  <ChevronRight size={15} onClick={() => openProxy(p)}
                    className={`cursor-pointer transition-all ${selectedProxy?.address === p.address ? 'text-purple-400 translate-x-0.5' : 'text-white/15 group-hover:text-white/40'}`} />
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );

  // ── RENDER ──────────────────────────────────────────────
  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: '#0d0a12' }}>
      <div className="fixed inset-0 pointer-events-none grid-pattern" />
      <Header onNavigate={onNavigate} currentPage="dashboard" />

      {/* ══ MOBILE LAYOUT (< md) ══════════════════════════ */}
      <div className="md:hidden min-h-screen flex flex-col pt-14">
        <WrongChainBanner />

        {/* Mobile terminal sheet */}
        <AnimatePresence>
          {mobileShowTerminal && selectedProxy && (
            <motion.div key="mobile-terminal"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="fixed inset-0 z-[90] flex flex-col"
              style={{ paddingTop: 'env(safe-area-inset-top, 56px)', background: '#0d0a12' }}>

              {/* Sheet header with back button */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 flex-shrink-0" style={{ background: 'rgba(13,10,20,0.95)' }}>
                <motion.button onClick={closeTerminal}
                  className="w-8 h-8 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/12 transition-all flex-shrink-0"
                  whileTap={{ scale: 0.9 }}>
                  <ChevronLeft size={16} />
                </motion.button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selectedProxy.connected ? 'bg-emerald-400' : 'bg-white/20'}`} />
                    <p className="text-xs font-semibold text-white truncate">{selectedProxy.address.slice(0,10)}…{selectedProxy.address.slice(-6)}</p>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-0.5">{selectedProxy.connected ? 'Session Active' : 'Proxy Account'}</p>
                </div>
                {Number(selectedProxy.balance) > 0 && (
                  <div className="flex-shrink-0 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/25">
                    <span className="text-xs font-semibold text-purple-300">${Number(selectedProxy.balance).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Back button for sub-views */}
              {view !== 'ACTIONS' && view !== 'DEPOSIT_STEPS' && view !== 'WITHDRAW_STEPS' && view !== 'CONNECT_STATUS' && view !== 'SIGNING_REQUIRED' && (
                <button onClick={() => setView('ACTIONS')} className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 px-5 pt-4 pb-1 transition-colors">
                  <ChevronLeft size={13} /> Back to actions
                </button>
              )}

              <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                <TerminalContent />
              </div>

              {/* TX Status overlay */}
              <AnimatePresence>
                {txStatus !== 'IDLE' && view !== 'SIGNING_REQUIRED' && view !== 'CONNECT_STATUS' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center"
                    style={{ background: 'rgba(12,8,22,0.96)', backdropFilter: 'blur(8px)' }}>
                    {txStatus === 'PROCESSING' ? (
                      <div className="space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto">
                          <Loader2 className="text-purple-400 animate-spin" size={24} />
                        </div>
                        <p className="text-sm text-gray-300">Processing…</p>
                      </div>
                    ) : txStatus === 'SUCCESS' ? (
                      <div className="space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                          <Check className="text-emerald-400" size={24} />
                        </div>
                        <p className="text-sm text-gray-300 font-medium">Success</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <AlertCircle className="text-red-400 mx-auto" size={32} />
                        <p className="text-sm text-red-400">{error}</p>
                        <button onClick={() => { setTxStatus('IDLE'); setView('ACTIONS'); }} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Dismiss</button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile main content */}
        <div className="flex-1 px-4 pt-4 pb-24 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'BRIDGE'       && <BridgeContent key="m-bridge" />}
            {activeTab === 'WITHDRAW_TEE' && <WithdrawTeeContent key="m-tee" />}
            {activeTab === 'PA'           && <ProxyList key="m-pa" />}
          </AnimatePresence>
        </div>

        {/* Mobile bottom tab bar */}
        <div className="fixed bottom-0 left-0 right-0 z-[80] glass border-t border-white/8"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="flex relative">
            {([
              { id: 'BRIDGE',       icon: <ArrowRightLeft size={18} />, label: 'Bridge' },
              { id: 'WITHDRAW_TEE', icon: <ArrowUpRight size={18} />,   label: 'Withdraw' },
              { id: 'PA',           icon: <Layers size={18} />,         label: 'Accounts' },
            ] as { id: MainTab; icon: React.ReactNode; label: string }[]).map(tab => (
              <button key={tab.id}
                onClick={() => { if (tab.id === 'PA') { setActiveTab('PA'); handleSwitchToPA(); } else setActiveTab(tab.id); setMobileShowTerminal(false); }}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-all ${activeTab === tab.id && !mobileShowTerminal ? 'text-purple-400' : 'text-gray-600'}`}>
                <span className={`transition-transform ${activeTab === tab.id && !mobileShowTerminal ? 'scale-110' : 'scale-100'}`}>{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && !mobileShowTerminal && (
                  <motion.div layoutId="mob-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" style={{ width: '33.33%', left: tab.id === 'BRIDGE' ? '0%' : tab.id === 'WITHDRAW_TEE' ? '33.33%' : '66.66%' }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ DESKTOP LAYOUT (≥ md) ════════════════════════ */}
      <main className="hidden md:flex items-center justify-center p-6 pt-28 min-h-screen">
        <div className="flex gap-3 items-start">
          {/* Side icon bar */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex flex-col gap-2 pt-1">
            <SideTab active={activeTab === 'BRIDGE'}       onClick={() => { setActiveTab('BRIDGE'); setSelectedProxy(null); }} icon={<ArrowRightLeft size={18} />} title="Bridge" />
            <SideTab active={activeTab === 'WITHDRAW_TEE'} onClick={() => { setActiveTab('WITHDRAW_TEE'); setSelectedProxy(null); }} icon={<ArrowUpRight size={18} />} title="Withdraw TEE" />
            <SideTab active={activeTab === 'PA'}           onClick={() => { setActiveTab('PA'); handleSwitchToPA(); }} icon={<Layers size={18} />} title="Accounts" />
          </motion.div>

          {/* Main widget — fixed-width transition via CSS, not Framer layout to avoid glitch */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            className="glass-card rounded-3xl overflow-hidden flex"
            style={{
              width: selectedProxy ? 820 : 440,
              minHeight: 520,
              transition: 'width 0.35s cubic-bezier(0.25,0.1,0.25,1)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,85,247,0.08)',
            }}>

            {/* Explorer pane */}
            <div className="flex-1 p-7 flex flex-col min-w-0">
              {wrongChain && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/8 border border-amber-500/25 mb-5 flex-shrink-0">
                  <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-400 flex-1">Switch to Arbitrum One to use Nyra</p>
                  <button onClick={() => switchChain({ chainId: ARBITRUM_ID })} className="text-[10px] font-bold text-amber-400 border border-amber-400/30 px-2.5 py-1 rounded-lg hover:bg-amber-500/10 transition-colors flex-shrink-0">Switch</button>
                </div>
              )}
              <AnimatePresence mode="wait">
                {activeTab === 'BRIDGE'       && <BridgeContent />}
                {activeTab === 'WITHDRAW_TEE' && <WithdrawTeeContent />}
                {activeTab === 'PA'           && <ProxyList />}
              </AnimatePresence>
            </div>

            {/* Terminal pane */}
            <AnimatePresence>
              {selectedProxy && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                  className="border-l border-white/5 flex flex-col p-6 relative overflow-hidden flex-shrink-0"
                  style={{ width: 360, background: 'rgba(15,10,28,0.7)' }}>

                  {/* Terminal header */}
                  <div className="flex items-center justify-between mb-5 flex-shrink-0">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedProxy.connected ? 'bg-emerald-400 animate-pulse' : 'bg-white/15'}`} />
                        <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-widest">{selectedProxy.connected ? 'Session Active' : 'Terminal'}</p>
                      </div>
                      <p className="font-mono text-[9px] text-gray-600 truncate w-[190px]">{selectedProxy.address}</p>
                    </div>
                    <motion.button onClick={closeTerminal}
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all"
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <X size={13} />
                    </motion.button>
                  </div>

                  <TerminalContent />

                  {/* TX Status overlay */}
                  <AnimatePresence>
                    {txStatus !== 'IDLE' && view !== 'SIGNING_REQUIRED' && view !== 'CONNECT_STATUS' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center"
                        style={{ background: 'rgba(15,10,28,0.96)', backdropFilter: 'blur(8px)' }}>
                        {txStatus === 'PROCESSING' ? (
                          <div className="space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto">
                              <Loader2 className="text-purple-400 animate-spin" size={22} />
                            </div>
                            <p className="text-sm text-gray-300">Processing…</p>
                          </div>
                        ) : txStatus === 'SUCCESS' ? (
                          <div className="space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                              <Check className="text-emerald-400" size={22} />
                            </div>
                            <p className="text-sm text-gray-300 font-medium">Success</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <AlertCircle className="text-red-400 mx-auto" size={28} />
                            <p className="text-xs text-red-400">{error}</p>
                            <button onClick={() => { setTxStatus('IDLE'); setView('ACTIONS'); }} className="text-xs text-gray-500 hover:text-gray-300 mt-2 transition-colors">Dismiss</button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function SideTab({ active, onClick, icon, title }: any) {
  return (
    <motion.button onClick={onClick} title={title}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25' : 'bg-white/3 text-gray-500 border border-white/6 hover:bg-white/6 hover:text-gray-300'}`}
      whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
      {icon}
    </motion.button>
  );
}

function ActionBtn({ icon, label, sub, onClick }: any) {
  return (
    <motion.button onClick={onClick}
      className="p-4 rounded-2xl bg-white/2 border border-white/6 hover:border-purple-500/25 hover:bg-purple-500/5 transition-all text-left"
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <div className="text-purple-400 mb-3">{icon}</div>
      <p className="text-xs font-semibold text-white/80">{label}</p>
      <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>
    </motion.button>
  );
}

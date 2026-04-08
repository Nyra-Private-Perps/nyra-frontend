"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useAccount, useSignTypedData, useBalance, useSwitchChain } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Zap, Shield, Plus, ChevronRight, X, Loader2, Check,
  ArrowUpRight, Link2, ArrowDownLeft, Layers, RefreshCw,
  AlertCircle, ArrowRightLeft, Fuel, ExternalLink, ChevronLeft,
  AlertTriangle, Copy,
  ChevronDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Header from './Header';
import { onPendingRequest, resolveRequest, type PendingRequest } from '@/lib/walletController'
import { apiGetSupportedChains, apiDirectDeposit } from '@/lib/api/hyperStealth';
import {
  apiRegister, apiGenerateAddress, apiDeriveKey, apiStealthAddresses,
  getStoredEOA, getHLUserState, apiGetBalance, apiDeposit,
  apiWithdraw, apiBridge, apiGetBridgeStatus, apiWithdrawAvailable,
  getHLSpotState
} from '@/lib/api/hyperStealth';
import { prepareForPairing, setSessionProposalHandler } from '@/lib/walletController';
import { approveToken, switchChainNetwork } from '@/lib/walletHelpers';
import { getAddress, parseUnits } from 'viem';
import Horizen from '../../../public/horizen2.png';
import Arbitrum from '../../../public/arb.png';

const ARBITRUM_ID = 42161;
const HORIZEN_ID = 26514;

type MainTab = 'BRIDGE' | 'WITHDRAW_TEE' | 'PA';
type TxStatus = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR';
type TerminalView = 'ACTIONS' | 'DEPOSIT_INPUT' | 'DEPOSIT_STEPS' | 'WITHDRAW_INPUT' | 'WITHDRAW_STEPS' | 'CONNECT_HANDSHAKE' | 'SIGNING_REQUIRED' | 'CONNECT_STATUS';
type ConnectStep = 'idle' | 'pairing' | 'approving' | 'success';
type TxStep = 'signing' | 'relaying' | 'finalizing' | 'success';

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
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  maxLabel?: string;
  onMax?: () => void;
  error?: string | null;
  placeholder?: string;
  suffix?: string;
  big?: boolean;
  id?: string;
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
      <div className={`flex items-center gap-2 rounded-2xl border bg-white/3 px-4 py-3 transition-colors ${error ? 'border-red-500/40' : 'border-white/10 focus-within:border-purple-500/35'
        }`}>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={e => {
            // Only allow valid numeric input
            const v = e.target.value;
            if (v === '' || /^\d*\.?\d*$/.test(v)) onChange(v);
          }}
          placeholder={placeholder}
          className={`flex-1 bg-transparent outline-none placeholder:text-gray-700 min-w-0 ${big ? 'text-2xl font-semibold' : 'text-base font-medium'
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

  const [activeTab, setActiveTab] = useState<MainTab>('BRIDGE');
  const [selectedProxy, setSelectedProxy] = useState<Proxy | null>(null);
  // Track whether terminal pane is visually open (delayed close for animation)
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverBalance, setServerBalance] = useState('0'); // available (deposited - credited)
  const [withdrawProxy, setWithdrawProxy] = useState(0); // total bridged into TEE
  const [txStatus, setTxStatus] = useState<TxStatus>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newestProxyAddress, setNewestProxyAddress] = useState<string | null>(null);
  const [refreshingBalance, setRefreshingBalance] = useState<string | null>(null);
  const [teeTxStep, setTeeTxStep] = useState<TxStep>('signing');
  const [teeTxProgress, setTeeTxProgress] = useState(0);
  const [showTeeTxOverlay, setShowTeeTxOverlay] = useState(false);

  // Separate amount state for each context to avoid cross-contamination
  const [bridgeAmount, setBridgeAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [teeAmount, setTeeAmount] = useState('');
  const [withdrawMax, setWithdrawMax] = useState(0);

  const [wcUri, setWcUri] = useState('');
  const [destination, setDestination] = useState('');
  const [view, setView] = useState<TerminalView>('ACTIONS');
  const [txStep, setTxStep] = useState<TxStep>('signing');
  const [progress, setProgress] = useState(0);

  // Pagination & Multi-chain
  const [supportedChains, setSupportedChains] = useState<any[]>([]);
  const [sourceChainName, setSourceChainName] = useState<string>("");
  const [showChainSelector, setShowChainSelector] = useState(false);

  // Pagination bounds
  const [proxyPage, setProxyPage] = useState(1);
  const [hasMoreProxies, setHasMoreProxies] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [connectStep, setConnectStep] = useState<ConnectStep>('idle');
  const [pendingReq, setPendingReq] = useState<PendingRequest | null>(null);
  const [hlConnected, setHlConnected] = useState(false);
  const directConnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [bridgePhase, setBridgePhase] = useState<'idle' | 'switching' | 'approving' | 'bridging' | 'waiting' | 'done' | 'error'>('idle');
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [mobileShowTerminal, setMobileShowTerminal] = useState(false);

  // Tutorial state
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const signingHandledRef = useRef(false);
  const signingActiveRef = useRef(false);
  const selectedProxyRef = useRef<Proxy | null>(null);
  // Guard against concurrent loadData invocations (prevents the multiple-reload glitch)
  const loadingInFlightRef = useRef(false);

  // Dynamic tutorial steps: insert "Connect Wallet" step at index 1 when disconnected
  const effectiveSteps = useMemo(
    () => TUTORIAL_STEPS.filter(s => !s.onlyWhenDisconnected || !address),
    [address]
  );

  // When wallet connects, the connect-wallet step disappears from effectiveSteps.
  // tutorialStep index stays the same — it now points to "Bridge Funds" automatically.
  // The TutorialTooltip useEffect will re-fire because effectiveSteps is now in its deps.
  // Nothing extra needed here, but keep this for clarity.
  useEffect(() => { /* effectiveSteps handled reactively via useMemo + TutorialTooltip deps */ }, [address]);

  const HORIZEN_USDC_ADDRESS = (import.meta as any).env?.VITE_HORIZEN_USDC_ADDRESS;
  const CENTRAL_WALLET = (import.meta as any).env?.VITE_CENTRAL_WALLET;

  const TX_STEPS = [
    { id: 'signing', label: 'Authorize', desc: 'Sign secure permit' },
    { id: 'relaying', label: 'Relaying', desc: 'Submitting to sequencer' },
    { id: 'finalizing', label: 'Finalizing', desc: 'Confirming settlement' },
  ];

  // Horizen wallet balance
  const { data: walletBal } = useBalance({
    address,
    token: HORIZEN_USDC_ADDRESS as `0x${string}`,
    chainId: HORIZEN_ID,
  });

  // Chain guard — always enforce Arbitrum unless bridging
  const isOnArbitrum = chain?.id === ARBITRUM_ID;
  const isOnHorizen = chain?.id === HORIZEN_ID;
  const wrongChain = !isOnArbitrum && !isOnHorizen;

  // Derived max values
  const depositMax = Number(serverBalance) / 1e6;
  // const withdrawMax = Number(withdrawProxy) / 1e6;
  const bridgeMax = Number(walletBal?.formatted ?? 0);
  const teeMax = Number(serverBalance) / 1e6;

  // Per-field error calculation (no useEffect — computed inline, stable)
  const getBridgeError = useCallback(() => {
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
  const loadData = async (page = 1, append = false) => {
    // Prevent concurrent calls — only one loadData can run at a time
    if (loadingInFlightRef.current) return;
    loadingInFlightRef.current = true;

    const eoa = getStoredEOA() || address;
    if (!eoa || !signTypedDataAsync) { setLoading(false); loadingInFlightRef.current = false; return; }
    if (page > 1) setLoadingMore(true); else setLoading(true);
    try {
      const res = await apiStealthAddresses(eoa, signTypedDataAsync, page, 20);
      // Correct sequential numbering across pages (page 2 starts at 21, not 1)
      const offset = (page - 1) * 20;
      const list = res.stealthAddresses.map((s: any, i: number) => ({
        num: offset + i + 1,
        address: s.address,
        connected: false,
        balance: '0',
        pnl: '0',
        hlBalance: 0,
      }));

      // Use total from API to correctly detect if more pages exist
      const loadedSoFar = append ? offset + list.length : list.length;
      setHasMoreProxies(loadedSoFar < (res.total ?? 0));

      if (!append) {
        // Fresh load — reset page counter to 1
        setProxyPage(1);
        setProxies(list);
      } else {
        setProxies(prev => [...prev, ...list]);
      }

      // Fetch server balance (TEE wallet) — lightweight, needed for withdraw tab
      try {
        const bal = await apiGetBalance(eoa);
        setServerBalance(bal.available);
      } catch { }

      // Load supported chains config once
      if (!supportedChains.length) {
        try {
          const chainsConfig = await apiGetSupportedChains();
          setSupportedChains(chainsConfig.chains || []);
        } catch (e) { console.error('Failed to load chains', e); }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setLoadingMore(false); loadingInFlightRef.current = false; }
  };

  const loadMoreProxies = () => {
    if (loadingMore || !hasMoreProxies || loadingInFlightRef.current) return;
    // Use functional updater so we always read the latest page value
    setProxyPage(prev => {
      const nextPage = prev + 1;
      // Schedule outside the setter to avoid calling loadData inside setState
      setTimeout(() => loadData(nextPage, true), 0);
      return nextPage;
    });
  };

  // Tutorial: show on first dashboard visit (temporarily forced for testing)
  useEffect(() => {
    // const done = localStorage.getItem('nyra_tutorial_done');
    // if (!done) {
    setTimeout(() => setTutorialStep(0), 600);
    // }
  }, []);

  // Tutorial auto-advance logic mapped to exact 17-step sequence
  useEffect(() => {
    if (tutorialStep === null) return;
    if (tutorialStep === 0 && sourceChainName !== '') setTutorialStep(1);
    if (tutorialStep === 1 && Number(bridgeAmount) > 0) setTutorialStep(2);
    if (tutorialStep === 3 && activeTab === 'PA') setTutorialStep(4);
    if (tutorialStep === 4 && selectedProxy) setTutorialStep(5);
    if (tutorialStep === 5 && wcUri.trim().startsWith('wc:')) setTutorialStep(6);
    if (tutorialStep === 7 && view === 'DEPOSIT_INPUT') setTutorialStep(8);
    if (tutorialStep === 8 && Number(depositAmount) > 0) setTutorialStep(9);
    if (tutorialStep === 11 && view === 'WITHDRAW_INPUT') setTutorialStep(12);
    if (tutorialStep === 12 && destination.trim().length > 5) setTutorialStep(13);
    if (tutorialStep === 13 && Number(withdrawAmount) > 0) setTutorialStep(14);
    if (tutorialStep === 15 && activeTab === 'WITHDRAW_TEE') setTutorialStep(16);
    if (tutorialStep === 16 && Number(teeAmount) > 0) setTutorialStep(17);
  }, [tutorialStep, activeTab, selectedProxy, wcUri, view, bridgeAmount, depositAmount, destination, withdrawAmount, teeAmount, sourceChainName]);

  useEffect(() => {
    // Reset all proxy/pagination state when wallet changes
    setProxies([]);
    setLoading(false);
    setSelectedProxy(null);
    setTerminalVisible(false);
    setMobileShowTerminal(false);
    setProxyPage(1);
    setHasMoreProxies(true);
    loadingInFlightRef.current = false; // release any in-flight guard from previous session
    // When user connects wallet, if they selected a source chain, try to switch to it
    if (address && sourceChainName) {
      const config = supportedChains.find(c => c.name === sourceChainName);
      if (config?.chainId) {
        try { switchChain({ chainId: config.chainId }) } catch(e) {}
      }
    }
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
    // loadData manages its own loading state and in-flight guard — just call it directly
    loadData(1, false);
  };

  const handleSwitchToWithdrawTee = async () => {
    setActiveTab('WITHDRAW_TEE');
    try { switchChain({ chainId: 42161 }); } catch(e) {}
    if (loading) return;
    setLoading(true);
    try {
      const bal = await apiGetBalance(address!);
      console.log(bal, "balance")
      setServerBalance(bal.available);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // Bridge — switches to selected chain, then switches BACK to Arbitrum after done
  const handleBridge = async () => {
    setBridgePhase('switching'); setBridgeError(null);
    try {
      const isDirect = isOnArbitrum || sourceChainName === 'arbitrum';
      const rawAmount = parseUnits(bridgeAmount, 6).toString();

      if (!isDirect) {
        const sc = supportedChains.find(c => c.name === sourceChainName);
        if (sc) await switchChainNetwork(sc.chainId);
      }

      setBridgePhase('approving');
      // For Horizen or Direct, the CENTRAL_WALLET is the spender. For Stargate it might be stargatePool contract.
      // Based on docs, user approves central wallet on source chain USDC contract.
      // E.g. HORIZEN_USDC_ADDRESS for horizen, or ARBITRUM_USDC address for direct deposit.
      const sc = supportedChains.find(c => c.name === sourceChainName);
      const tokenAddress = isDirect ? "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" : (sc ? sc.token : HORIZEN_USDC_ADDRESS); // arbitrum native usdc

      await approveToken(tokenAddress, CENTRAL_WALLET, rawAmount);

      setBridgePhase('bridging');
      if (isDirect) {
        await apiDirectDeposit(address!, rawAmount, signTypedDataAsync);
        setBridgePhase('done');
        await loadData();
      } else {
        const res = await apiBridge(address!, rawAmount, signTypedDataAsync, sourceChainName);
        setBridgePhase('waiting');
        let delivered = false;
        while (!delivered) {
          const s = await apiGetBridgeStatus(res.txHash);
          if (s.status === 'DELIVERED') delivered = true;
          else if (s.status === 'FAILED') throw new Error('Bridge transaction failed on-chain');
          else await new Promise(r => setTimeout(r, 3000));
        }
        await switchChainNetwork(ARBITRUM_ID);
        setBridgePhase('done');
        await loadData();
      }
    } catch (e: any) { setBridgeError(e.message || 'Bridge failed'); setBridgePhase('error'); }
  };

  const handleTeeWithdraw = async () => {
    if (!address || !teeAmount) return;
    setShowTeeTxOverlay(true);
    setTeeTxStep('signing');
    setTeeTxProgress(20);
    try {
      await new Promise(r => setTimeout(r, 800));
      setTeeTxStep('relaying');
      setTeeTxProgress(60);
      const rawAmount = parseUnits(teeAmount, 6).toString();
      await apiWithdrawAvailable(address, address, rawAmount, signTypedDataAsync);
      setTeeTxStep('finalizing');
      setTeeTxProgress(90);
      await new Promise(r => setTimeout(r, 1200));
      setTeeTxProgress(100);
      setTimeout(() => {
        setShowTeeTxOverlay(false);
        setTeeTxProgress(0);
        setActiveTab('PA');
        loadData();
      }, 2000);
    } catch (e: any) {
      setError(e.message || 'Withdrawal failed');
      setShowTeeTxOverlay(false);
      setTeeTxProgress(0);
    }
  };

  const handleConnect = async () => {
    if (!selectedProxy || !wcUri.startsWith('wc:')) { setError('Invalid WalletConnect URI'); setView('ACTIONS'); return; }
    // Ensure on Arbitrum before connecting
    if (!isOnArbitrum) {
      try { await switchChainNetwork(ARBITRUM_ID); } catch { setError('Please switch to Arbitrum first'); return; }
    }
    signingActiveRef.current = false;
    const storedAddress = localStorage.getItem('nyra_active_stealth');
    const storedKey = localStorage.getItem('nyra_stealth_key');
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
            : ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData_v4', 'eth_sign', 'eth_signTypedData'];
          await wc.approveSession({
            id: proposal.id,
            namespaces: { eip155: { accounts: [`eip155:42161:${signerAddress}`], methods, events: ['accountsChanged', 'chainChanged'], chains: ['eip155:42161'] } },
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
              setWithdrawMax(selectedProxy?.hlBalance ?? 0);
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
    setTerminalVisible(true);
    setWithdrawMax(p?.hlBalance);
    // Pre-fill amounts to max on open
    setDepositAmount('');
    setWithdrawAmount('');
  };

  const closeTerminal = () => {
    // Start exit animation — keep selectedProxy mounted until animation done
    setTerminalVisible(false);
    setTimeout(() => {
      setSelectedProxy(null); setView('ACTIONS');
    }, 340); // matches exit transition duration
    setMobileShowTerminal(false);
  };

  const refreshProxyBalance = async (e: React.MouseEvent, proxy: Proxy) => {
    e.stopPropagation();
    if (refreshingBalance === proxy.address) return;
    setRefreshingBalance(proxy.address);
    try {
      const state = await getHLUserState(proxy.address);
      const newBalance = state?.marginSummary?.accountValue ?? '0';
      const newPnl = state?.marginSummary?.unrealizedPnl ?? '0';
      const updated = { ...proxy, balance: newBalance, pnl: newPnl, connected: Number(newBalance) > 0 };
      setProxies(prev => prev.map(x => x.address === proxy.address ? updated : x));
      if (selectedProxy?.address === proxy.address) { setSelectedProxy(updated); setWithdrawMax(updated.hlBalance); }
    } catch (e) { console.error(e); }
    finally { setRefreshingBalance(null); }
  };

  // ── Wrong chain banner ──────────────────────────────────
  const WrongChainBanner = () => (!address || activeTab === 'BRIDGE') ? null : wrongChain ? (
    <div className="mx-4 mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/8 border border-amber-500/25">
      <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-amber-400 font-medium">Wrong network</p>
        <p className="text-[10px] text-amber-400/70 mt-0.5">Switch to Arbitrum One to use Nyra</p>
      </div>
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
                  <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full border ${selectedProxy.connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/20 border-white/8'
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
                  { label: 'Available to deposit', value: depositMax.toFixed(2), tip: 'Deposited to Hyperliquid', color: 'text-purple-400' },
                  { label: 'Withdraw Balance', value: selectedProxy?.hlBalance, tip: 'Ready to deposit / withdraw', color: depositMax >= 5 ? 'text-emerald-400' : 'text-amber-400' },
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
                <motion.a id="tut-start-trading" href="https://app.hyperliquid.xyz/trade" target="_blank" rel="noopener noreferrer"
                  onClick={() => { if (tutorialStep === 10) setTutorialStep(11); }}
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-xl btn-purple text-white font-semibold text-sm"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <ExternalLink size={14} /> Start Trading
                </motion.a>
                <div className="grid grid-cols-2 gap-2">
                  <ActionBtn id="tut-deposit-btn" icon={<ArrowDownLeft size={16} />} label="Deposit" sub="Fund account" onClick={() => { setView('DEPOSIT_INPUT'); try { switchChain({ chainId: 26514 }); } catch(e) {} }} />
                  <ActionBtn id="tut-withdraw-btn" icon={<ArrowUpRight size={16} />} label="Withdraw" sub="Extract funds" onClick={() => { setView('WITHDRAW_INPUT'); try { switchChain({ chainId: 42161 }); } catch(e) {} }} />
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
                  <ActionBtn id="tut-deposit-btn" icon={<ArrowDownLeft size={16} />} label="Deposit" sub="From server" onClick={() => { setView('DEPOSIT_INPUT'); try { switchChain({ chainId: 26514 }); } catch(e) {} }} />
                  <ActionBtn id="tut-withdraw-btn" icon={<ArrowUpRight size={16} />} label="Withdraw" sub="Extract funds" onClick={() => { setView('WITHDRAW_INPUT'); try { switchChain({ chainId: 42161 }); } catch(e) {} }} />
                </div>
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Connect Hyperliquid</p>
                  <div id="tut-wc-input"><WcInput value={wcUri} onChange={setWcUri} placeholder="wc:abc... (paste from Hyperliquid)" /></div>
                  <motion.button id="tut-connect-btn" onClick={() => { handleConnect(); if (tutorialStep === 6) setTutorialStep(7); }} disabled={!wcUri.startsWith('wc:')}
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
                id="tut-deposit-amount"
                value={depositAmount} onChange={setDepositAmount}
                maxLabel={`$${depositMax.toFixed(2)}`} onMax={() => setDepositAmount(depositMax.toFixed(2))}
                error={getDepositError()}
              />
              <p className="text-[10px] text-gray-600">Min 5 USDC · Max 8,000 USDC</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setView('ACTIONS')} className="h-11 rounded-xl bg-white/5 border border-white/8 text-sm text-gray-400 hover:bg-white/8 transition-all">Back</button>
              <motion.button id="tut-deposit-btn-exec" onClick={() => { handleDepositFlow(); if (tutorialStep === 9) setTutorialStep(10); }}
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
                  <input id="tut-withdraw-address" type="text" value={destination} onChange={e => setDestination(e.target.value)}
                    placeholder="0x..." className="w-full bg-transparent text-sm font-mono text-white outline-none placeholder:text-gray-600" />
                </div>
              </div>
              <div className="border-t border-white/5 pt-3">
                <AmountField
                  id="tut-withdraw-amount-proxy"
                  value={withdrawAmount} onChange={setWithdrawAmount}
                  maxLabel={`$${selectedProxy?.hlBalance?.toFixed(2)}`} onMax={() => selectedProxy?.hlBalance !== undefined && setWithdrawAmount(selectedProxy.hlBalance.toFixed(2))}
                  error={getWithdrawError()}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setView('ACTIONS')} className="h-11 rounded-xl bg-white/5 border border-white/8 text-sm text-gray-400 hover:bg-white/8 transition-all">Cancel</button>
              {!address ? (
                <ConnectButton.Custom>
                  {({ openConnectModal }: any) => (
                    <motion.button onClick={openConnectModal} className="h-11 rounded-xl btn-purple text-white text-sm font-medium" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      Connect Wallet
                    </motion.button>
                  )}
                </ConnectButton.Custom>
              ) : (
                <motion.button id="tut-withdraw-submit-proxy" onClick={() => { handleWithdrawFlow(); if (tutorialStep === 14) setTutorialStep(15); }}
                  disabled={!!getWithdrawError() || !withdrawAmount || withdrawAmount === '0' || !destination}
                  className="h-11 rounded-xl btn-purple text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  Withdraw
                </motion.button>
              )}
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
  const BridgeContent = () => {
    const isDirect = isOnArbitrum || sourceChainName === 'arbitrum';
    const activeChainConfig = supportedChains.find(c => c.name === sourceChainName);

    return (
      <motion.div key="bridge" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Funding</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{isDirect ? 'Direct Arbitrum Deposit' : 'Stargate V2 Cross-Chain'}</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
            <Fuel size={12} className="text-purple-400" />
            <span className="text-[10px] text-purple-400 font-medium">{isDirect ? 'Instant' : 'Cross-chain'}</span>
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
              <div 
              id="tut-bridge-network"
              onClick={() => setShowChainSelector(true)}
              className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${getBridgeError() ? 'border-red-500/40 bg-red-500/3' : 'border-white/8 bg-white/3 hover:border-purple-500/25'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${isDirect ? 'bg-blue-600' : sourceChainName === 'horizen' ? 'bg-blue-900 border border-blue-700' : sourceChainName === '' ? 'bg-white/10' : 'bg-purple-500'}`}>
                {isDirect ? <img src={Arbitrum} width={'30px'} height={'30px'} alt="Arbitrum Network" className="rounded-full" /> :
                 sourceChainName === 'horizen' ? <img src={Horizen} width={'30px'} height={'30px'} alt="Horizen Network" className="rounded-full" /> : 
                 sourceChainName === '' ? '🌐' :
                 (activeChainConfig?.name.charAt(0).toUpperCase() || 'C')}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${sourceChainName === '' ? 'text-white/60' : 'text-white'}`}>{sourceChainName === '' ? 'Select Asset' : `USDC${isDirect ? '' : '.e'}`}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs text-gray-400 capitalize">{sourceChainName === '' ? 'Select Chain' : isDirect ? 'Arbitrum (Direct)' : sourceChainName === 'horizen' ? 'Horizen Mainnet' : sourceChainName}</p>
                  <ChevronDown size={12} className="text-gray-500" />
                </div>
              </div>
                <div className="ml-auto flex flex-col items-end gap-1" onClick={e => e.stopPropagation()}>
                  <input id="tut-bridge-amount" type="text" inputMode="decimal" value={bridgeAmount}
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
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0"><img src={Arbitrum} width={'30px'} height={'30px'} alt="Arbitrum Network" /></div>
                <div>
                  <p className="text-sm font-medium text-white">USDC</p>
                  <p className="text-xs text-gray-500">Arbitrum One</p>
                </div>
                <div className="ml-auto text-gray-400 text-sm tabular-nums">~{bridgeAmount || '0'}</div>
              </div>
            </div>

            <p className="text-xs text-gray-600 text-center">Bridge from Horizen Mainnet → Arbitrum · ~2–5 min</p>

            {bridgePhase === 'error' && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/8 border border-red-500/20">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400">{bridgeError}</p>
              </div>
            )}

            {!address ? (
              <ConnectButton.Custom>
                {({ openConnectModal }: any) => (
                  <motion.button onClick={openConnectModal} className="w-full h-12 rounded-2xl btn-purple text-white font-semibold text-sm" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    Connect Wallet
                  </motion.button>
                )}
              </ConnectButton.Custom>
            ) : (
              <motion.button id="tut-bridge-btn" onClick={() => { handleBridge(); if (tutorialStep === 2) setTutorialStep(3); }}
                disabled={!!getBridgeError() || !bridgeAmount || bridgeAmount === '0'}
                className="w-full h-12 rounded-2xl btn-purple text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                Bridge Liquidity
              </motion.button>
            )}
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
            <p className="text-xs text-gray-500 text-center mb-4">{isDirect ? 'Direct Deposit in progress · Do not close' : 'Cross-chain transfer in progress · Do not close'}</p>
            {[
              { id: 'switching', label: 'Switch Network', desc: `Connecting to ${sourceChainName}` },
              { id: 'approving', label: 'Approve Token Spend', desc: 'Sign approval in wallet' },
              { id: 'bridging', label: isDirect ? 'Deposit Funds' : 'Submit Bridge', desc: 'Confirm in wallet' },
              ...(isDirect ? [] : [{ id: 'waiting', label: 'Waiting for Delivery', desc: '~2–5 min' }]),
            ].map((step, i) => {
              const phases = isDirect ? ['switching', 'approving', 'bridging', 'done'] : ['switching', 'approving', 'bridging', 'waiting', 'done'];
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
  };

  // ── CHAIN SELECTOR CONTENT ────────────────────────────────
  const ChainSelectorContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <h2 className="text-xl font-semibold text-white">Select Network</h2>
          <p className="text-xs text-gray-500 mt-0.5">Choose funding source chain</p>
        </div>
        <motion.button onClick={() => setShowChainSelector(false)}
          className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all"
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <X size={13} />
        </motion.button>
      </div>

      <div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar flex-1 pb-4">
        {[
          { id: 'arbitrum', name: 'Arbitrum (Direct)', isDirect: true, chainId: 42161 },
          { id: 'horizen', name: 'Horizen Mainnet', isDirect: false, chainId: 26514 },
          { id: 'ethereum', name: 'Ethereum', isDirect: false, chainId: 1 },
          { id: 'optimism', name: 'Optimism', isDirect: false, chainId: 10 },
          { id: 'base', name: 'Base', isDirect: false, chainId: 8453 },
          { id: 'polygon', name: 'Polygon', isDirect: false, chainId: 137 },
          { id: 'avalanche', name: 'Avalanche', isDirect: false, chainId: 43114 },
          ...supportedChains.filter(c => !['horizen', 'ethereum', 'optimism', 'base', 'polygon', 'avalanche'].includes(c.name)).map(c => ({ id: c.name, name: c.name.charAt(0).toUpperCase() + c.name.slice(1), isDirect: false, chainId: c.chainId }))
        ].map(chain => (
          <motion.div key={chain.id}
            onClick={() => { 
                setSourceChainName(chain.id); 
                setShowChainSelector(false); 
                if (chain.chainId) { try { switchChain({ chainId: chain.chainId }); } catch(e) {} }
            }}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${sourceChainName === chain.id ? 'bg-purple-500/10 border-purple-500/25' : 'bg-white/2 border-white/6 hover:border-white/12'
              }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-lg ${chain.id === 'arbitrum' ? 'bg-blue-600' : chain.id === 'horizen' ? 'bg-blue-900 border border-blue-700' : 'bg-purple-500/20'}`}>
                {chain.id === 'arbitrum' ? <img src={Arbitrum} width={'30px'} height={'30px'} alt="Arbitrum Network" className="rounded-full" /> :
                  chain.id === 'horizen' ? <img src={Horizen} width={'30px'} height={'30px'} alt="Horizen Network" className="rounded-full" /> :
                    chain.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{chain.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{chain.isDirect ? 'Direct USD Deposit' : 'Cross-chain via Stargate'}</p>
              </div>
            </div>
            {sourceChainName === chain.id && (
              <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                <Check size={12} className="text-white font-bold" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
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
        <AmountField id="tut-tee-withdraw-amount" value={teeAmount} onChange={setTeeAmount}
          maxLabel={`$${teeMax.toFixed(2)}`} onMax={() => setTeeAmount(teeMax.toFixed(2))}
          error={getTeeError()} suffix="USDC" />
      </div>
      {!address ? (
        <ConnectButton.Custom>
          {({ openConnectModal }: any) => (
            <motion.button onClick={openConnectModal}
              className="w-full h-12 rounded-2xl btn-purple text-white font-semibold text-sm"
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              Connect Wallet
            </motion.button>
          )}
        </ConnectButton.Custom>
      ) : (
        <motion.button id="tut-tee-withdraw-btn-exec" onClick={() => { handleTeeWithdraw(); if (tutorialStep === 16) setTutorialStep(17); }} disabled={!!getTeeError() || !teeAmount || teeAmount === '0'}
          className="w-full h-12 rounded-2xl btn-purple text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          Withdraw to Arbitrum
        </motion.button>
      )}

      {/* Full-screen fixed TX steps overlay for TEE withdrawal */}
      <AnimatePresence>
        {showTeeTxOverlay && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-8"
            style={{ background: 'rgba(13,10,20,0.97)', backdropFilter: 'blur(12px)' }}>
            <div className="w-full max-w-sm space-y-6">
              <div className="text-center mb-2">
                <h3 className="text-base font-semibold text-white">Processing Withdrawal</h3>
                <p className="text-xs text-gray-500 mt-1">TEE → Arbitrum · Do not close</p>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full progress-purple rounded-full" animate={{ width: `${teeTxProgress}%` }} transition={{ duration: 0.5 }} />
              </div>
              <div className="space-y-2">
                {TX_STEPS.map((s, i) => {
                  const stepOrder = ['signing', 'relaying', 'finalizing'];
                  const currentIdx = stepOrder.indexOf(teeTxStep);
                  const thisIdx = stepOrder.indexOf(s.id);
                  const isCurrent = teeTxStep === s.id && teeTxProgress < 100;
                  const isDone = thisIdx < currentIdx || teeTxProgress === 100;
                  return (
                    <div key={s.id} className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${isCurrent ? 'bg-purple-500/8 border-purple-500/20' : isDone ? 'bg-emerald-500/5 border-emerald-500/15' : 'opacity-30 border-transparent'}`}>
                      <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-emerald-500 border-emerald-500' : isCurrent ? 'border-purple-500 text-purple-400' : 'border-white/10'}`}>
                        {isDone ? <Check size={14} className="text-white" /> : isCurrent ? <Loader2 size={14} className="animate-spin" /> : <span className="text-[10px] font-semibold">{i + 1}</span>}
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${isCurrent ? 'text-white' : isDone ? 'text-emerald-400' : 'text-white/20'}`}>{s.label}</p>
                        <p className="text-[10px] text-gray-600">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {teeTxProgress === 100 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 pt-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Check className="text-emerald-400" size={24} />
                  </div>
                  <p className="text-sm text-gray-300 font-medium">Withdrawal Complete</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
        {/* Hide + button when disconnected */}
        {address && (
          <motion.button id="tut-proxy-create"
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
        )}
      </div>

      {/* Proxy list body */}
      {!address ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 py-12 border border-dashed border-white/10 rounded-2xl bg-white/2">
          <Shield size={32} className="opacity-20 text-purple-400" />
          <div className="text-center">
            <p className="text-sm text-gray-300 font-medium">Connect wallet to get started</p>
            <p className="text-xs text-gray-600 mt-1">Create stealth proxies and trade privately</p>
          </div>
          <ConnectButton.Custom>
            {({ openConnectModal }: any) => (
              <button onClick={openConnectModal} className="px-5 py-2 rounded-xl btn-purple text-white text-xs font-semibold">
                Connect Wallet
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      ) : (
        <div
          className="space-y-2 overflow-y-auto max-h-[420px] pr-1 custom-scrollbar"
          onScroll={(e) => {
            const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
            if (scrollHeight - scrollTop <= clientHeight + 50) loadMoreProxies();
          }}
        >
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
                  id={p.num === 1 ? 'tut-proxy-item' : undefined}
                  initial={isNew ? { opacity: 0, y: -12, scale: 0.97 } : { opacity: 1, y: 0, scale: 1 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  onClick={() => openProxy(p)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${selectedProxy?.address === p.address ? 'bg-purple-500/10 border-purple-500/25'
                    : isNew ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-white/2 border-white/6 hover:border-white/12'
                    }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${selectedProxy?.address === p.address ? 'bg-purple-500 text-white'
                      : isNew ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/5 text-white/30'
                      }`}>{p.num}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-400 truncate" title={p.address}>{p.address.slice(0, 12)}...</span>
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
                    <motion.button onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(p.address);
                    }} title="Copy address"
                      className="w-7 h-7 rounded-lg bg-white/4 hover:bg-purple-500/15 border border-white/6 hover:border-purple-500/30 flex items-center justify-center text-white/20 hover:text-purple-400 transition-all"
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Copy size={11} />
                    </motion.button>
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
          {loadingMore && (
            <div className="flex justify-center p-2">
              <Loader2 className="animate-spin text-purple-500 opacity-50" size={16} />
            </div>
          )}
        </div>
      )}
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
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selectedProxy?.connected ? 'bg-emerald-400' : 'bg-white/20'}`} />
                    <p className="text-xs font-semibold text-white truncate">{selectedProxy?.address.slice(0, 10)}…{selectedProxy?.address.slice(-6)}</p>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-0.5">{selectedProxy?.connected ? 'Session Active' : 'Proxy Account'}</p>
                </div>
                {Number(selectedProxy?.balance) > 0 && (
                  <div className="flex-shrink-0 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/25">
                    <span className="text-xs font-semibold text-purple-300">${Number(selectedProxy?.balance).toFixed(2)}</span>
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
          <AnimatePresence>
            {activeTab === 'BRIDGE' && <BridgeContent key="bridge" />}
            {activeTab === 'WITHDRAW_TEE' && <WithdrawTeeContent key="tee" />}
            {activeTab === 'PA' && <ProxyList key="pa" />}
          </AnimatePresence>
        </div>

        {/* Mobile Chain Selector sheet */}
        <AnimatePresence>
          {showChainSelector && activeTab === 'BRIDGE' && (
            <motion.div key="mobile-chain-selector"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="fixed inset-0 z-[90] flex flex-col px-4 pt-4 pb-12"
              style={{ paddingTop: 'env(safe-area-inset-top, 56px)', background: 'rgba(12,8,22,0.98)', backdropFilter: 'blur(10px)' }}>
              <ChainSelectorContent />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile bottom tab bar */}
        <div className="fixed bottom-0 left-0 right-0 z-[80] glass border-t border-white/8"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="flex relative">
            {([
              { id: 'BRIDGE', icon: <ArrowRightLeft size={18} />, label: 'Bridge' },
              { id: 'WITHDRAW_TEE', icon: <ArrowUpRight size={18} />, label: 'Withdraw' },
              { id: 'PA', icon: <Layers size={18} />, label: 'Accounts' },
            ] as { id: MainTab; icon: React.ReactNode; label: string }[]).map(tab => (
              <button key={tab.id}
                id={tab.id === 'PA' ? 'tut-tab-pa' : tab.id === 'WITHDRAW_TEE' ? 'tut-tab-tee-withdraw' : undefined}
                onClick={() => { if (tab.id === 'PA') { setActiveTab('PA'); handleSwitchToPA(); } else if (tab.id === "WITHDRAW_TEE") { setActiveTab(tab.id); handleSwitchToWithdrawTee(); } else setActiveTab(tab.id); setMobileShowTerminal(false); setShowChainSelector(false); }}
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
            <SideTab active={activeTab === 'BRIDGE'} onClick={() => { setActiveTab('BRIDGE'); setTerminalVisible(false); setTimeout(() => setSelectedProxy(null), 340); setShowChainSelector(false); }} icon={<ArrowRightLeft size={18} />} title="Bridge" />
            <SideTab id="tut-tab-tee-withdraw" active={activeTab === 'WITHDRAW_TEE'} onClick={() => { setActiveTab('WITHDRAW_TEE'); handleSwitchToWithdrawTee(); setTerminalVisible(false); setTimeout(() => setSelectedProxy(null), 340); setShowChainSelector(false); }} icon={<ArrowUpRight size={18} />} title="Withdraw TEE" />
            <SideTab id="tut-tab-pa" active={activeTab === 'PA'} onClick={() => { setActiveTab('PA'); handleSwitchToPA(); setShowChainSelector(false); }} icon={<Layers size={18} />} title="Accounts" />
          </motion.div>

          {/* Main widget — width driven by terminalVisible/chain selector to avoid glitch on close */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            className="glass-card rounded-3xl flex"
            style={{
              width: ((selectedProxy && activeTab === 'PA') || (showChainSelector && activeTab === 'BRIDGE')) ? 820 : 440,
              minHeight: 520,
              overflow: 'clip',
              transition: 'width 0.32s cubic-bezier(0.25,0.1,0.25,1)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,85,247,0.08)',
            }}>

            {/* Explorer pane */}
            <div className="p-7 flex flex-col flex-shrink-0" style={{ width: 440 }}>
              {wrongChain && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/8 border border-amber-500/25 mb-5 flex-shrink-0">
                  <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-400 flex-1">Switch to Arbitrum One to use Nyra</p>
                  <button onClick={() => switchChain({ chainId: ARBITRUM_ID })} className="text-[10px] font-bold text-amber-400 border border-amber-400/30 px-2.5 py-1 rounded-lg hover:bg-amber-500/10 transition-colors flex-shrink-0">Switch</button>
                </div>
              )}
              <AnimatePresence mode="wait">
                {activeTab === 'BRIDGE' && <BridgeContent />}
                {activeTab === 'WITHDRAW_TEE' && <WithdrawTeeContent />}
                {activeTab === 'PA' && <ProxyList />}
              </AnimatePresence>
            </div>

            {/* Terminal pane / Chain Selector */}
            <AnimatePresence mode="sync">
              {((selectedProxy && activeTab === 'PA') || (showChainSelector && activeTab === 'BRIDGE')) && (
                <motion.div
                  key={activeTab === 'PA' ? selectedProxy?.address : 'chain-selector'}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                  className="border-l border-white/5 flex flex-col p-6 relative overflow-hidden flex-shrink-0"
                  style={{ width: 360, background: 'rgba(15,10,28,0.7)' }}>

                  {activeTab === 'PA' && selectedProxy ? (
                    <>
                      {/* Terminal header */}
                      <div className="flex items-center justify-between mb-5 flex-shrink-0">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${selectedProxy?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-white/15'}`} />
                            <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-widest">{selectedProxy?.connected ? 'Session Active' : 'Terminal'}</p>
                          </div>
                          <p className="font-mono text-[9px] text-gray-600 truncate w-[190px]">{selectedProxy?.address}</p>
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
                    </>
                  ) : (
                    <ChainSelectorContent />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      {/* ── TUTORIAL OVERLAY ──────────────────────────────── */}
      <TutorialTooltip
        step={tutorialStep}
        effectiveSteps={effectiveSteps}
        onNext={() => {
          const next = (tutorialStep ?? 0) + 1;
          if (next >= effectiveSteps.length) {
            setTutorialStep(null);
            localStorage.setItem('nyra_tutorial_done', 'true');
          } else {
            setTutorialStep(next);
          }
        }}
        onPrev={() => setTutorialStep(Math.max(0, (tutorialStep ?? 0) - 1))}
        onSkip={() => { setTutorialStep(null); localStorage.setItem('nyra_tutorial_done', 'true'); }}
      />

      {/* ── HELP MODAL ─────────────────────────────────────── */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div key="help-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowHelpModal(false)}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            style={{ background: 'rgba(3,3,10,0.82)', backdropFilter: 'blur(12px)' }}>
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl overflow-hidden relative"
              style={{ background: 'rgba(18,10,36,0.98)', border: '1px solid rgba(168,85,247,0.15)', boxShadow: '0 0 80px rgba(147,51,234,0.2), 0 32px 64px rgba(0,0,0,0.7)' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
                    <Shield size={13} className="text-purple-400" />
                  </div>
                  <p className="text-sm font-semibold text-white">How to use Nyra</p>
                </div>
                <button onClick={() => setShowHelpModal(false)} className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all">
                  <X size={13} />
                </button>
              </div>
              {/* Steps */}
              <div className="px-6 py-5 space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {effectiveSteps.map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                      style={{ background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(168,85,247,0.25)' }}>
                      <span className="text-[9px] font-bold text-purple-400">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/85">{s.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{s.desc}</p>
                      {s.note && <p className="text-[10px] text-purple-400/70 mt-1 italic">{s.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
                <p className="text-[10px] text-gray-600">Signature only · No gas cost</p>
                <motion.button onClick={() => { setShowHelpModal(false); setActiveTab('BRIDGE'); setTutorialStep(0); }}
                  className="text-[11px] text-purple-400 font-semibold hover:text-purple-300 transition-colors flex items-center gap-1"
                  whileHover={{ scale: 1.03 }}>
                  Start walkthrough →
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HELP BUTTON ─────────────────────────────────────── */}
      <motion.button
        onClick={() => setShowHelpModal(true)}
        className="fixed bottom-6 right-6 z-[250] w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-purple-300 shadow-lg"
        style={{ background: 'rgba(147,51,234,0.18)', border: '1px solid rgba(168,85,247,0.3)', backdropFilter: 'blur(8px)', boxShadow: '0 0 20px rgba(147,51,234,0.2)' }}
        whileHover={{ scale: 1.12, boxShadow: '0 0 30px rgba(147,51,234,0.4)' }}
        whileTap={{ scale: 0.94 }}
        title="Help & Tutorial"
      >
        ?
      </motion.button>
    </div>
  );
}

/* ─── TUTORIAL DATA ──────────────────────────────────────── */
interface TutorialStepDef {
  title: string;
  desc: string;
  note?: string;
  icon: string;
  targetId?: string | string[];
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  autoAdvance?: boolean;
  onlyWhenDisconnected?: boolean;
}

const TUTORIAL_STEPS: TutorialStepDef[] = [
  {
    title: 'Step 1 — Select Network',
    icon: '🌐',
    desc: 'Welcome to Nyra! First, select the network you want to fund from. Click the "From" section to pick your preferred chain.',
    targetId: 'tut-bridge-network',
    tooltipSide: 'left',
    autoAdvance: true,
  },
  {
    title: 'Step 2 — Connect Wallet',
    icon: '🔑',
    desc: 'Connect your wallet to get started. Click the "Connect" button in the top-right corner to link your wallet.',
    targetId: 'tut-header-connect',
    tooltipSide: 'bottom',
    autoAdvance: true,
    onlyWhenDisconnected: true,
  },
  {
    title: 'Step 2 — Bridge Funds',
    icon: '🌉',
    desc: 'You first need to move USDC from your selected chain into Nyra\'s secure environment on Arbitrum. Go ahead and enter an amount.',
    targetId: 'tut-bridge-amount',
    tooltipSide: 'left',
    autoAdvance: true,
  },
  {
    title: 'Step 3 — Execute Transfer',
    icon: '💵',
    desc: 'Click "Bridge Liquidity". Your wallet will ask you to approve and confirm. The secure transfer takes ~2–5 minutes.',
    targetId: 'tut-bridge-btn',
    tooltipSide: 'top',
    autoAdvance: true,
  },
  {
    title: 'Step 4 — Open Proxy Accounts',
    icon: '🗂️',
    desc: 'With your server funded, let\'s explore your stealth proxies. Click the Accounts tab.',
    targetId: 'tut-tab-pa',
    tooltipSide: 'right',
    autoAdvance: true,
  },
  {
    title: 'Step 5 — Select or Create Proxy',
    icon: '👆',
    desc: 'Click on any proxy address in the list to manage it, or use the + button to spawn a new one.',
    targetId: ['tut-proxy-item', 'tut-proxy-create'],
    tooltipSide: 'bottom',
    autoAdvance: true,
  },
  {
    title: 'Step 6 — Connect to Exchange',
    icon: '🔗',
    desc: 'To trade on Hyperliquid, open app.hyperliquid.xyz, go to Connect Wallet → WalletConnect, and copy the URI. Paste it here.',
    targetId: 'tut-wc-input',
    tooltipSide: 'top',
    autoAdvance: true,
  },
  {
    title: 'Step 7 — Establish Session',
    icon: '🤝',
    desc: 'Click Connect. Hyperliquid might ask you to accept its Terms or Establish a Connection. Click those buttons in their interface, then come back here.',
    targetId: 'tut-connect-btn',
    tooltipSide: 'top',
    autoAdvance: true,
  },
  {
    title: 'Step 8 — Fund Strategy',
    icon: '🏦',
    desc: 'Now that the session is bound, let\'s send funds from your stealth server to this specific proxy\'s Hyperliquid account.',
    targetId: 'tut-deposit-btn',
    tooltipSide: 'bottom',
    autoAdvance: true,
  },
  {
    title: 'Step 9 — Enter Deposit Amount',
    icon: '⬇️',
    desc: 'Enter the amount of USDC you want to deposit into your proxy account.',
    targetId: 'tut-deposit-amount',
    tooltipSide: 'top',
    autoAdvance: true,
  },
  {
    title: 'Step 10 — Confirm Deposit',
    icon: '✅',
    desc: 'Click Deposit Now to execute the transaction.',
    targetId: 'tut-deposit-btn-exec',
    tooltipSide: 'top',
    autoAdvance: true,
  },
  {
    title: 'Step 11 — Trade Confidentially',
    icon: '⚡',
    desc: 'Click below to open the Hyperliquid terminal. You are now trading entirely anonymously.',
    targetId: 'tut-start-trading',
    tooltipSide: 'top',
  },
  {
    title: 'Step 12 — Extract Profits',
    icon: '⬆️',
    desc: 'When you are done trading, click Withdraw to extract your funds back to the proxy.',
    targetId: 'tut-withdraw-btn',
    tooltipSide: 'bottom',
    autoAdvance: true,
  },
  {
    title: 'Step 13 — Destination Wallet',
    icon: '📍',
    desc: 'Paste a fresh destination EOA address where you want to receive your funds.',
    targetId: 'tut-withdraw-address',
    tooltipSide: 'top',
    autoAdvance: true,
  },
  {
    title: 'Step 14 — Withdrawal Amount',
    icon: '💰',
    desc: 'Enter the amount you would like to withdraw from Hyperliquid.',
    targetId: 'tut-withdraw-amount-proxy',
    tooltipSide: 'top',
    autoAdvance: true,
  },
  {
    title: 'Step 15 — Confirm Withdrawal',
    icon: '✅',
    desc: 'Click Withdraw to bring the funds back from the exchange.',
    targetId: 'tut-withdraw-submit-proxy',
    tooltipSide: 'top',
    autoAdvance: true,
  },
  {
    title: 'Step 16 — Move off Server',
    icon: '☁️',
    desc: 'Finally, use the Withdraw TEE tab to move the funds out of the enclave completely.',
    targetId: 'tut-tab-tee-withdraw',
    tooltipSide: 'right',
    autoAdvance: true,
  },
  {
    title: 'Step 17 — Enter TEE Amount',
    icon: '💵',
    desc: 'Decide how much of your secure server balance you want to withdraw back to Arbitrum.',
    targetId: 'tut-tee-withdraw-amount',
    tooltipSide: 'top',
    autoAdvance: true,
  },
  {
    title: 'Step 18 — Withdraw to Main',
    icon: '🏦',
    desc: 'Click Withdraw to Arbitrum. Your completely private trading lifecycle is now complete!',
    targetId: 'tut-tee-withdraw-btn-exec',
    tooltipSide: 'top',
    autoAdvance: true,
  }
];

/* ─── TUTORIAL POPOVER (MATCHES USER SCREENSHOT STYLE) ───── */
function TutorialTooltip({
  step, effectiveSteps, onNext, onPrev, onSkip,
}: {
  step: number | null;
  effectiveSteps: TutorialStepDef[];
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (step === null) return;
    const s = effectiveSteps[step];
    if (!s || !s.targetId) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const idsToTry = Array.isArray(s.targetId) ? s.targetId : [s.targetId];
      let visibleEl: Element | null = null;
      let bestRect: DOMRect | null = null;

      for (const tId of idsToTry) {
        if (!tId) continue;
        const els = document.querySelectorAll(`[id="${tId}"]`);
        els.forEach((e) => {
          const rect = e.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && !visibleEl) {
            visibleEl = e;
            bestRect = rect;
          }
        });
        if (visibleEl) break; // found a visible target, stop searching fallbacks
      }

      if (visibleEl && bestRect) {
        setTargetRect(bestRect);
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true); // capture scroll in containers
    const interval = setInterval(updateRect, 300); // Polling for layout shifts
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      clearInterval(interval);
    };
  }, [step, effectiveSteps]);

  if (step === null) return null;
  const s = effectiveSteps[step];
  if (!s) return null;
  const isFirst = step === 0;
  const isLast = step === effectiveSteps.length - 1;

  // If no target is found (e.g., element is temporarily missing during an animation), return null
  // The polling interval will instantly automatically mount this popover when the element finishes animating into layout
  if (!s.targetId || !targetRect) return null;

  // Calculate Tooltip position relative to the target Rect
  const pad = 14;
  const side = s.tooltipSide || 'bottom';
  let tipStyle: React.CSSProperties = { position: 'absolute' };
  let arrowClass = '';
  let arrowStyle: React.CSSProperties = { position: 'absolute', width: 14, height: 14, backgroundColor: '#7c3aed', transform: 'rotate(45deg)' };

  // Calculate styles based on the side it should pop out
  if (side === 'bottom') {
    tipStyle.top = targetRect.bottom + pad;
    tipStyle.left = targetRect.left;
    arrowStyle.top = -6; // Pull arrow up
    arrowStyle.left = 24; // Offset from left
  } else if (side === 'top') {
    tipStyle.bottom = window.innerHeight - targetRect.top + pad;
    tipStyle.left = targetRect.left;
    arrowStyle.bottom = -6; // Pull arrow down
    arrowStyle.left = 24;
  } else if (side === 'right') {
    tipStyle.top = targetRect.top;
    tipStyle.left = targetRect.right + pad;
    arrowStyle.top = 24;
    arrowStyle.left = -6; // Pull arrow left
  } else if (side === 'left') {
    tipStyle.top = targetRect.top;
    tipStyle.right = window.innerWidth - targetRect.left + pad;
    arrowStyle.top = 24;
    arrowStyle.right = -6; // Pull arrow right
  } else if (side === 'center') {
    tipStyle.top = targetRect.top + targetRect.height / 2;
    tipStyle.left = targetRect.left + targetRect.width / 2;
    tipStyle.transform = 'translate(-50%, -50%)';
  }

  // Constrain tooltip to viewport (naively)
  if (side === 'bottom' || side === 'top') {
    tipStyle.maxWidth = '300px';
    if (targetRect.left + 300 > window.innerWidth) {
      tipStyle.left = 'auto';
      tipStyle.right = '16px';
      if (side === 'bottom') arrowStyle.left = 'auto'; arrowStyle.right = 24;
      if (side === 'top') arrowStyle.left = 'auto'; arrowStyle.right = 24;
    }
  }

  return (
    <div className="fixed inset-0 z-[500] pointer-events-none">
      {/* Target Highlight box (mimics the glowing green focus from their references, but in purple) */}
      <div
        className="absolute border-2 border-[#7c3aed] bg-[#7c3aed]/10 pointer-events-none rounded transition-all duration-300"
        style={{
          left: targetRect.left - 4,
          top: targetRect.top - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          boxShadow: '0 0 15px rgba(124,58,237,0.4)',
        }}
      />

      {/* Tooltip Card directly pointing at the element */}
      <motion.div
        key={`tip-${step}`}
        initial={{ opacity: 0, scale: 0.95, y: side === 'bottom' ? -10 : 0 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-[280px] pointer-events-auto"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label={s.title}
        style={tipStyle}
      >
        <TooltipCard s={s} step={step} isFirst={isFirst} isLast={isLast} totalSteps={effectiveSteps.length} onNext={onNext} onPrev={onPrev} onSkip={onSkip} arrowStyle={arrowStyle} />
      </motion.div>
    </div>
  );
}

// Inner content of the tooltip (Built to match user's simple popover expectation)
function TooltipCard({ s, step, isFirst, isLast, totalSteps, onNext, onPrev, onSkip, arrowStyle }: any) {
  return (
    <div className="relative rounded-lg shadow-2xl overflow-hidden pointer-events-auto" style={{ backgroundColor: '#7c3aed', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
      {/* The pointer arrow */}
      {arrowStyle && <div style={arrowStyle} />}

      {/* Header / Content */}
      <div className="relative z-10 p-5 pb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{s.icon}</span>
            <h3 className="text-sm font-bold text-white leading-tight">{s.title}</h3>
          </div>
          <button onClick={onSkip} className="text-white/70 hover:text-white transition-colors" title="Close tutorial">
            <X size={14} />
          </button>
        </div>
        <p className="text-[13px] text-white/90 leading-snug">{s.desc}</p>

        {s.note && (
          <p className="text-[11px] text-white/70 mt-2 italic border-l-2 border-white/30 pl-2">
            Note: {s.note}
          </p>
        )}
      </div>

      {/* Footer / Controls */}
      <div className="relative z-10 px-5 py-3 flex items-center justify-between" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
        <span className="text-[11px] font-semibold text-white/80">
          Step {step + 1} of {totalSteps}
        </span>
        <div className="flex items-center gap-1">
          {!isFirst && (
            <button onClick={onPrev} className="h-7 px-2 rounded bg-white/10 hover:bg-white/20 text-white text-xs transition-colors">
              Back
            </button>
          )}
          <button onClick={onNext} className="h-7 px-3 rounded bg-white text-[#7c3aed] font-bold text-xs hover:bg-gray-100 transition-colors">
            {s.autoAdvance ? 'Next' : (isLast ? 'Finish' : 'Next')}
          </button>
        </div>
      </div>
    </div>
  );
}


function SideTab({ id, active, onClick, icon, title }: any) {
  return (
    <motion.button id={id} onClick={onClick} title={title}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25' : 'bg-white/3 text-gray-500 border border-white/6 hover:bg-white/6 hover:text-gray-300'}`}
      whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
      {icon}
    </motion.button>
  );
}

function ActionBtn({ id, icon, label, sub, onClick }: any) {
  return (
    <motion.button id={id} onClick={onClick}
      className="p-4 rounded-2xl bg-white/2 border border-white/6 hover:border-purple-500/25 hover:bg-purple-500/5 transition-all text-left"
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <div className="text-purple-400 mb-3">{icon}</div>
      <p className="text-xs font-semibold text-white/80">{label}</p>
      <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>
    </motion.button>
  );
}

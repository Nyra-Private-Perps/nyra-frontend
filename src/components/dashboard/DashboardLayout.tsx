"use client";
import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useAccount, useSignTypedData } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Shield, Plus, ChevronRight, X, Loader2, Check,
  ArrowUpRight, Link2, ArrowDownLeft, Layers,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Header from './Header';
import { onPendingRequest, resolveRequest, type PendingRequest } from '@/lib/walletController';

import {
  apiRegister, apiGenerateAddress, apiDeriveKey, apiStealthAddresses,
  getStoredEOA, getHLUserState, apiGetBalance, apiDeposit,
  apiWithdraw, apiBridge, apiGetBridgeStatus
} from '@/lib/api/hyperStealth';
import { disconnectAllSessions, getWeb3Wallet, prepareForPairing, setSessionProposalHandler } from '@/lib/walletController';
import { approveToken, switchChainNetwork } from '@/lib/walletHelpers';
import { getAddress, parseUnits } from 'viem';

type MainTab = 'BRIDGE' | 'PA';
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
}

export default function DashboardLayout({ onNavigate }: { onNavigate: (p: any) => void }) {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();

  const [activeTab, setActiveTab] = useState<MainTab>('BRIDGE');
  const [selectedProxy, setSelectedProxy] = useState<Proxy | null>(null);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverBalance, setServerBalance] = useState('0');
  const [txStatus, setTxStatus] = useState<TxStatus>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [amount, setAmount] = useState('10');
  const [wcUri, setWcUri] = useState('');
  const [destination, setDestination] = useState('');
  const [view, setView] = useState<TerminalView>('ACTIONS');
  const [txStep, setTxStep] = useState<TxStep>('signing');
  const [progress, setProgress] = useState(0);
  const [connectStep, setConnectStep] = useState<ConnectStep>('idle');
  const [pendingReq, setPendingReq] = useState<PendingRequest | null>(null);
  // tracks whether HL session is active (either via sign or direct connect)
  const [hlConnected, setHlConnected] = useState(false);
  const directConnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── KEY FIX: use a ref to track whether we already showed the signing view
  // to prevent the listener firing multiple times or racing with view state
  const signingHandledRef = useRef(false);

  const STEPS = [
    { id: 'signing', label: 'Authorize', desc: 'Sign secure permit' },
    { id: 'relaying', label: 'Relaying', desc: 'Submitting to sequencer' },
    { id: 'finalizing', label: 'Finalizing', desc: 'Confirming settlement' }
  ];

  const loadData = async () => {
    const eoa = getStoredEOA() || address;
    if (!eoa || !signTypedDataAsync) { setLoading(false); return; }
    try {
      const res = await apiStealthAddresses(eoa, signTypedDataAsync);
      const list = await Promise.all(res.stealthAddresses.map(async (s: any, i: number) => {
        let connected = false, balance = '0', pnl = '0';
        try {
          const state = await getHLUserState(s.address);
          if (state && state.marginSummary && Number(state.marginSummary.accountValue) > 0) {
            connected = true;
            balance = state.marginSummary.accountValue;
            pnl = state.marginSummary.unrealizedPnl;
          }
        } catch {}
        return { num: i + 1, address: s.address, connected, balance, pnl };
      }));
      console.log(list,"list")
      setProxies(list);
      const bal = await apiGetBalance(eoa);
      setServerBalance(bal.available);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    setProxies([]);
    setLoading(false);
    setSelectedProxy(null);
  }, [address]);

  // ── Signing request listener ──
  // WalletConnect event callbacks run outside React's synthetic event system.
  // React 18 batches ALL setState calls by default, including those from
  // external async sources — meaning setPendingReq + setView may be batched
  // and deferred until after handleConnect's own setState calls run,
  // causing handleConnect to overwrite SIGNING_REQUIRED.
  //
  // flushSync forces React to flush the DOM synchronously right now,
  // before returning from the callback — guaranteeing the UI shows
  // SIGNING_REQUIRED immediately, with no batching deferral possible.
  const signingActiveRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onPendingRequest((req: any) => {
      if (req) {
        // If walletController couldn't find keys, show error instead of sign modal
        if (req.missingKeys) {
          console.error("[Terminal] Missing stealth keys — cannot sign");
          flushSync(() => {
            setError("Stealth key not found. Please recreate this proxy.");
            setView('ACTIONS');
            setConnectStep('idle');
          });
          return;
        }
        console.log("[Terminal] ✓ Pending request received:", req.method);
        signingActiveRef.current = true;
        signingHandledRef.current = false;
        flushSync(() => {
          setPendingReq(req);
          setView('SIGNING_REQUIRED');
        });
      } else {
        if (!signingHandledRef.current) {
          signingActiveRef.current = false;
          flushSync(() => {
            setPendingReq(null);
          });
        }
      }
    });
    return () => unsubscribe();
  }, []); // safe with flushSync — no stale closure risk on refs

  const handleSwitchToPA = async () => {
    setActiveTab('PA');
    if (loading) return;
    setLoading(true);
    try {
      await loadData();
    } catch (err) {
      console.error("Authentication failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type: 'BRIDGE' | 'DEPOSIT' | 'CONNECT' | 'WITHDRAW') => {
    setTxStatus('PROCESSING');
    setError(null);
    try {
      if (type === 'BRIDGE') {
        const rawAmount = parseUnits(amount, 6).toString();
        await switchChainNetwork(26514);
        await approveToken("0xDF7108f8B10F9b9eC1aba01CCa057268cbf86B6c", "0xFB3fF1767A0a6c0d3b5fE61882B1460458372FCF", rawAmount);
        const res = await apiBridge(address!, rawAmount, signTypedDataAsync);
        let done = false;
        while (!done) {
          const s = await apiGetBridgeStatus(res.txHash);
          if (s.status === "DELIVERED") done = true;
          else if (s.status === "FAILED") throw new Error("Bridge failed");
          else await new Promise(r => setTimeout(r, 3000));
        }
      } else if (type === 'DEPOSIT' && selectedProxy) {
        await apiDeposit(address!, selectedProxy.address, serverBalance, signTypedDataAsync);
      } else if (type === 'WITHDRAW' && selectedProxy) {
        await apiWithdraw(address!, selectedProxy.address, destination, parseUnits(amount, 6).toString(), signTypedDataAsync);
      } else if (type === 'CONNECT' && selectedProxy) {
        const wc = await prepareForPairing();
        setSessionProposalHandler(async (p: any) => {
          await wc.approveSession({
            id: p.id,
            namespaces: { eip155: { accounts: [`eip155:42161:${getAddress(selectedProxy.address)}`], methods: ["eth_sendTransaction", "personal_sign", "eth_signTypedData_v4"], events: ["accountsChanged"], chains: ["eip155:42161"] } }
          });
        });
        await wc.core.pairing.pair({ uri: wcUri });
      }
      setTxStatus('SUCCESS');
      setTimeout(() => { setTxStatus('IDLE'); loadData(); }, 2000);
    } catch (e: any) { setError(e.message || "Failed"); setTxStatus('ERROR'); }
  };

  const handleConnect = async () => {
    if (!selectedProxy || !wcUri.startsWith('wc:')) {
      setError("Invalid WalletConnect URI");
      setView('ACTIONS');
      return;
    }

    // Reset the signing gate before starting a new connect flow
    signingActiveRef.current = false;

    // ── CRITICAL: Ensure stealth key is in storage for walletController ──
    // walletController.getStoredKeys() needs BOTH nyra_stealth_key AND
    // nyra_stealth_address to sign. Check if the stored key matches this proxy.
    const storedAddress = localStorage.getItem("nyra_active_stealth");
    const storedKey = localStorage.getItem("nyra_stealth_key");
    const keyMatchesProxy = storedAddress?.toLowerCase() === selectedProxy.address.toLowerCase();

    if (!keyMatchesProxy || !storedKey) {
      // Key is missing or belongs to a different proxy — must re-derive
      setConnectStep('pairing'); // show spinner while we re-derive
      try {
        console.log("[Terminal] Re-deriving key for proxy:", selectedProxy.address);
        const { stealthPrivateKey } = await apiDeriveKey(address!, selectedProxy.address, signTypedDataAsync);
        localStorage.setItem("nyra_active_stealth", selectedProxy.address);
        localStorage.setItem("nyra_stealth_key", stealthPrivateKey);
        sessionStorage.setItem("nyra_stealth_address", selectedProxy.address);
        sessionStorage.setItem("nyra_stealth_key", stealthPrivateKey);
        console.log("[Terminal] Key re-derived and saved ✓");
      } catch (e: any) {
        setError("Failed to load proxy key: " + e.message);
        setView('ACTIONS');
        return;
      }
    } else {
      // Key exists and matches — just ensure sessionStorage is synced
      sessionStorage.setItem("nyra_stealth_address", selectedProxy.address);
      sessionStorage.setItem("nyra_stealth_key", storedKey);
      console.log("[Terminal] Key already in storage for proxy ✓");
    }

    setView('CONNECT_STATUS');
    setConnectStep('pairing');
    setTxStatus('IDLE');
    setError(null);

    try {
      const wc = await prepareForPairing();

      setSessionProposalHandler(async (proposal: any) => {
        try {
          const signerAddress = getAddress(selectedProxy.address);
          const required = proposal.params.requiredNamespaces?.eip155 ?? {};
          const methods = required.methods?.length > 0 ? required.methods :
            ["eth_sendTransaction", "personal_sign", "eth_signTypedData_v4", "eth_sign", "eth_signTypedData"];

          // HL fires session_request during or immediately after approveSession.
          // The onPendingRequest listener may have ALREADY set view=SIGNING_REQUIRED
          // and signingActiveRef=true by the time this await resolves.
          await wc.approveSession({
            id: proposal.id,
            namespaces: {
              eip155: {
                accounts: [`eip155:42161:${signerAddress}`],
                methods,
                events: ["accountsChanged", "chainChanged"],
                chains: ["eip155:42161"],
              },
            },
          });

          // Two cases after approveSession resolves:
          // A) HL sends session_request immediately → signingActiveRef=true, listener
          //    has already set view=SIGNING_REQUIRED. Do nothing.
          // B) HL skips auth (already has active session / trusted device) →
          //    signingActiveRef=false. We are connected. Show ACTIONS + mark connected.
          if (signingActiveRef.current) {
            console.log("[Terminal] Signing request already active — listener owns the view.");
          } else {
            console.log("[Terminal] Handshake approved. Waiting briefly for HL auth request...");
            setConnectStep('approving');
            // Wait up to 2.5s for a session_request. If none arrives, HL skipped
            // auth entirely — we are already connected.
            await new Promise<void>((resolve) => {
              const timeout = setTimeout(() => resolve(), 2500);
              // If signing becomes active while waiting, resolve early
              const poll = setInterval(() => {
                if (signingActiveRef.current) { clearTimeout(timeout); clearInterval(poll); resolve(); }
              }, 100);
            });

            if (!signingActiveRef.current) {
              // No signing request came — HL connected directly without auth
              console.log("[Terminal] HL connected without auth request — session active ✓");
              setHlConnected(true);
              setProxies(prev => prev.map(p =>
                p.address === selectedProxy.address ? { ...p, connected: true } : p
              ));
              setSelectedProxy(prev => prev ? { ...prev, connected: true } : prev);
              setConnectStep('success');
              setTimeout(() => {
                setConnectStep('idle');
                setView('ACTIONS');
                setWcUri('');
              }, 1500);
            }
            // else: signing request arrived during the wait — listener owns the view
          }

        } catch (e: any) {
          throw new Error(e.message || "Session approval rejected");
        } finally {
          setSessionProposalHandler(null);
        }
      });

      await wc.core.pairing.pair({ uri: wcUri });

    } catch (err: any) {
      setSessionProposalHandler(null);
      setError(err.message || "Connection failed");
      setTxStatus('ERROR');
      setView('ACTIONS');
    }
  };

  const handleDepositFlow = async () => {
    if (!selectedProxy || !address) return;
    setView('DEPOSIT_STEPS');
    setError(null);
    try {
      setTxStep('signing');
      setProgress(20);
      await new Promise(r => setTimeout(r, 800));
      setTxStep('relaying');
      setProgress(60);
      const rawAmount = parseUnits(amount, 6).toString();
      await apiDeposit(address, selectedProxy.address, rawAmount, signTypedDataAsync);
      setTxStep('finalizing');
      setProgress(90);
      await new Promise(r => setTimeout(r, 1200));
      setTxStep('success');
      setProgress(100);
      setTimeout(() => { setView('ACTIONS'); loadData(); }, 2000);
    } catch (err: any) {
      setError(err.message || "Deposit failed");
      setTxStatus('ERROR');
    }
  };

  const handleWithdrawFlow = async () => {
    if (!selectedProxy || !address || !destination) return;
    setView('WITHDRAW_STEPS');
    setError(null);
    try {
      setTxStep('signing');
      setProgress(20);
      await new Promise(r => setTimeout(r, 800));
      setTxStep('relaying');
      setProgress(60);
      const rawAmount = parseUnits(amount, 6).toString();
      await apiWithdraw(address, selectedProxy.address, destination, rawAmount, signTypedDataAsync);
      setTxStep('finalizing');
      setProgress(90);
      await new Promise(r => setTimeout(r, 1200));
      setTxStep('success');
      setProgress(100);
      setTimeout(() => { setView('ACTIONS'); loadData(); }, 2500);
    } catch (err: any) {
      setError(err.message || "Withdraw failed");
      setTxStatus('ERROR');
    }
  };

  // ── FIXED: handleApproveSign ──
  // Previously: resolveRequest(true) → setTxStatus('SUCCESS') 
  // This caused the overlay HUD to appear AND fight with the view transition.
  // 
  // Fix: We NEVER use setTxStatus here. Instead we update the view directly
  // to a local "signed" success state inline within SIGNING_REQUIRED, then
  // clean up. The walletController does its signing in the background.
  const handleApproveSign = async () => {
    if (!pendingReq) return;
    
    signingHandledRef.current = true;
    signingActiveRef.current = false;
    // Cancel the direct-connect fallback timer — we got a real sign request
    if (directConnectTimerRef.current) clearTimeout(directConnectTimerRef.current);

    console.log("[Terminal] User approved signing for:", pendingReq.method);

    setPendingReq(null);
    setView('CONNECT_STATUS');
    setConnectStep('success');

    resolveRequest(true);

    setTimeout(() => {
      setConnectStep('idle');
      setHlConnected(true);
      // Mark proxy as connected in both list and selectedProxy
      setProxies(prev => prev.map(p =>
        p.address === selectedProxy?.address ? { ...p, connected: true } : p
      ));
      setSelectedProxy(prev => prev ? { ...prev, connected: true } : prev);
      setView('ACTIONS');
      loadData();
    }, 2200);
  };

  const handleRejectSign = () => {
    signingHandledRef.current = true;
    signingActiveRef.current = false;
    resolveRequest(false);
    setPendingReq(null);
    setView('ACTIONS');
    setConnectStep('idle');
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-white">
      <Header onNavigate={onNavigate} currentPage="dashboard" />

      <main className="flex items-center justify-center p-6 pt-32 min-h-screen">
        <motion.div
          layout
          className="bg-[#12141C] border border-white/5 rounded-[40px] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex"
          style={{ width: selectedProxy ? '900px' : '500px' }}
        >
          {/* 1. SIDE DOCK */}
          <div className="w-[84px] shrink-0 border-r border-white/5 py-8 flex flex-col items-center gap-6 bg-black/10">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
              <Shield className="text-indigo-400" size={20} />
            </div>
            <div className="flex flex-col gap-2 relative">
              <NavTab active={activeTab === 'BRIDGE'} onClick={() => { setActiveTab('BRIDGE'); setSelectedProxy(null); }} icon={<Zap size={20} />} label="Bridge" />
              <NavTab active={activeTab === 'PA'} onClick={() => { setActiveTab('PA'); handleSwitchToPA(); }} icon={<Layers size={20} />} label="PA" />
            </div>
          </div>

          {/* 2. EXPLORER */}
          <div className="flex-1 p-10 flex flex-col">
            <AnimatePresence mode="wait">
              {activeTab === 'BRIDGE' ? (
                <motion.div key="bridge" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Funding</h2>
                    <p className="text-[10px] text-white/30 font-mono tracking-widest uppercase">Protocol: Stargate V2 Cross-Chain</p>
                  </div>
                  <div className="bg-black/30 p-8 rounded-[32px] border border-white/5 space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Deposit Amount</label>
                      <Input value={amount} onChange={e => setAmount(e.target.value)} className="h-14 bg-transparent border-none text-3xl font-bold p-0 focus-visible:ring-0" />
                    </div>
                    <Button onClick={() => handleAction('BRIDGE')} className="w-full h-16 rounded-[24px] bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-neutral-200 transition-all">
                      Bridge Liquidity
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="pa" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Registry</h2>
                    <button
                      onClick={async () => {
                        if (!address || !signTypedDataAsync) return;
                        setCreating(true);
                        try {
                          // Full proxy creation flow — all 3 steps required to save the key
                          await apiRegister(address, signTypedDataAsync);
                          const { stealthAddress } = await apiGenerateAddress(address);
                          const { stealthPrivateKey } = await apiDeriveKey(address, stealthAddress, signTypedDataAsync);
                          // Save key + address — walletController NEEDS these to sign
                          localStorage.setItem("nyra_eoa", address);
                          localStorage.setItem("nyra_active_stealth", stealthAddress);
                          localStorage.setItem("nyra_stealth_key", stealthPrivateKey);
                          sessionStorage.setItem("nyra_stealth_address", stealthAddress);
                          sessionStorage.setItem("nyra_stealth_key", stealthPrivateKey);
                          console.log("[Nyra] Proxy created + key saved:", stealthAddress);
                        } catch (e) {
                          console.error("[Nyra] Create failed:", e);
                        } finally {
                          await loadData();
                          setCreating(false);
                        }
                      }}
                      className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10"
                    >
                      {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                    </button>
                  </div>
                  <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                    {proxies.map((p) => (
                      <div
                        key={p.address}
                        onClick={() => { setSelectedProxy(p); setView('ACTIONS'); }}
                        className={`p-6 rounded-[32px] border cursor-pointer transition-all flex items-center justify-between group ${
                          selectedProxy?.address === p.address ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-black/20 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${selectedProxy?.address === p.address ? 'bg-indigo-500' : 'bg-white/5 text-white/20'}`}>
                            {p.num}
                          </div>
                          <div>
                            <div className="font-mono text-sm opacity-60">{p.address.slice(0, 10)}...</div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className={`w-1 h-1 rounded-full ${p.connected ? 'bg-emerald-400' : 'bg-white/10'}`} />
                              <span className="text-[10px] font-bold text-white/20 uppercase">{p.connected ? 'L1 ACTIVE' : 'INACTIVE'}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className={`transition-transform ${selectedProxy?.address === p.address ? 'text-indigo-400 translate-x-1' : 'opacity-10 group-hover:opacity-100'}`} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. TERMINAL PANE */}
          <AnimatePresence>
            {selectedProxy && (
              <motion.div
                initial={{ width: 0, opacity: 0 }} animate={{ width: 400, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                className="bg-[#0D0E14] border-l border-white/5 flex flex-col p-10 relative overflow-hidden"
              >
                {/* Terminal Header */}
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-1">Terminal_Output</h3>
                    <p className="font-mono text-[9px] opacity-20 truncate w-[200px]">{selectedProxy.address}</p>
                  </div>
                  <button onClick={() => { setSelectedProxy(null); setView('ACTIONS'); }} className="p-2 hover:bg-white/5 rounded-full">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-8 flex-1">
                  <AnimatePresence mode="wait">

                    {/* ACTIONS */}
                    {view === 'ACTIONS' && (
                      <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">

                        {/* Balance card — always visible */}
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-white/10 uppercase tracking-[0.2em]">Net Assets</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${selectedProxy.connected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/20 border border-white/10'}`}>
                              {selectedProxy.connected ? '● SYNCED' : '○ STANDBY'}
                            </span>
                          </div>
                          <div className="text-4xl font-black">${Number(selectedProxy.balance).toLocaleString()}</div>
                          <div className={`text-[10px] font-bold ${Number(selectedProxy.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{selectedProxy.pnl} PNL</div>
                        </div>

                        {selectedProxy.connected ? (
                          /* ── CONNECTED STATE: show full action grid ── */
                          <motion.div
                            key="connected-actions"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-5"
                          >
                            {/* Active session banner */}
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider flex-1">Session Active — Trading Enabled</p>
                            </div>

                            {/* Deposit + Withdraw */}
                            <div className="grid grid-cols-2 gap-3">
                              <ActionButton icon={<ArrowDownLeft />} label="Deposit" sub="Fund account" onClick={() => setView('DEPOSIT_INPUT')} />
                              <ActionButton icon={<ArrowUpRight />} label="Withdraw" sub="Extract funds" onClick={() => setView('WITHDRAW_INPUT')} />
                            </div>

                            {/* Re-pair option */}
                            <div className="pt-4 border-t border-white/5">
                              <div className="space-y-2">
                                <Input
                                  value={wcUri}
                                  onChange={e => setWcUri(e.target.value)}
                                  placeholder="wc:... (re-pair session)"
                                  className="bg-white/5 border-white/10 h-10 rounded-xl font-mono text-[10px]"
                                />
                                <button
                                  onClick={() => handleConnect()}
                                  disabled={!wcUri.startsWith('wc:')}
                                  className="w-full h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-20 transition-all text-white/30 hover:text-white/60 border border-white/5 hover:border-white/10"
                                >
                                  Re-pair Session
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          /* ── DISCONNECTED STATE: connect is the primary CTA ── */
                          <motion.div
                            key="disconnected-actions"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-5"
                          >
                            {/* Deposit/Withdraw available even without HL session */}
                            <div className="grid grid-cols-2 gap-3">
                              <ActionButton icon={<ArrowDownLeft />} label="Deposit" sub="From server" onClick={() => setView('DEPOSIT_INPUT')} />
                              <ActionButton icon={<ArrowUpRight />} label="Withdraw" sub="Extract funds" onClick={() => setView('WITHDRAW_INPUT')} />
                            </div>

                            <div className="pt-4 border-t border-white/5 space-y-3">
                              <div className="flex justify-between px-1">
                                <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">Connect Hyperliquid</span>
                              </div>
                              <Input
                                value={wcUri}
                                onChange={e => setWcUri(e.target.value)}
                                placeholder="wc:abc... (paste from Hyperliquid)"
                                className="bg-white/5 border-white/10 h-12 rounded-2xl font-mono text-[11px]"
                              />
                              <Button
                                onClick={() => handleConnect()}
                                disabled={!wcUri.startsWith('wc:')}
                                className="w-full h-14 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white font-bold uppercase text-[10px] tracking-widest rounded-2xl"
                              >
                                Connect to HL
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* DEPOSIT INPUT */}
                    {view === 'DEPOSIT_INPUT' && (
                      <motion.div key="dep_in" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 pt-4">
                        <div className="text-center mb-6"><h3 className="text-lg font-bold italic uppercase">Deposit Funds</h3></div>
                        <div className="p-8 bg-black/40 border border-white/5 rounded-3xl space-y-4">
                          <div className="text-[10px] text-indigo-400 font-black uppercase">Amount</div>
                          <Input value={amount} onChange={e => setAmount(e.target.value)} className="h-10 bg-transparent border-none text-2xl font-bold p-0 focus-visible:ring-0" />
                          <div className="text-[10px] text-white/20 font-mono">Available on Server: ${(Number(serverBalance) / 1e6).toFixed(2)}</div>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="ghost" onClick={() => setView('ACTIONS')} className="flex-1 rounded-2xl h-14">Back</Button>
                          <Button onClick={handleDepositFlow} className="flex-1 bg-indigo-500 rounded-2xl h-14 font-black uppercase text-[10px]">Settle Now</Button>
                        </div>
                      </motion.div>
                    )}

                    {/* WITHDRAW INPUT */}
                    {view === 'WITHDRAW_INPUT' && (
                      <motion.div key="with_in" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 pt-4">
                        <div className="text-center mb-6"><h3 className="text-lg font-bold italic uppercase tracking-tighter">Extract Assets</h3></div>
                        <div className="space-y-4">
                          <div className="p-5 bg-black/40 border border-white/5 rounded-2xl">
                            <label className="text-[9px] text-white/30 uppercase font-black mb-2 block">Destination Address</label>
                            <Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="0x..." className="bg-transparent border-none p-0 h-8 font-mono text-sm focus-visible:ring-0" />
                          </div>
                          <div className="p-5 bg-black/40 border border-white/5 rounded-2xl">
                            <label className="text-[9px] text-white/30 uppercase font-black mb-2 block">Amount to Withdraw</label>
                            <Input value={amount} onChange={e => setAmount(e.target.value)} className="bg-transparent border-none p-0 h-8 font-bold text-xl focus-visible:ring-0" />
                          </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <Button variant="ghost" onClick={() => setView('ACTIONS')} className="flex-1 rounded-2xl h-14">Cancel</Button>
                          <Button onClick={handleWithdrawFlow} className="flex-1 bg-indigo-500 rounded-2xl h-14 font-black uppercase text-[10px]">Withdraw</Button>
                        </div>
                      </motion.div>
                    )}

                    {/* DEPOSIT / WITHDRAW STEPS */}
                    {(view === 'DEPOSIT_STEPS' || view === 'WITHDRAW_STEPS') && (
                      <motion.div key="steps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pt-6 text-center">
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" animate={{ width: `${progress}%` }} />
                        </div>
                        <div className="space-y-4">
                          {STEPS.map((s, i) => {
                            const isCurrent = txStep === s.id;
                            const isDone = progress > (i + 1) * 30 || txStep === 'success';
                            return (
                              <div key={s.id} className={`flex items-center gap-4 p-5 rounded-3xl border transition-all ${isCurrent ? 'bg-indigo-500/10 border-indigo-500/20' : 'opacity-30 border-transparent'}`}>
                                <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center ${isDone ? 'bg-emerald-500 border-emerald-500' : isCurrent ? 'border-indigo-500 text-indigo-400' : 'border-white/10'}`}>
                                  {isDone ? <Check size={18} className="text-black" /> : <span className="text-xs font-bold">{i + 1}</span>}
                                </div>
                                <div className="text-left flex-1">
                                  <div className={`text-xs font-black uppercase tracking-widest ${isCurrent ? 'text-white' : 'text-white/20'}`}>{s.label}</div>
                                  <div className="text-[10px] font-mono text-white/20 mt-1">{s.desc}</div>
                                </div>
                                {isCurrent && <Loader2 className="animate-spin text-indigo-400" size={16} />}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* CONNECT STATUS */}
                    {view === 'CONNECT_STATUS' && (
                      <motion.div key="conn_steps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-10 space-y-8 text-center">
                        <div className="relative w-20 h-20 mx-auto">
                          {connectStep === 'success' ? (
                            <div className="w-full h-full bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                              <Check size={32} className="text-emerald-400" />
                            </div>
                          ) : (
                            <>
                              <Loader2 className="w-full h-full text-indigo-400 animate-spin opacity-20" size={80} />
                              <Link2 className="absolute inset-0 m-auto text-indigo-400 animate-pulse" size={24} />
                            </>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-[0.3em] italic">
                            {connectStep === 'pairing' ? 'Pairing Node' :
                              connectStep === 'approving' ? 'Awaiting HL Auth' :
                              connectStep === 'success' ? 'Identity Secured' : 'Connecting...'}
                          </h4>
                          <p className="text-[10px] text-white/20 font-mono mt-2 uppercase px-10">
                            {connectStep === 'pairing' ? 'Establishing P2P Relay...' :
                              connectStep === 'approving' ? 'Hyperliquid is requesting authentication...' :
                              connectStep === 'success' ? 'Handshake complete. Session active.' :
                              'Please wait...'}
                          </p>
                        </div>
                        {connectStep === 'approving' && (
                          <div className="flex items-center justify-center gap-2 font-mono text-[9px] text-indigo-400 animate-pulse uppercase tracking-[2px] pt-4">
                            <span className="w-1 h-1 bg-indigo-400 rounded-full" />
                            Waiting for authentication request...
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* ── SIGNING REQUIRED ── */}
                    {view === 'SIGNING_REQUIRED' && pendingReq && (
                      <motion.div
                        key="sign_req"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-8 pt-4"
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                            <Shield className="text-amber-500" size={28} />
                          </div>
                          <h3 className="text-lg font-black italic uppercase tracking-tighter">Identity Authentication</h3>
                          <p className="text-[10px] text-white/30 font-mono mt-2 px-8 uppercase leading-relaxed">
                            Hyperliquid requires a signature to initialise your private identity.
                          </p>
                        </div>

                        <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[32px] space-y-4">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[9px] font-black uppercase text-white/20 tracking-widest">Protocol Action</span>
                            <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-500 font-mono">
                              {pendingReq.params.request.method}
                            </Badge>
                          </div>
                          <div className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-[9px] text-white/30 leading-relaxed">
                            AUTHENTICATE_SESSION_STEALTH_V2:ENABLE_TRADING
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          {/* 
                            FIXED: onClick now calls handleApproveSign() instead of 
                            inline logic. handleApproveSign() does:
                            1. Marks the ref so the null-broadcast from resolveRequest doesn't re-trigger
                            2. Clears pendingReq + transitions to success view FIRST (instant visual feedback)
                            3. Then calls resolveRequest(true) to unblock walletController
                            This eliminates the "stuck on awaiting sign" issue entirely.
                          */}
                          <Button
                            onClick={handleApproveSign}
                            className="h-16 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-[0.2em] rounded-[24px]"
                          >
                            Confirm & Sign
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={handleRejectSign}
                            className="text-[10px] text-white/20 uppercase font-black"
                          >
                            Reject Request
                          </Button>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

                {/* ERROR/PROCESSING HUD overlay — only for bridge/deposit/withdraw, NOT for connect flow */}
                <AnimatePresence>
                  {txStatus !== 'IDLE' && view !== 'SIGNING_REQUIRED' && view !== 'CONNECT_STATUS' && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-[#0D0E14]/95 z-[60] flex flex-col items-center justify-center p-12 text-center"
                    >
                      {txStatus === 'PROCESSING' ? (
                        <div className="space-y-4">
                          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Syncing Ledger...</p>
                        </div>
                      ) : txStatus === 'SUCCESS' ? (
                        <div className="space-y-4">
                          <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                            <Check className="text-emerald-400" />
                          </div>
                          <h4 className="text-xs font-black uppercase tracking-widest">Protocol Sync Complete</h4>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <AlertCircle className="text-red-500 mx-auto" />
                          <p className="text-[10px] text-red-400 font-mono px-4 leading-relaxed">{error}</p>
                          <Button onClick={() => { setTxStatus('IDLE'); setView('ACTIONS'); }} variant="ghost" className="text-[10px] font-bold uppercase text-white/20 mt-4">
                            Close Terminal
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}

function NavTab({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-12 h-12 flex flex-col items-center justify-center transition-all ${active ? 'text-indigo-400' : 'text-white/20 hover:text-white/40'}`}
    >
      {icon}
      <span className="text-[7px] font-black uppercase tracking-widest mt-1">{label}</span>
      {active && (
        <motion.div layoutId="nav-pill" className="absolute -left-8 w-1 h-8 bg-indigo-500 rounded-r-full" />
      )}
    </button>
  );
}

function ActionButton({ icon, label, sub, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all text-left"
    >
      <div className="text-indigo-400 mb-4">{icon}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest mb-1">{label}</div>
      <div className="text-[8px] font-mono opacity-20 uppercase">{sub}</div>
    </button>
  );
}

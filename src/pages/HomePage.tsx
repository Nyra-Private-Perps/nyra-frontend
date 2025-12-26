import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Play, Eye, Link as LinkIcon, Activity, Wallet, Layers, Fingerprint, CandlestickChart, ShieldCheck, Ban, CheckCircle2, Zap,Users, Landmark,  Cpu } from "lucide-react";
import { Header } from "../components/Header/Header";
import Lenis from "lenis";
import EliteFooter from "../components/UI/Footer";

const DEX_NODES = [
  { name: 'Hyperliquid', logo: '/hyperliquid.png' },
  { name: 'dYdX', logo: '/dydx.png' },
  { name: 'Vertex', logo: '/vertex.png' },
  { name: 'GMX', logo: '/gmx.png' },
  { name: 'Apex', logo: '/apex.png' },
  { name: 'Aevo', logo: '/aevo.png' }
];

const USER_NODES = [
  { name: 'Retail', icon: <Users size={20} /> },
  { name: 'Institutions', icon: <Landmark size={20} /> },
  { name: 'Market Makers', icon: <Zap size={20} /> },
  { name: 'DAOs', icon: <Shield size={20} /> },
  { name: 'Arbitrageurs', icon: <Activity size={20} /> },
  { name: 'Protocols', icon: <Cpu size={20} /> }
];

// --- 1. UTILITY: PREMIUM SMOOTH REVEAL ---
const SmoothReveal = ({ children, delay = 0, x = 0, y = 30 }: any) => (
  <motion.div
    initial={{ opacity: 0, y, filter: "blur(10px)", scale: 0.98 }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
  >
    {children}
  </motion.div>
);

// --- 2. SUB-COMPONENTS ---
function TransactionLeak({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      transition={{ delay }}
      className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-sm hover:bg-white transition-colors"
    >
      <div className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </div>
      <span className="font-mono text-sm text-gray-500 font-medium">{label}</span>
    </motion.div>
  );
}

const PrivacyArchGraphic = () => (
  <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
    {/* Stacked Cards Visualization */}
    <div className="relative w-48 h-48 perspective-[1000px]">
      {/* Bottom Card */}
      <motion.div 
        animate={{ y: [0, -5, 0], rotateX: [60, 58, 60], rotateZ: [45, 47, 45] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-gray-900/40 rounded-3xl border border-white/10 translate-y-12"
      />
      {/* Middle Card (Purple) */}
      <motion.div 
        animate={{ y: [0, -10, 0], rotateX: [60, 58, 60], rotateZ: [45, 47, 45] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute inset-0 bg-indigo-600 rounded-3xl border border-white/20 translate-y-6 shadow-xl"
      />
      {/* Top Card (White/Interface) */}
      <motion.div 
        animate={{ y: [0, -15, 0], rotateX: [60, 58, 60], rotateZ: [45, 47, 45] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute inset-0 bg-white/90 backdrop-blur-xl rounded-3xl border border-white p-4 shadow-2xl flex flex-col gap-2"
      >
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div animate={{ width: ["20%", "80%", "20%"] }} transition={{ duration: 4, repeat: Infinity }} className="h-full bg-indigo-500" />
        </div>
        <div className="w-2/3 h-1.5 bg-gray-100 rounded-full" />
        <div className="w-full h-1.5 bg-green-500/20 rounded-full" />
      </motion.div>
    </div>
  </div>
);

const AnonWithdrawalGraphic = () => (
  <div className="relative w-full h-32 flex items-center justify-center">
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="w-24 h-24 border border-dashed border-white/10 rounded-full" />
      <motion.div animate={{ rotate: -360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-2 border-indigo-500/40 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
        <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
      </motion.div>
    </div>
    <div className="absolute w-full h-full">
      <motion.div animate={{ scale: [0, 1.5, 0], opacity: [0, 0.5, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-sm" />
    </div>
  </div>
);

const CrossChainGraphic = () => (
  <div className="w-32 h-32 relative flex items-center justify-center">
    <div className="absolute inset-0 border border-gray-100 rounded-full" />
    <motion.div 
      animate={{ rotate: 360 }} 
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }} 
      className="absolute inset-[-8px]"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-600 rounded-full shadow-lg" />
    </motion.div>
    <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-xl font-serif font-bold text-xl">Ny</div>
  </div>
);

// --- 2. SECTION 3 GRAPHICS (Animated) ---

const Step1Graphic = () => (
  <div className="relative w-full h-full flex items-center justify-center bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(91,33,182,0.15)_0%,_transparent_70%)]" />
    <div className="flex items-center gap-6 z-10">
      <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="p-3 bg-white/5 rounded-xl border border-white/10">
        <Wallet size={24} className="text-gray-400" />
      </motion.div>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }} className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        ))}
      </div>
      <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
        <Layers size={24} className="text-indigo-400" />
      </motion.div>
    </div>
  </div>
);

const Step2Graphic = () => (
  <div className="relative w-full h-full flex items-center justify-center bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute w-32 h-32 border border-dashed border-indigo-500/20 rounded-full" />
    <div className="relative flex flex-col items-center gap-2">
      <motion.div animate={{ filter: ["drop-shadow(0 0 2px #6366f1)", "drop-shadow(0 0 15px #6366f1)", "drop-shadow(0 0 2px #6366f1)"] }} transition={{ duration: 3, repeat: Infinity }}>
        <Fingerprint size={48} strokeWidth={1} className="text-white" />
      </motion.div>
      <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[9px] font-mono text-emerald-400 tracking-tighter uppercase">ZK-SNARK Generated</div>
      <motion.div animate={{ top: ["20%", "70%", "20%"] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute left-0 right-0 h-[1px] bg-indigo-400/50 shadow-[0_0_10px_#818cf8] z-20" />
    </div>
  </div>
);

const Step3Graphic = () => (
  <div className="relative w-full h-full flex items-center justify-center bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
    <div className="flex items-center gap-6 z-10">
       <div className="p-3 bg-white/5 rounded-full border border-white/10"><ShieldCheck size={24} className="text-gray-500" /></div>
       <motion.div animate={{ x: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }}><ArrowRight size={24} className="text-white/20" /></motion.div>
       <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
          <CandlestickChart size={24} className="text-blue-400" />
       </motion.div>
    </div>
    <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 200, opacity: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute h-[1px] w-20 bg-gradient-to-r from-transparent via-indigo-500 to-transparent top-1/2" />
  </div>
);



export default function HomePage() {
  const problemRef = useRef(null);
  const [time, setTime] = useState(0);
  const requestRef = useRef<number>();

  const width = 1000;
  const height = 800;
  const centerX = width / 2;
  const centerY = height / 2;

  useEffect(() => {
    const animate = (t: number) => {
      setTime(t);
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  const getBezierXY = (t: number, p: any) => {
    const mt = 1 - t;
    const x = mt * mt * p.startX + 2 * mt * t * p.cpX + t * t * p.endX;
    const y = mt * mt * p.startY + 2 * mt * t * p.cpY + t * t * p.endY;
    return { x, y };
  };

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.4 });
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-indigo-100 overflow-x-hidden">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-indigo-600 origin-left z-[110]" style={{ scaleX }} />
      
      <Header />

      {/* --- SECTION 1: HERO (UNTOUCHED AS REQUESTED) --- */}
      <section className="relative min-h-screen w-full flex items-center justify-center pt-44 overflow-hidden">
  {/* 1. Background Layer (Relative to the whole section) */}
  <div className="absolute inset-0 z-0">
    <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-70">
      <source src="/ripple.mp4" type="video/mp4" />
    </video>
    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white" />
  </div>

  {/* 
     2. THE ANCHOR CONTAINER: 
     Everything inside here stays locked together during zoom.
  */}
  <div className="relative z-10 max-w-7xl mx-auto w-full px-6 h-full flex flex-col items-center">
    
    {/* --- Verified Card (Anchored to content box right) --- */}
    <motion.div
      initial={{ opacity: 0, x: 70, rotate: 12 }}
      animate={{ opacity: 1, x: 0, rotate: 12 }}
      transition={{ type: "spring", stiffness: 40, delay: 0.7 }}
      className="absolute top-0 right-0 lg:right-[8%] z-20 hidden md:block pointer-events-auto"
    >
      <div className="bg-white/80 backdrop-blur-2xl border border-white p-6 rounded-[2.5rem] shadow-2xl w-56 transform hover:rotate-0 transition-all duration-700">
        <div className="flex justify-between items-start mb-3">
          <div className="bg-emerald-50 p-2 rounded-xl text-emerald-500"><Shield size={22} /></div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ZK-SNARK</span>
        </div>
        <div className="text-2xl font-serif text-gray-900 mt-2 tracking-tight">Verified</div>
        <div className="w-full bg-gray-100 h-1.5 mt-5 rounded-full overflow-hidden">
          <div className="h-full w-[94%] bg-emerald-500 shadow-[0_0_10px_#10b981]" />
        </div>
      </div>
    </motion.div>

    {/* --- Anon Trader Card (Anchored to content box left) --- */}
    <motion.div
      initial={{ opacity: 0, x: -80, rotate: -8 }}
      animate={{ opacity: 1, x: 0, rotate: -8 }}
      transition={{ type: "spring", stiffness: 40, delay: 0.9 }}
      className="absolute bottom-[20%] left-0 lg:left-[4%] z-20 hidden md:block pointer-events-auto"
    >
      <div className="bg-white/80 backdrop-blur-2xl border border-white p-6 rounded-[2.5rem] shadow-2xl w-64 transform hover:rotate-0 transition-all duration-700 text-left">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-xl shadow-inner">👤</div>
          <div>
            <div className="text-sm font-bold text-gray-900 font-sans">Anon Trader</div>
            <div className="text-[10px] text-gray-400 font-mono tracking-tighter">0x...8a92</div>
          </div>
        </div>
        <div className="flex justify-between items-end border-t border-gray-50 pt-4">
          <div className="text-[11px] text-gray-400 uppercase font-bold tracking-widest font-sans">PnL (24h)</div>
          <div className="text-2xl font-bold text-emerald-500 tracking-tighter">+42.8%</div>
        </div>
      </div>
    </motion.div>

    {/* 3. CENTER TEXT CONTENT */}
    <div className="relative text-center pointer-events-none">
      <SmoothReveal delay={0.1}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-indigo-100 shadow-sm mb-10 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 font-sans uppercase">V2 Protocol Live</span>
        </div>
      </SmoothReveal>

      <SmoothReveal delay={0.2}>
        <h1 className="text-[4.5rem] md:text-[8.5rem] font-bold leading-[0.82] tracking-tighter text-[#111827] mb-10">
          Sophisticated <br />
          <span className="relative inline-block px-12 pb-4 pointer-events-auto"> 
            <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-[#1E1B4B] via-[#4F46E5] to-[#818CF8]">
              Strategies.
            </span>
            <span className="absolute -top-4 -right-2 text-indigo-300 text-5xl">✦</span>
          </span> <br />
          Zero Footprint.
        </h1>
      </SmoothReveal>

      <SmoothReveal delay={0.3}>
        <p className="text-lg md:text-2xl text-gray-500 max-w-3xl mx-auto mb-14 font-light leading-relaxed">
          Access institutional-grade perpetual strategies while <br className="hidden md:block" /> 
          severing the on-chain link between you and your trades.
        </p>
      </SmoothReveal>

      <SmoothReveal delay={0.4}>
        <div className="flex justify-center gap-6 pointer-events-auto">
          <Link to="/vaults" className="h-16 px-12 rounded-full bg-black text-white text-lg font-bold flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-xl hover:scale-[1.02]">
            Launch App <ArrowRight size={20} className="-rotate-45" />
          </Link>
          <button className="h-16 w-16 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-sm text-indigo-600 hover:scale-110 transition-transform">
            <Play fill="currentColor" size={24} className="ml-1" />
          </button>
        </div>
      </SmoothReveal>
    </div>
  </div>
</section>

      {/* --- SECTION 2: THE PROBLEM (REFINED) --- */}
      <section className="relative py-48 bg-white overflow-hidden" ref={problemRef}>
  {/* Smooth transition gradient from Hero */}
  <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#F9FAFF] to-white pointer-events-none" />

  <div className="max-w-[1400px] mx-auto px-6 relative z-10">
    <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">
      
      {/* Left Side Sticky */}
      <div className="w-full lg:w-1/2 lg:sticky lg:top-40">
        <SmoothReveal delay={0.1}>
          <span className="text-indigo-600 font-sans font-bold text-xs tracking-[0.3em] uppercase mb-6 block flex items-center gap-2">
            <Activity size={14} /> The Problem
          </span>
          <h2 className="text-6xl md:text-7xl lg:text-[7.5rem] font-sans font-medium text-[#111827] leading-[0.82] tracking-tighter mb-10 max-w-[85%]">
            Transparency <br />
            is a <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 via-indigo-500 to-purple-400 pr-4">trap.</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-500 font-light leading-relaxed max-w-md">
            Every trade on a public ledger creates a permanent footprint. Competitors analyze your history and front-run your execution.
          </p>
        </SmoothReveal>
      </div>

      {/* Right Side Cards */}
      <div className="w-full lg:w-1/2 flex flex-col gap-10 pt-10">
        
        {/* 
           Interactive Card 1: 
           Removed the heavy translate-x-32 so it stays inside the screen.
           Added a very small offset (lg:translate-x-4) for design flair.
        */}
        <SmoothReveal delay={0.3}>
          <motion.div 
            whileHover={{ x: -15, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="group relative bg-[#F3F4F6] rounded-[3.5rem] p-10 lg:p-12 overflow-hidden shadow-sm hover:shadow-2xl lg:translate-x-4 cursor-pointer"
          >
            <div className="absolute top-8 right-10 opacity-5 group-hover:opacity-20 transition-opacity">
              <Eye size={180} className="rotate-12" />
            </div>
            <div className="relative z-10 max-w-sm">
              <h3 className="text-4xl font-serif text-[#111827] mb-6">Exposed Alpha</h3>
              <p className="text-lg text-gray-500 leading-relaxed">
                Public ledgers reveal your winning strategies instantly. Alpha decay accelerates with every block confirmation.
              </p>
            </div>
            <div className="mt-12 h-40 bg-white/50 rounded-3xl border border-gray-100 backdrop-blur-sm flex items-center justify-center">
               <div className="flex gap-6">
                  {[1, 2, 3].map(i => (
                    <motion.div 
                      key={i} 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} 
                      transition={{ repeat: Infinity, duration: 2, delay: i*0.4 }} 
                      className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)]" 
                    />
                  ))}
               </div>
            </div>
          </motion.div>
        </SmoothReveal>

        {/* 
           Card 2: 
           Shifted slightly more than Card 1 (lg:translate-x-16) 
           to create the staggered layout seen in the design.
        */}
        <SmoothReveal delay={0.5}>
          <motion.div 
            whileHover={{ x: -15, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="group relative bg-[#F3F4F6] rounded-[3.5rem] p-10 lg:p-12 overflow-hidden shadow-sm hover:shadow-2xl lg:translate-x-16 cursor-pointer"
          >
            <div className="absolute top-8 right-10 opacity-5 group-hover:opacity-20 transition-opacity">
              <LinkIcon size={180} className="rotate-12" />
            </div>
            <div className="relative z-10 max-w-sm">
              <h3 className="text-4xl font-serif text-[#111827] mb-6">Wallet Linking</h3>
              <p className="text-lg text-gray-500 leading-relaxed">
                Your main wallet is your identity. Once linked to a strategy, your entire portfolio becomes public knowledge.
              </p>
            </div>
            <div className="mt-12 space-y-4">
              <TransactionLeak label="0x71C...9e21 -> Uniswap" delay={0.6} />
              <TransactionLeak label="0x71C...9e21 -> GMX" delay={0.8} />
            </div>
          </motion.div>
        </SmoothReveal>

      </div>
    </div>
  </div>
</section>

      {/* --- SECTION 3: THE SHIELD (NEW INTEGRATION) --- */}
      <section className="relative py-40 bg-[#0F0F0F] text-white overflow-hidden -mt-24" style={{ clipPath: 'polygon(0 10%, 100% 0, 100% 100%, 0 100%)' }}>
        {/* Ambient Lighting */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 relative z-20">
          <div className="text-center max-w-4xl mx-auto mb-24">
            <SmoothReveal><span className="text-indigo-400 font-sans font-bold text-xs tracking-[0.4em] uppercase mb-8 block">The Solution</span><h2 className="text-7xl md:text-8xl lg:text-[8rem] font-sans font-medium leading-[0.9] tracking-tighter mb-10">The Nyra <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-white pr-4">Shield.</span></h2><p className="text-xl md:text-2xl text-gray-400 font-light leading-relaxed max-w-3xl mx-auto">A fortified privacy tunnel. Your funds enter, are cryptographically detached from your identity, and executed via decentralized relayers.</p></SmoothReveal>
          </div>

          <div className="relative w-full rounded-[3.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-md p-8 md:p-14 overflow-hidden shadow-inner">
             {/* Blueprint Grid Pattern */}
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 40L40 0L0 0L0 40ZM39 39L1 39L1 1L39 1L39 39Z'/%3E%3C/g%3E%3C/svg%3E")` }} />
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                {/* Step 1 */}
                <SmoothReveal delay={0.2}>
                  <div className="group flex flex-col p-8 rounded-[2.5rem] bg-[#161616] border border-white/5 hover:border-indigo-500/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl relative">
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white border-4 border-[#0F0F0F] z-30">1</div>
                    <div className="h-48 mb-8 relative"><Step1Graphic /></div>
                    <h3 className="text-2xl font-serif text-white mb-4 group-hover:text-indigo-300 transition-colors">Batched Deposits</h3>
                    <p className="text-sm text-gray-400 leading-relaxed font-light">Funds are aggregated into a smart contract queue. Your deposit is indistinguishable from hundreds of others in the same block.</p>
                  </div>
                </SmoothReveal>

                {/* Step 2 */}
                <SmoothReveal delay={0.4}>
                  <div className="group flex flex-col p-8 rounded-[2.5rem] bg-[#161616] border border-white/5 hover:border-indigo-500/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl relative">
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white border-4 border-[#0F0F0F] z-30">2</div>
                    <div className="h-48 mb-8 relative"><Step2Graphic /></div>
                    <h3 className="text-2xl font-serif text-white mb-4 group-hover:text-indigo-300 transition-colors">Zero-Knowledge Proofs</h3>
                    <p className="text-sm text-gray-400 leading-relaxed font-light">A cryptographic proof of solvency is generated off-chain. This proof verifies you have funds without revealing which funds are yours.</p>
                  </div>
                </SmoothReveal>

                {/* Step 3 */}
                <SmoothReveal delay={0.6}>
                  <div className="group flex flex-col p-8 rounded-[2.5rem] bg-[#161616] border border-white/5 hover:border-indigo-500/30 transition-all duration-500 hover:-translate-y-2 shadow-2xl relative">
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white border-4 border-[#0F0F0F] z-30">3</div>
                    <div className="h-48 mb-8 relative"><Step3Graphic /></div>
                    <h3 className="text-2xl font-serif text-white mb-4 group-hover:text-indigo-300 transition-colors">Relayer Execution</h3>
                    <p className="text-sm text-gray-400 leading-relaxed font-light">Third-party relayers submit your trade to the DEX using the ZK proof. The on-chain address is the relayer's, keeping yours clean.</p>
                  </div>
                </SmoothReveal>
             </div>

             <div className="mt-16 flex justify-center">
                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold tracking-widest uppercase text-gray-400 hover:text-white transition-colors cursor-default">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" /> Audited by Halborn & Spearbit
                </div>
             </div>
          </div>
        </div>
      </section>

        {/* --- SECTION 4: ENGINEERED FOR SILENCE (NEW INTEGRATION) --- */}
        <section className="relative py-40 bg-gray-50/50 overflow-hidden">
        {/* Abstract subtle orbs in background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-10">
            <div className="max-w-3xl">
              <SmoothReveal>
                <h2 className="text-6xl md:text-8xl text-[#111827] leading-[0.9] tracking-tighter">
                  Engineered for <br />
                  <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-indigo-500 to-indigo-300 pr-4">
                    Silence.
                  </span>
                </h2>
              </SmoothReveal>
            </div>
            <SmoothReveal delay={0.2}>
              <p className="text-lg text-gray-500 max-w-sm text-left md:text-right leading-relaxed font-light">
                A suite of tools designed to break the link between your identity and your alpha.
              </p>
            </SmoothReveal>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* 1. Privacy Architecture (Large Card) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-8 bg-white rounded-[3rem] p-12 border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group flex flex-col justify-between min-h-[500px]"
            >
              <div className="relative z-10 max-w-md">
                <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform">
                  <Layers size={30} strokeWidth={1.5} />
                </div>
                <h3 className="text-4xl font-serif text-[#111827] mb-6">Privacy Architecture</h3>
                <p className="text-gray-500 text-lg leading-relaxed mb-10">
                  A vertically integrated stack. From the ZK-circuit logic to the relayer network, every layer is built to minimize data leakage while maximizing capital efficiency.
                </p>
                <div className="space-y-4">
                   {["No front-running", "Slippage protection", "Mempool obfuscation"].map((text) => (
                     <div key={text} className="flex items-center gap-3 text-sm font-bold text-[#111827]">
                        <CheckCircle2 size={18} className="text-emerald-500" /> {text}
                     </div>
                   ))}
                </div>
              </div>
              {/* Graphic Layer */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2 hidden lg:block">
                 <PrivacyArchGraphic />
              </div>
            </motion.div>

            {/* 2. Anonymous Withdrawals (Black Card) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-4 bg-[#0a0a0a] text-white rounded-[3rem] p-10 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-bold leading-tight">Anonymous<br/>Withdrawals</h3>
                  <Zap size={24} className="text-indigo-400" />
                </div>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[200px]">Funds exit to fresh addresses, severing the link.</p>
              </div>
              <AnonWithdrawalGraphic />
            </motion.div>

            {/* 3. Multi-Strategy (Light Purple Card) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-4 bg-indigo-50 rounded-[3rem] p-10 flex flex-col justify-between group min-h-[300px]"
            >
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-serif text-[#111827] mb-3">Multi-Strategy</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">Delta Neutral & Basis Trading accessible in one click.</p>
                {/* Bar Chart Graphic Mockup */}
                <div className="flex items-end gap-1.5 h-16 w-full">
                   {[40, 70, 50, 90, 60, 45].map((h, i) => (
                     <motion.div 
                      key={i} 
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      transition={{ delay: i * 0.1, duration: 1 }}
                      className={`flex-1 rounded-t-sm ${i === 3 ? 'bg-indigo-500' : 'bg-indigo-200'}`} 
                     />
                   ))}
                </div>
              </div>
            </motion.div>

            {/* 4. Cross-Chain (White Wide Card) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-5 bg-white border border-gray-100 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 shadow-xl shadow-gray-200/30"
            >
              <div className="flex-1">
                <h3 className="text-2xl font-serif text-[#111827] mb-2">Cross-Chain</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">Seamless liquidity across Arbitrum, Optimism, and Mainnet.</p>
                <div className="flex gap-2">
                  {["ARB", "OP", "ETH"].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-50 rounded-full text-[10px] font-bold text-gray-400 border border-gray-100 tracking-widest">{tag}</span>
                  ))}
                </div>
              </div>
              <CrossChainGraphic />
            </motion.div>

            {/* 5. IP Logs (Red Card) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-3 bg-red-50/50 border border-red-100 rounded-[3rem] p-10 text-center flex flex-col items-center justify-center group"
            >
              <h4 className="text-6xl font-serif text-red-500 mb-2">0</h4>
              <p className="text-[#111827] font-bold text-xs uppercase tracking-widest mb-4">IP Logs Stored</p>
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }} 
                transition={{ duration: 4, repeat: Infinity }}
                className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-red-300 shadow-sm border border-red-50 border-red-100"
              >
                <Ban size={24} />
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      <section 
      className="relative py-48 bg-[#070708] text-white overflow-hidden -mt-32 z-30" 
      style={{ clipPath: 'polygon(0 10%, 100% 0, 100% 100%, 0 100%)' }}
    >
      {/* 1. Seamless Transition Gradient (Top of section) */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

      {/* 2. Ambient Lighting Background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(circle at center, #1e1b4b 0%, transparent 70%)` }} />
      
      <div className="max-w-[1400px] mx-auto px-6 relative z-10 pt-10">
        <SmoothReveal>
          <div className="text-center mb-20">
            <span className="text-indigo-400 font-sans font-bold text-xs tracking-[0.4em] uppercase mb-6 block">The Architecture</span>
            <h2 className="text-5xl md:text-7xl lg:text-[8rem] font-sans font-medium tracking-tighter leading-[0.9] uppercase mb-6">Unified <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-white pr-4">Flow.</span></h2>
            <p className="text-indigo-200/40 text-sm tracking-[0.5em] uppercase font-bold max-w-2xl mx-auto">Privacy-Preserving Cross-Venue Execution Engine</p>
          </div>
        </SmoothReveal>

        <SmoothReveal delay={0.2}>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-5xl mx-auto h-auto drop-shadow-[0_0_50px_rgba(99,102,241,0.2)]">
            {/* 3. Paths & Animated Data Balls */}
            {[...DEX_NODES, ...USER_NODES].map((node, i) => {
              const isDex = i < 6;
              const startX = centerX + (i % 6 - 2.5) * 165;
              const startY = isDex ? 120 : 680;
              const p = { startX, startY, cpX: startX, cpY: centerY, endX: centerX, endY: centerY };
              const duration = 4000;
              let t1 = (time / duration) % 1;
              let t2 = (t1 + 0.5) % 1;

              if (!isDex) { t1 = 1 - t1; t2 = 1 - t2; }
              const pos1 = getBezierXY(t1, p);
              const pos2 = getBezierXY(t2, p);

              return (
                <g key={i}>
                  <path d={`M ${p.startX} ${p.startY} Q ${p.cpX} ${p.cpY} ${p.endX} ${p.endY}`}
                        stroke="white" strokeWidth="1" fill="none" opacity="0.04" />
                  <circle cx={pos1.x} cy={pos1.y} r="3.5" fill="#818cf8" className="filter blur-[0.5px]" />
                  <circle cx={pos2.x} cy={pos2.y} r="3.5" fill="#c084fc" className="filter blur-[0.5px]" />
                </g>
              );
            })}

            {/* 4. DEX Nodes (Top) with Logo Support */}
            {DEX_NODES.map((dex, i) => {
              const x = centerX + (i - 2.5) * 165;
              return (
                <g key={i}>
                  <circle cx={x} cy={120} r="42" fill="#000" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                  {/* Circle background for logo */}
                  <circle cx={x} cy={120} r="32" fill="white" opacity="0.03" />
                  <image href={dex.logo} x={x - 22} y={98} width="44" height="44" className="opacity-90" />
                  <text x={x} y={190} fill="white" opacity="0.25" textAnchor="middle" fontSize="10" fontWeight="bold" className="tracking-widest uppercase font-sans">
                    {dex.name}
                  </text>
                </g>
              );
            })}

            {/* 5. Central NYRA Core Node */}
            <g>
              <defs>
                <filter id="glow-v2">
                  <feGaussianBlur stdDeviation="20" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <circle cx={centerX} cy={centerY} r="85" fill="#000" stroke="#6366f1" strokeWidth="2" filter="url(#glow-v2)" />
              <text x={centerX} y={centerY - 10} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="26" fontWeight="900" className="tracking-[0.4em]">NYRA</text>
              <text x={centerX} y={centerY + 22} fill="#818cf8" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="bold" className="tracking-[0.6em]">PROTOCOL</text>
            </g>

            {/* 6. User Nodes (Bottom) */}
            {USER_NODES.map((user, i) => {
              const x = centerX + (i - 2.5) * 165;
              return (
                <g key={i}>
                  <circle cx={x} cy={680} r="42" fill="#000" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                  <foreignObject x={x - 18} y={662} width="36" height="36" className="text-indigo-400 opacity-60">
                    <div className="flex items-center justify-center h-full">{user.icon}</div>
                  </foreignObject>
                  <text x={x} y={755} fill="white" opacity="0.25" textAnchor="middle" fontSize="10" fontWeight="bold" className="tracking-widest uppercase font-sans">
                    {user.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </SmoothReveal>

        {/* 7. High-End Stats Row */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12">
           {[
             { val: '100%', label: 'Private Execution' },
             { val: '<50ms', label: 'Average Latency' },
             { val: 'UNIFIED', label: 'Global Liquidity' }
           ].map((stat, i) => (
             <SmoothReveal key={i} delay={0.4 + i*0.1}>
               <div className={`text-center ${i === 1 ? 'md:border-x border-white/5 px-4' : ''}`}>
                  <div className="text-5xl font-sans font-bold tracking-widest text-white mb-3">{stat.val}</div>
                  <div className="text-[10px] uppercase tracking-[0.4em] text-indigo-400/40 font-black">{stat.label}</div>
               </div>
             </SmoothReveal>
           ))}
        </div>
      </div>
    </section>

    <section className="relative pt-80 pb-40 bg-white overflow-hidden flex items-center justify-center">
      {/* 
         THE BACKGROUND DESIGN (dark.png):
         We use an img tag with absolute positioning to ensure 
         it fills the bottom half of the section as a soft arch.
      */}
      <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none z-0">
        <img 
          src="/dark.png" 
          alt="background arc" 
          className="w-full h-full object-bottom object-cover lg:object-contain scale-[1.2] translate-y-20"
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center">
        
        {/* Floating Tilted App Icon - Exact replica from image */}
        <SmoothReveal delay={0.1}>
          <motion.div 
            animate={{ 
              y: [0, -15, 0],
              rotate: [-10, -7, -10] 
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 bg-black rounded-[2.2rem] flex items-center justify-center shadow-[0_30px_70px_rgba(0,0,0,0.4)] mb-16"
          >
            {/* The white rounded-square design inside the icon */}
            <div className="w-10 h-10 border-[5px] border-white rounded-[1rem] rotate-45" />
          </motion.div>
        </SmoothReveal>

        {/* Text Content */}
        <div className="text-center max-w-5xl">
          <SmoothReveal delay={0.2}>
            <h2 className="text-[5.5rem] md:text-[9.5rem] font-serif text-[#111827] leading-[0.85] tracking-tighter mb-12">
              Ready to go <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-600 to-indigo-400 pr-6">dark?</span>
            </h2>
          </SmoothReveal>

          <SmoothReveal delay={0.3}>
            <p className="text-xl md:text-2xl text-gray-500 font-medium leading-relaxed max-w-2xl mx-auto mb-20 opacity-80">
              Join thousands of traders who have reclaimed their privacy. <br className="hidden md:block" /> 
              Institutional tools, zero footprint.
            </p>
          </SmoothReveal>

          {/* THE BOLD LAUNCH BUTTON - Corrected for Thickness */}
          <SmoothReveal delay={0.4}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-12">
              <Link 
                to="/vaults" 
                className="h-20 px-16 rounded-full bg-black text-white text-xl font-black flex items-center gap-4 hover:scale-105 transition-all shadow-[0_40px_80px_rgba(0,0,0,0.3)] active:scale-95 group"
              >
                Launch App 
                <ArrowRight size={24} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#" className="text-gray-900 font-black text-sm uppercase tracking-widest hover:text-indigo-600 transition-colors underline decoration-gray-200 underline-offset-[12px] decoration-2">
                Read the Documentation
              </a>
            </div>
          </SmoothReveal>
        </div>
      </div>
    </section>

   <EliteFooter />
    </div>
  );
}

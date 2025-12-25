import { useEffect, useState } from "react"
import { LayoutGroup, motion, useScroll, useSpring } from "framer-motion"
import { Check, ArrowRight} from "lucide-react"
import { Link } from "react-router-dom"
import { Header } from "../components/Header/Header"
import Lenis from "lenis"
import GhostCard from "../components/UI/GhostCard"
import FeatureCard from "../components/UI/FaetureCard"
import { AnimatedGradientBackground } from "../components/UI/AnimatedBackgroud"
import MempoolScannerAnimation from "../components/UI/MempoolScannerAnimation"
import TeeGraphic from "../components/UI/TEEGraphic"
import HeroScene from "../components/UI/QuantumAnimation"


function SmoothReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

// --- SECTION 3: TEE GRAPHIC (Preserved) ---


// --- 3. Main Page Layout ---

export default function HomePage() {
  const [items, setItems] = useState([
    {
      id: "card-privacy", // Stable ID
      title: "Pooled Privacy",
      desc: "Anonymous deposits & withdrawals. Your funds join collective pools, breaking the connection between your wallet and positions.",
      imgSrc: "/left.png",
      linkText: "Trade without broadcasting your strategy"
    },
    {
      id: "card-auto",
      title: "Automated Strategies",
      desc: "Delta-neutral hedging. Basis trading. Cross-venue arbitrage. Strategies that require constant monitoring, now automated.",
      imgSrc: "/top.png",
      linkText: "Access strategies reserved for hedge funds"
    },
    {
      id: "card-agg",
      title: "Multi-Venue Aggregation",
      desc: "Aggregate liquidity from Hyperliquid and Paradex. Best prices, deepest liquidity.",
      imgSrc: "/right.png",
      linkText: "One interface. Multiple exchanges. Maximum efficiency."
    },
    {
      id: "card-sec",
      title: "TEE Security",
      desc: "Every trade executes inside Trusted Execution Environments—cryptographically sealed computational spaces.",
      imgSrc: "/bottom.png",
      linkText: "Security you can verify. Privacy you trust."
    }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) => {
        const next = [...prev];
        // Clockwise rotation: last item moves to index 0
        const lastItem = next.pop()!;
        next.unshift(lastItem);
        return next;
      });
    }, 3000); 

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 origin-left z-50" style={{ scaleX }} />
      <Header />

   {/* --- Section 1: Hero --- */}
   <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black px-6">
        {/* Your Background Animation */}
        <div className="absolute inset-0 z-0 opacity-40">
           <AnimatedGradientBackground />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black z-0 pointer-events-none" />

        {/* 
            THE FIX: -translate-y-32 pulls the content up 
            to avoid the large gap at the top 
        */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center transform -translate-y-20 lg:-translate-y-40">
          
          <div className="space-y-8">
            <h1 className="text-6xl lg:text-8xl font-bold leading-[1] tracking-tighter">
              <span className="text-white block">Sophisticated</span>
              <span className="text-white block">Strategies.</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-300">
                Zero Footprint.
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-400 leading-relaxed max-w-xl">
              Access institutional-grade perpetual strategies while severing the on-chain link between you and your trades.
            </p>
            <Link to="/vaults" className="inline-flex h-14 items-center justify-center rounded-full bg-white px-10 text-sm font-bold text-black transition-transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
               Launch App <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          {/* THE REAL 3D MODEL SCENE */}
          <div className="relative flex justify-center items-center">
             <HeroScene />
          </div>
        </div>
      </section>

      {/* --- Section 2: The Problem --- */}
      <section className="relative py-32 overflow-hidden bg-gradient-to-b from-blue-50 to-white text-black rounded-t-[3rem] -mt-10 z-20 shadow-2xl">
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <SmoothReveal>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6">
                  The Privacy Gap
                </div>
                <h2 className="text-4xl lg:text-6xl font-bold leading-tight mb-6 text-gray-900">
                  In DeFi, trading is <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    a public spectacle.
                  </span>
                </h2>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                   Every alpha-generating move you make is broadcast to the entire network. Your strategies are visible, your size is known, and your liquidation points are public.
                </p>
              </SmoothReveal>
            </div>
            <SmoothReveal delay={0.3}>
              <MempoolScannerAnimation />
            </SmoothReveal>
          </div>
        </div>
      </section>

      {/* --- Section 3: The Solution --- */}
      <section className="relative w-full py-40 overflow-hidden bg-black text-white">
        <div className="absolute inset-0 z-0 w-full h-full opacity-80">
          <AnimatedGradientBackground />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <div className="order-1">
              <SmoothReveal>
                <h2 className="text-4xl lg:text-6xl font-bold leading-tight mb-6 text-white">
                  Private by design. <br/>
                  <span className="text-white/80">
                    Powerful by nature.
                  </span>
                </h2>
                <p className="text-xl text-gray-200 leading-relaxed mb-8">
                  Nyra is a privacy-first perpetual aggregator built on Horizen. 
                  Through pooled deposits and withdrawals, we sever the on-chain link between your wallet and your trading activity.
                </p>
                <p className="text-lg text-gray-300 leading-relaxed mb-8">
                  Your funds mix with others, strategies execute inside cryptographically sealed Trusted Execution Environments, and withdrawals emerge from collective pools.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <Check className="text-white w-6 h-6" /> 
                     <span className="text-lg font-medium">Institutional-grade strategies</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <Check className="text-white w-6 h-6" /> 
                     <span className="text-lg font-medium">Complete trading anonymity</span>
                  </div>
                </div>
              </SmoothReveal>
            </div>

            <div className="order-2 flex justify-center items-center h-full">
              <SmoothReveal delay={0.2}>
                 <TeeGraphic />
              </SmoothReveal>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 4: PIXEL-PERFECT BENTO (IMAGE REPLICA) --- */}
      <section className="relative py-32 px-6 overflow-hidden bg-gradient-to-br from-[#f8fafc] via-[#fdf2f8] to-[#eff6ff]">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/40 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-pink-100/30 blur-[120px] rounded-full" />

      <div className="max-w-[1240px] mx-auto relative z-10">
        {/* LayoutGroup is the key to cross-column animation */}
        <LayoutGroup>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* COLUMN 1: LEFT SLOT */}
            <div className="flex flex-col gap-8 md:mt-20">
               <GhostCard height="h-44" />
               <FeatureCard {...items[0]} /> {/* This card moves to the top next */}
               <GhostCard height="h-64" />
            </div>

            {/* COLUMN 2: TOP & BOTTOM SLOTS */}
            <div className="flex flex-col gap-8">
               <FeatureCard {...items[1]} /> {/* Top Slot */}
               <FeatureCard {...items[3]} /> {/* Bottom Slot */}
            </div>

            {/* COLUMN 3: RIGHT SLOT */}
            <div className="flex flex-col gap-8 md:mt-20">
               <GhostCard height="h-44" />
               <FeatureCard {...items[2]} /> {/* Right Slot */}
               <GhostCard height="h-64" hasPattern={true} />
            </div>

          </div>
        </LayoutGroup>
      </div>
    </section>
      <footer className="bg-white border-t border-gray-100 py-12 text-center text-gray-500 text-sm">
        © 2025 Nyra. All rights reserved.
      </footer>
    </div>
  )
}


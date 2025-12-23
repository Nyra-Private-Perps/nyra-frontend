import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { Check, Shield, ArrowRight, ExternalLink, Activity, Eye, TrendingUp, Layers, Zap, Lock } from "lucide-react"
import { Link } from "react-router-dom"
import { Header } from "../components/Header/Header"
import Lenis from "lenis"
import { HyperCrystallineVault } from "../components/UI/QuantumAnimation"

// --- 3. REPLICA COMPONENTS (Section 4) ---
function FeatureCard({ title, desc, imgSrc, linkText }: { title: string, desc: string, imgSrc: string, linkText: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-10 flex flex-col items-center text-center shadow-[0_15px_50px_rgba(0,0,0,0.03)] border border-white group h-full"
    >
      <div className="w-52 h-52 mb-6 flex items-center justify-center">
        <img src={imgSrc} alt={title} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110" />
      </div>
      <h3 className="text-[22px] font-bold text-gray-900 mb-3 tracking-tight">{title}</h3>
      <p className="text-gray-500 text-[14px] leading-relaxed mb-8 max-w-[280px]">{desc}</p>
      <button className="text-[#3b82f6] text-[13px] font-bold hover:underline mt-auto uppercase tracking-wide">
        {linkText}
      </button>
    </motion.div>
  )
}

function GhostCard({ height = "h-40", hasPattern = false }: { height?: string, hasPattern?: boolean }) {
  return (
    <div className={`w-full ${height} bg-gradient-to-b from-white/40 to-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/50 shadow-sm relative overflow-hidden`}>
       {hasPattern && (
         <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
       )}
    </div>
  )
}


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

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function AnimatedGradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let animationFrameId: number
    let time = 0

    const resize = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }
    resize()
    window.addEventListener("resize", resize)

    const animate = () => {
      const width = canvas.width
      const height = canvas.height
      if (width <= 0 || height <= 0) {
        animationFrameId = requestAnimationFrame(animate)
        return
      }

      const imageData = ctx.createImageData(width, height)
      const data = imageData.data
      time += 0.05

      for (let y = 0; y < height; y += 4) {
        for (let x = 0; x < width; x += 4) {
          let uvX = (6.0 * x) / width
          let uvY = (6.0 * y) / height

          for (let n = 1; n < 8; n++) {
            const i = n
            uvX += (1.0 / i) * Math.sin(i * uvY + time * i) + 0.8
            uvY += (1.0 / i) * Math.sin(uvX + time * i) + 1.6
          }

          const gradientValue = Math.cos(uvX + uvY) * 0.5 + 0.5
          let r, g, b

          if (gradientValue < 0.5) {
            const t = gradientValue * 2
            r = lerp(0.05, 0.1, t); g = lerp(0.08, 0.2, t); b = lerp(0.15, 0.65, t);
          } else {
            const t = (gradientValue - 0.5) * 2
            r = lerp(0.1, 0.98, t); g = lerp(0.2, 0.56, t); b = lerp(0.65, 0.28, t);
          }

          for (let dy = 0; dy < 4; dy++) {
            for (let dx = 0; dx < 4; dx++) {
              if (x + dx < width && y + dy < height) {
                const idx = ((y + dy) * width + (x + dx)) * 4
                data[idx] = r * 255; data[idx + 1] = g * 255; data[idx + 2] = b * 255; data[idx + 3] = 255
              }
            }
          }
        }
      }
      ctx.putImageData(imageData, 0, 0)
      animationFrameId = requestAnimationFrame(animate)
    }
    animate()
    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen" />
}

function MempoolScannerAnimation() {
  // Creating a set of mock transaction data to match the image
  const cells = [
    { id: "0xfdb5", exposed: false }, { id: "EXPOSED", exposed: true }, { id: "0x7ae9", exposed: false }, { id: "0x3908", exposed: false }, { id: "0xe6a2", exposed: false }, { id: "0x1920", exposed: false },
    { id: "0xcce1", exposed: false }, { id: "0x196d", exposed: false }, { id: "EXPOSED", exposed: true }, { id: "0x7bc4", exposed: false }, { id: "0x6862", exposed: false }, { id: "0x2780", exposed: false },
    { id: "0x93e3", exposed: false }, { id: "0x9aa2", exposed: false }, { id: "0xdfc1", exposed: false }, { id: "EXPOSED", exposed: true }, { id: "0x636a", exposed: false }, { id: "0x61d2", exposed: false },
    { id: "0xb5d8", exposed: false }, { id: "0x319c", exposed: false }, { id: "0x85be", exposed: false }, { id: "0x5ee0", exposed: false }, { id: "EXPOSED", exposed: true }, { id: "0x30ac", exposed: false },
  ];

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center perspective-[1500px] overflow-hidden">
      
      {/* The 3D Grid Wrapper */}
      <motion.div 
        className="grid grid-cols-6 gap-3 lg:gap-4 p-4"
        style={{ 
          transform: "rotateX(20deg) rotateZ(5deg) rotateY(-10deg)",
          transformStyle: "preserve-3d" 
        }}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        {cells.map((cell, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.01, duration: 0.5 }}
            className={`
              relative w-20 h-28 lg:w-24 lg:h-32 rounded-2xl border flex flex-col items-center justify-center gap-2 shadow-sm
              ${cell.exposed 
                ? "bg-red-50/90 border-red-200" 
                : "bg-blue-50/50 border-blue-100"
              }
            `}
          >
            {/* Cell Icon */}
            <div className={`${cell.exposed ? "text-red-500" : "text-blue-600"}`}>
              {cell.exposed ? <Eye size={18} className="animate-pulse" /> : <Activity size={18} />}
            </div>
            
            {/* Cell ID / Text */}
            <span className={`font-mono text-[10px] font-bold ${cell.exposed ? "text-red-600" : "text-blue-900/60"}`}>
              {cell.id}
            </span>

            {/* Subsurface glow for exposed cards */}
            {cell.exposed && (
              <motion.div 
                className="absolute inset-0 rounded-2xl bg-red-400/10"
                animate={{ opacity: [0.1, 0.4, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Stunning Scanning Laser Line */}
      <motion.div 
        className="absolute w-[120%] h-[2px] bg-red-500/40 blur-sm z-10 pointer-events-none"
        animate={{ top: ['15%', '85%', '15%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute w-[120%] h-[40px] bg-gradient-to-b from-transparent via-red-500/5 to-transparent z-10 pointer-events-none"
        animate={{ top: ['15%', '85%', '15%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />

    </div>
  )
}

// --- SECTION 3: TEE GRAPHIC (Preserved) ---
const TeeGraphic = () => (
  <div className="relative w-full h-[600px] flex items-center justify-center">
    <motion.div
      className="relative z-10 w-[200px] lg:w-[250px]"
      style={{ transformStyle: "preserve-3d", rotateX: 50, rotateZ: 45 }}
      animate={{ x: [0, -10, 0], y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 312.03 953.99" className="w-full h-auto overflow-visible drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
             <stop offset="0%" stopColor="#1e3a8a" />
             <stop offset="100%" stopColor="#000000" />
          </linearGradient>
        </defs>
        <g id="Layer_2" data-name="Layer 2">
          <g id="Layer_1-2" data-name="Layer 1">
            <g><g><g><g>
               <path fill="white" d="M172.73,386.07H94.06c-10.8,0-14.19,4.63-17.9,13.37-5,12.13-19.12,51.32-23.34,63.45a27.69,27.69,0,0,0-1.54,8.64,33.72,33.72,0,0,0,1.54,8.53c3.5,12.14,18.41,51.42,23.34,63.56,3.6,8.64,7.1,13.37,17.9,13.37h78.67c37.54,0,51.32-20.16,84.22-78.57a15.8,15.8,0,0,0,2.06-6.89,15.38,15.38,0,0,0-2.06-6.89c-32.8-58.52-46.68-78.57-84.22-78.57ZM97.25,540.64c-3.5,0-4.84-.62-6-3.5-6.17-15.63-16.35-46-22.52-61.5a10,10,0,0,1-.93-4.11,12,12,0,0,1,.93-4.11c6.17-15.53,17.07-45.67,22.52-61.61,1-2.77,2.47-3.39,6-3.39h71.67c31.78,0,40.11,15.22,69,62.73,1.85,3,2.47,4.73,2.47,6.38s-.62,3.29-2.47,6.37c-28.8,47.52-37.23,62.74-69,62.74Z" />
               <path fill="white" d="M190.73,434.3H149.8c-7.2,0-10.8,3-11.21,9.05H126.45c-18.92,0-31.57,11.31-31.57,28.08s12.65,28.07,31.57,28.07h12.14c.41,6.07,4,9.15,11.21,9.15h40.93c7.71,0,11.31-3.49,11.31-10.59V444.79c0-7.1-3.6-10.49-11.31-10.49Zm-65.41,54.51c-12.13,0-20-7-20-17.38s7.92-17.38,20-17.38h13.16v34.76Z" />
            </g><g>
               <path fill="white" d="M16.8,416.15V360.8a28.08,28.08,0,0,1,28-28.05h55v-16.5h-55A44.59,44.59,0,0,0,.3,360.8v55.35Z" />
               <path fill="white" d="M99.85,611.13h-55a28.08,28.08,0,0,1-28-28V527.73H.3v55.35a44.59,44.59,0,0,0,44.54,44.55h55Z" />
               <path fill="white" d="M295.18,527.73v55.35a28.08,28.08,0,0,1-28.05,28h-55.7v16.5h55.7a44.6,44.6,0,0,0,44.55-44.55V527.73Z" />
               <path fill="white" d="M211.43,332.75h55.7a28.08,28.08,0,0,1-28.05,28.05v55.35h16.5V360.8a44.6,44.6,0,0,0-44.55-44.55h-55.7Z" />
            </g></g></g><rect x="0.55" y="316.43" width="310.93" height="310.93" rx="49.91" style={{ fill: "none", stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "1px" }} /></g>
            <g id="bottomFlows">
               <path id="bottomPath1" d="M16.31,943.91v-49.5c0-30.82,6.58-60.65,18.57-84.24L59,762.77c12-23.58,18.56-53.42,18.56-84.24V628" style={{ fill: "none", opacity: 0.5, stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "0.1px" }} />
               <text fontFamily="monospace" fontSize="10" fill="#FFF" opacity="1"><textPath href="#bottomPath1">1011001<animate attributeName="startOffset" from="0%" to="100%" dur="3s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;0.7;0.7" dur="3s" repeatCount="indefinite" /></textPath></text>
               <path id="bottomPath2" d="M106.28,943.91V870.18a208.84,208.84,0,0,1,4.94-45.51l17.12-76.4a209.3,209.3,0,0,0,4.93-45.5V628" style={{ fill: "none", opacity: 0.5, stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "0.1px" }} />
               <text fontFamily="monospace" fontSize="10" fill="#FFF" opacity="1"><textPath href="#bottomPath2">1001011<animate attributeName="startOffset" from="0%" to="100%" dur="3s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;0.7;0.7" dur="3s" repeatCount="indefinite" /></textPath></text>
               <path id="bottomPath3" d="M183.42,628v73.73a209.3,209.3,0,0,0,4.93,45.5l17.12,76.4a208.84,208.84,0,0,1,4.94,45.51v74.81" style={{ fill: "none", opacity: 0.5, stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "0.1px" }} />
               <text fontFamily="monospace" fontSize="10" fill="#FFF" opacity="1"><textPath href="#bottomPath3">1110010<animate attributeName="startOffset" from="100%" to="0%" dur="3s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;0.7;0.7" dur="3s" repeatCount="indefinite" /></textPath></text>
               <path id="bottomPath4" d="M232.42,628v49.49c0,30.82,6.57,60.65,18.56,84.24l24.1,47.4c12,23.59,18.56,53.42,18.56,84.24v50.58" style={{ fill: "none", opacity: 0.5, stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "0.1px" }} />
               <text fontFamily="monospace" fontSize="10" fill="#FFF" opacity="1"><textPath href="#bottomPath4">1010111<animate attributeName="startOffset" from="100%" to="0%" dur="3s" repeatCount="indefinite" /><animate attributeName="opacity" values="0;0.7;0.7" dur="3s" repeatCount="indefinite" /></textPath></text>
               <circle cx="16.31" cy="943.91" r="10.08" fill="white" />
               <circle cx="105.96" cy="943.91" r="10.08" fill="white" />
               <circle cx="210.43" cy="943.91" r="10.08" fill="white" />
               <circle cx="294.05" cy="943.91" r="10.08" fill="white" />
            </g>
            <g id="topFlows">
               <path d="M 235.26,316 v-50.52 c0,-30.82 6.56,-60.65 18.56,-84.24 l24.1,-47.4 c12,-23.59 18.56,-53.42 18.56,-84.24 V0" style={{ fill: "none", stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "0.1px" }} />
               <circle r="4" fill="#FFF" opacity="0.6"><animateMotion dur="4s" repeatCount="indefinite" begin="1.5s" path="M 235.26,316 v-50.52 c0,-30.82 6.56,-60.65 18.56,-84.24 l24.1,-47.4 c12,-23.59 18.56,-53.42 18.56,-84.24 V0" /><animate attributeName="opacity" values="0.6;0.6;0" begin="1.5s" dur="4s" repeatCount="indefinite" /></circle>
               <path d="M 186.52,316 v-74.77 a209.32,209.32,0,0,1,4.93,-45.51 l17.13,-76.4 a209.46,209.46,0,0,0,4.93,-45.51 V0" style={{ fill: "none", stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "0.1px" }} />
               <circle r="4" fill="#FFF" opacity="0.6"><animateMotion dur="4s" repeatCount="indefinite" path="M 186.52,316 v-74.77 a209.32,209.32,0,0,1,4.93,-45.51 l17.13,-76.4 a209.46,209.46,0,0,0,4.93,-45.51 V0" /><animate attributeName="opacity" values="0.6;0.6;0" dur="4s" repeatCount="indefinite" /></circle>
               <path d="M129.38,316V242.23a208.71,208.71,0,0,0-4.94-45.51l-17.12-76.4a209.46,209.46,0,0,1-4.94-45.51V0" style={{ fill: "none", stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "0.1px" }} />
               <circle r="4" fill="#FFF" opacity="0.6"><animateMotion dur="4s" begin="1.5s" repeatCount="indefinite" path="M129.38,316V242.23a208.71,208.71,0,0,0-4.94-45.51l-17.12-76.4a209.46,209.46,0,0,1-4.94-45.51V0" /><animate attributeName="opacity" values="0.6;0.6;0" begin="1.5s" dur="4s" repeatCount="indefinite" /></circle>
               <path d="M80.37,316v-49.5c0-30.82-6.57-60.65-18.56-84.24l-24.09-47.4c-12-23.59-18.56-53.42-18.56-84.24V0" style={{ fill: "none", stroke: "#fff", strokeMiterlimit: 10, strokeWidth: "0.1px" }} />
               <circle r="4" fill="#FFF" opacity="0.6"><animateMotion dur="4s" repeatCount="indefinite" path="M80.37,316v-49.5c0-30.82-6.57-60.65-18.56-84.24l-24.09-47.4c-12-23.59-18.56-53.42-18.56-84.24V0" /><animate attributeName="opacity" values="0.6;0.6;0" dur="4s" repeatCount="indefinite" /></circle>
            </g>
         </g></g>
      </svg>
    </motion.div>
    <img 
      src="/composed__denoised_edited.png"
      alt=""
      className="absolute pointer-events-none opacity-80"
      style={{
        zIndex: 0, 
        top: "43%",
        left: "65%",
        width: "100%", 
        height: "auto",
        transform: "translate(-65%, -20%) scale(1.5)" 
      }}
    />
  </div>
)

// --- 3. Main Page Layout ---

export default function HomePage() {
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
        <div className="absolute inset-0 z-0 opacity-40">
           <AnimatedGradientBackground />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black z-0 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <SmoothReveal>
            <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
              <span className="text-white block">Sophisticated</span>
              <span className="text-white block">Strategies.</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
                Zero Footprint.
              </span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed max-w-xl mb-8">
              Access institutional-grade perpetual strategies across Hyperliquid and Paradex while severing the on-chain link between you and your trades.
            </p>
            <Link to="/vaults" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-bold text-black transition-transform hover:scale-105 hover:bg-gray-200">
               Launch App <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </SmoothReveal>

          {/* Added a negative margin-top here to visually align the graphic with the top of the text */}
          <SmoothReveal delay={0.2}>
             <div className="lg:-mt-10">
                <HyperCrystallineVault />
             </div>
          </SmoothReveal>
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
        {/* Soft Background Blurs to match reference */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/40 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-pink-100/30 blur-[120px] rounded-full" />

        <div className="max-w-[1240px] mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* Column 1: Left (Staggered) */}
            <div className="flex flex-col gap-8 md:mt-20">
               <GhostCard height="h-44" />
               <FeatureCard 
                 title="Pooled Privacy"
                 desc="Anonymous deposits & withdrawals. Your funds join collective pools, breaking the connection between your wallet and positions."
                 imgSrc="/left.png" 
                 linkText="Trade without broadcasting your strategy"
               />
               <GhostCard height="h-64" />
            </div>

            {/* Column 2: Center (Primary Features) */}
            <div className="flex flex-col gap-8">
               <FeatureCard 
                 title="Automated Strategies"
                 desc="Delta-neutral hedging. Basis trading. Cross-venue arbitrage. Strategies that require constant monitoring, now automated."
                 imgSrc="/top.png" 
                 linkText="Access strategies reserved for hedge funds"
               />
               <FeatureCard 
                 title="TEE Security"
                 desc="Every trade executes inside Trusted Execution Environments—cryptographically sealed computational spaces."
                 imgSrc="/bottom.png" 
                 linkText="Security you can verify. Privacy you trust."
               />
            </div>

            {/* Column 3: Right (Staggered) */}
            <div className="flex flex-col gap-8 md:mt-20">
               <GhostCard height="h-44" />
               <FeatureCard 
                 title="Multi-Venue Aggregation"
                 desc="Aggregate liquidity from Hyperliquid and Paradex. Best prices, deepest liquidity."
                 imgSrc="/right.png" 
                 linkText="One interface. Multiple exchanges. Maximum efficiency."
               />
               <GhostCard height="h-64" hasPattern={true} />
            </div>

          </div>
        </div>
      </section>
      <footer className="bg-white border-t border-gray-100 py-12 text-center text-gray-500 text-sm">
        © 2025 Nyra. All rights reserved.
      </footer>
    </div>
  )
}


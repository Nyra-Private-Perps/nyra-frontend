import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Shield, Layers, LayoutGrid, Share2, CandlestickChart, Lock, ArrowRight } from 'lucide-react';

/**
 * COORDINATE SYSTEM
 * Nodes: Maintained at Left/Top positions as requested.
 * Lines: Shifted +40px to the Right within the SVG layer.
 */
const NODES = [
  { id: 'dep', x: 60, y: 320, title: 'Horizen Deposit', icon: <LogIn size={22} />, color: '#3b82f6', desc: 'Shielded entry point detaching identity from funds.' },
  { id: 'tee', x: 290, y: 200, title: 'TEE Architecture', icon: <Shield size={24} />, color: '#6366f1', desc: 'Mathematically isolated computation inside encrypted enclaves.' },
  { id: 'bat', x: 480, y: 440, title: 'Batched Deposits', icon: <Layers size={22} />, color: '#a855f7', desc: 'Orders aggregated into anonymous batches to break linkability.' },
  { id: 'vlt', x: 580, y: 120, title: 'Multi-Strategy Vaults', icon: <LayoutGrid size={22} />, color: '#06b6d4', desc: 'Smart routing to optimal delta-neutral strategies.' },
  { id: 'hub', x: 780, y: 320, title: 'Cross-Chain Hub', icon: <Share2 size={24} />, color: '#64748b', desc: 'Bridges privacy across multiple L2s seamlessly.' },
  { id: 'dex', x: 1020, y: 200, title: 'Hyperliquid & Paradex', icon: <CandlestickChart size={22} />, color: '#2563eb', desc: 'Institutional grade fills with minimal slippage visibility.' },
  { id: 'ext', x: 1240, y: 460, title: 'Private Withdrawals', icon: <Lock size={24} />, color: '#10b981', desc: 'Clean exit to fresh wallets via ZK-proofs.' }
];

const CONNECTIONS = [
  { from: 'dep', to: 'tee', delay: 0 },
  { from: 'tee', to: 'vlt', delay: 2 },
  { from: 'tee', to: 'bat', delay: 2 },
  { from: 'vlt', to: 'hub', delay: 4 },
  { from: 'bat', to: 'hub', delay: 4 },
  { from: 'hub', to: 'dex', delay: 6 },
  { from: 'hub', to: 'ext', delay: 6 },
  { from: 'dex', to: 'ext', delay: 8 }
];

const NyraConstellation = () => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Shift value for the lines
  const LINE_SHIFT_X = 40; 

  return (
    <section className="relative w-full py-24 bg-[#f8fafc] overflow-hidden min-h-screen flex flex-col items-center justify-center font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_35%_35%,_rgba(99,102,241,0.08),_transparent_70%)]" />
      </div>

      {/* Header Section */}
      <div className="relative z-30 text-center mb-16 max-w-4xl px-6">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="flex items-center justify-center gap-3 mb-6">
          <span className="h-[1px] w-12 bg-indigo-200" />
          <span className="text-[11px] font-mono font-bold tracking-[0.4em] text-indigo-500 uppercase">System Topology</span>
          <span className="h-[1px] w-12 bg-indigo-200" />
        </motion.div>
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
          The Nyra <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 italic font-serif pr-2">Constellation</span>
        </h2>
        <p className="text-lg text-slate-500 font-light max-w-2xl mx-auto">
          Hover over nodes to explore architecture. The moving stream illustrates our sequential privacy protocol in real-time.
        </p>
      </div>

      {/* Constellation Container */}
      <div className="relative w-full max-w-[1400px] h-[650px] mx-auto hidden md:block select-none">
        
        {/* SVG LAYER */}
        <svg 
          viewBox="0 0 1400 650" 
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        >
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Connection Lines (Shifted Right) */}
          {CONNECTIONS.map((conn, idx) => {
            const from = NODES.find(n => n.id === conn.from);
            const to = NODES.find(n => n.id === conn.to);
            if (!from || !to) return null;
            return (
              <line
                key={`line-${idx}`}
                x1={from.x + LINE_SHIFT_X} y1={from.y} 
                x2={to.x + LINE_SHIFT_X} y2={to.y}
                stroke="url(#pathGradient)"
                strokeWidth="1.5"
                strokeDasharray="6 10"
              />
            );
          })}

          {/* Sequential Data Pulses (Shifted Right) */}
          {CONNECTIONS.map((conn, idx) => {
            const from = NODES.find(n => n.id === conn.from);
            const to = NODES.find(n => n.id === conn.to);
            if (!from || !to) return null;
            return (
              <motion.circle key={`pulse-${idx}`} r="3.5" fill="white" style={{ filter: 'drop-shadow(0 0 10px #6366f1)' }}>
                <animateMotion 
                  dur="2.8s"
                  begin={`${conn.delay}s`}
                  repeatCount="indefinite"
                  path={`M ${from.x + LINE_SHIFT_X},${from.y} L ${to.x + LINE_SHIFT_X},${to.y}`}
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1"
                />
              </motion.circle>
            );
          })}
        </svg>

        {/* NODES LAYER */}
        {NODES.map((node) => (
          <motion.div
            key={node.id}
            className="absolute z-20"
            style={{ left: node.x, top: node.y }}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
          >
            <motion.div 
              className="relative -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Dynamic Aura */}
              <motion.div 
                animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 rounded-full blur-3xl" 
                style={{ backgroundColor: node.color }}
              />

              {/* UNIFIED NODE SIZE */}
              <div className={`
                relative bg-white border border-slate-100 rounded-full shadow-2xl flex items-center justify-center 
                transition-all duration-500 w-20 h-20 group-hover:scale-110 
                group-hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]
              `}>
                <div style={{ color: node.color }}>{node.icon}</div>
              </div>

              {/* Label */}
              <div className="absolute top-full mt-4 flex flex-col items-center">
                 <span className="text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase group-hover:text-slate-900 transition-colors whitespace-nowrap">
                   {node.title}
                 </span>
                 <motion.div 
                    initial={{ width: 0 }} 
                    whileHover={{ width: '100%' }} 
                    className="h-[2px] bg-indigo-500 mt-1" 
                 />
              </div>

              {/* Glass Info Cards */}
              <AnimatePresence>
                {hoveredNode === node.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute top-[135%] left-1/2 -translate-x-1/2 w-64 p-5 bg-white/90 backdrop-blur-2xl rounded-[2rem] border border-white/50 shadow-2xl z-50 pointer-events-none"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${node.color}15`, color: node.color }}>
                        {React.cloneElement(node.icon, { size: 16 })}
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs tracking-tight">{node.title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      {node.desc}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Global CTA */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="mt-20 z-30">
        <button className="group flex items-center gap-4 bg-[#0f172a] text-white px-10 py-4 rounded-full text-md font-bold shadow-xl hover:bg-indigo-600 transition-all hover:-translate-y-1">
          Explore Protocol Documentation
          <ArrowRight className="group-hover:translate-x-2 transition-transform" />
        </button>
      </motion.div>
    </section>
  );
};

export default NyraConstellation;

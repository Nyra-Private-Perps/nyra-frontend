import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { Lock } from "lucide-react";
import { useEffect, useRef } from "react";

export function HyperCrystallineVault() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Buttery smooth physics
  const springConfig = { damping: 25, stiffness: 120, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Rotation and Parallax Mapping
  const rotateX = useTransform(smoothY, [-0.5, 0.5], ["25deg", "-25deg"]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], ["-30deg", "30deg"]);
  const gridRotateX = useTransform(smoothY, [-0.5, 0.5], ["60deg", "50deg"]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[700px] flex items-center justify-center perspective-[2000px] select-none">
      
      {/* 1. THE QUANTUM GRID (The 'Footprint' being erased) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
        <motion.div 
          style={{
            rotateX: gridRotateX,
            rotateZ: "15deg",
            transformStyle: "preserve-3d",
            backgroundImage: `linear-gradient(to right, rgba(59,130,246,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.2) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(circle, black, transparent 70%)'
          }}
          className="w-[120%] h-[120%] border-[1px] border-blue-500/30"
        />
      </div>

      {/* 2. ATMOSPHERIC CAUSTICS (Ambient light reflections) */}
      <motion.div 
        className="absolute w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full"
        style={{
          x: useTransform(smoothX, [-0.5, 0.5], [50, -50]),
          y: useTransform(smoothY, [-0.5, 0.5], [50, -50]),
        }}
      />

      {/* 3. MECHANICAL ORBITAL RINGS (Institutional feel) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute border-[1px] border-white/10 rounded-full"
            style={{ 
              width: 480 + i * 40, 
              height: 480 + i * 40,
              transformStyle: "preserve-3d"
            }}
            animate={{ rotateX: [0, 360], rotateY: [0, 360] }}
            transition={{ duration: 25 + i * 10, repeat: Infinity, ease: "linear" }}
          >
            {/* Small mechanical notches on rings */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-4 bg-white/40 shadow-[0_0_10px_white]" />
          </motion.div>
        ))}
      </div>

      {/* 4. THE CORE OBJECT */}
      <motion.div 
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative w-80 h-80 flex items-center justify-center"
      >
        
        {/* REFRACTIVE SHARD SHIELD (Liquid Light Effect) */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 border-[0.5px] border-white/20 backdrop-blur-[10px] bg-white/5 overflow-hidden"
            style={{
              borderRadius: "35% 65% 65% 35% / 35% 35% 65% 65%",
              rotateZ: i * 60,
              z: i * 25,
            }}
            animate={{ 
              borderRadius: ["35% 65% 65% 35% / 35% 35% 65% 65%", "65% 35% 35% 65% / 65% 65% 35% 35%", "35% 65% 65% 35% / 35% 35% 65% 65%"],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, delay: i * 0.4 }}
          >
             {/* Liquid Light Sweep inside the glass */}
             <motion.div 
               className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent w-[200%]"
               animate={{ x: ["-100%", "100%"] }}
               transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
             />
          </motion.div>
        ))}

        {/* THE VAULT (The High-Alpha Strategy Heart) */}
        <motion.div 
          className="relative z-10 w-48 h-48 rounded-[3rem] p-[1.5px] bg-gradient-to-br from-white/30 to-blue-500/20 shadow-[0_0_100px_rgba(59,130,246,0.4)]"
          style={{ z: 150 }}
        >
          <div className="w-full h-full bg-[#050505] rounded-[3rem] flex items-center justify-center overflow-hidden relative border border-white/10">
            
            {/* Internal Plasma Glow */}
            <div className="absolute inset-0 bg-gradient-radial from-blue-600/20 to-transparent animate-pulse" />
            
            {/* The Lock Icon */}
            <motion.div
              animate={{ 
                scale: [0.95, 1.05, 0.95],
                filter: ["drop-shadow(0 0 10px rgba(59,130,246,0.4))", "drop-shadow(0 0 25px rgba(59,130,246,0.8))", "drop-shadow(0 0 10px rgba(59,130,246,0.4))"]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Lock className="w-16 h-16 text-white relative z-20" strokeWidth={1} />
            </motion.div>

            {/* Moving Scanner Beam */}
            <motion.div 
               className="absolute top-0 bottom-0 w-[2px] bg-blue-400 shadow-[0_0_15px_#60a5fa] z-10"
               animate={{ left: ["10%", "90%", "10%"] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>

        {/* INTERACTIVE DATA SWARM (Mouse-reactive particles) */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[1px] h-[1px] bg-white rounded-full"
            style={{ left: "50%", top: "50%", boxShadow: "0 0 5px white" }}
            animate={{
              x: [Math.random() * 600 - 300, Math.random() * 600 - 300],
              y: [Math.random() * 600 - 300, Math.random() * 600 - 300],
              z: [Math.random() * 400 - 200, Math.random() * 400 - 200],
              opacity: [0, 0.6, 0]
            }}
            transition={{ duration: 5 + Math.random() * 5, repeat: Infinity }}
          />
        ))}

      </motion.div>
    </div>
  );
}
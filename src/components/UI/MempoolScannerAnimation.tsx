import { motion } from "framer-motion";
import { Eye, Activity } from "lucide-react";
const MempoolScannerAnimation=() => {
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

  export default MempoolScannerAnimation;

"use client"
import { motion } from "framer-motion"

export const ProfessionalBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#F8F9FD]">
    {/* 1. Animated Blobs - Matching the exact HTML logic */}
    <motion.div 
      animate={{ 
        translate: [ '0px 0px', '30px -50px', '-20px 20px', '0px 0px' ],
        scale: [1, 1.1, 0.9, 1] 
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full filter blur-[80px] opacity-70"
    />

    <motion.div 
      animate={{ 
        translate: [ '0px 0px', '-40px 30px', '30px -20px', '0px 0px' ],
        scale: [1, 1.2, 0.8, 1] 
      }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-400/10 rounded-full filter blur-[80px] opacity-70"
    />

    <motion.div 
      animate={{ 
        translate: [ '0px 0px', '50px 20px', '-30px -40px', '0px 0px' ],
        scale: [1, 1.1, 0.9, 1] 
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-purple-400/10 rounded-full filter blur-[100px] opacity-60"
    />
  </div>
)
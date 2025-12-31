"use client"
import { motion, useScroll, useSpring } from "framer-motion"
import { ProfileOverview } from "../components/Profile/ProfileOverview"
import { ProfessionalBackground } from "../components/UI/ProfileBackground";
import { Header } from "../components/Header/Header"

export default function ProfilePage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <div className="min-h-screen selection:bg-indigo-100 relative text-slate-900 bg-[#F8F9FD] font-sans">
      {/* Scroll Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-cyan-500 origin-left z-[100]" style={{ scaleX }} />
      
      <ProfessionalBackground />
      <Header />
      
      <main className="relative z-10 max-w-[1400px] mx-auto pt-32 pb-20 px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <ProfileOverview />
        </motion.div>
      </main>

      <footer className="relative z-10 py-12 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
          © 2025 Nyra Protocol • Decentralized Trading Dashboard
        </div>
      </footer>
    </div>
  )
}

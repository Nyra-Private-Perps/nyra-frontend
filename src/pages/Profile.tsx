import { motion, useScroll, useSpring } from "framer-motion"
import { Header } from "../components/Header/Header"
import { ProfileOverview } from "../components/Profile/ProfileOverview"

const OutstandingBackground = () => (
  <>
    <div 
      className="fixed inset-0 -z-20"
      style={{
        backgroundColor: '#F8F7FF',
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
          radial-gradient(at 100% 0%, rgba(168, 85, 247, 0.15) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.1) 0px, transparent 50%)
        `,
        backgroundAttachment: 'fixed'
      }}
    />
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-400/20 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-400/20 blur-[120px]" />
    </div>
  </>
);

export default function ProfilePage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-100 relative text-slate-900">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 origin-left z-[200]" style={{ scaleX }} />
      <OutstandingBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow pt-40 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <ProfileOverview />
          </div>
        </main>
        <footer className="w-full py-10 border-t border-indigo-50 bg-white/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto text-center text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold">
            © 2025 Nyra Protocol • Ultra Elite Private Perpetual Trading
          </div>
        </footer>
      </div>
    </div>
  )
}

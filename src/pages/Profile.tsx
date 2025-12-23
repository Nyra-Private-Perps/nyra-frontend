import { Header } from "../components/Header/Header"
import { ProfileOverview } from "../components/Profile/ProfileOverview"
import { AnimatedGradientBackground } from "../components/UI/AnimatedBackgroud"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 relative font-sans">
      {/* 1. Animated Background Layer */}
      <div className="fixed inset-0 z-0">
        <AnimatedGradientBackground />
      </div>
      
      {/* 2. Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow pt-28 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <ProfileOverview />
          </div>
        </main>

        <footer className="w-full py-8 border-t border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
            © 2025 Nyra • Private Perpetual Vaults
          </div>
        </footer>
      </div>
    </div>
  )
}
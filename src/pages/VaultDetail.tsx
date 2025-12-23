import { useParams, Link } from "react-router-dom";
import { Header } from "../components/Header/Header";
import { VaultDetail } from "../components/Vaults/VaultDetail";
import { useVaults } from "../lib/hyperliquid"; 
import { Loader, AlertTriangle, ArrowLeft } from "lucide-react";
import { AnimatedGradientBackground } from "../components/UI/AnimatedBackgroud";

export default function VaultDetailPage() {
  // 1. Get the slug from the URL
  const { slug } = useParams<{ slug: string }>();
  
  // 2. Fetch all vaults
  const { data: vaults, isLoading, error } = useVaults();

  // 3. Find the specific vault
  const vault = vaults?.find((v) => v.slug === slug);

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <AnimatedGradientBackground />
        <Header />
        <div className="relative z-10 flex h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10">
            <Loader className="animate-spin text-blue-500 w-10 h-10" />
            <p className="text-gray-400 font-medium tracking-wide">Loading Strategy...</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Error or Not Found State ---
  if (error || !vault) {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <AnimatedGradientBackground />
        <Header />
        <div className="relative z-10 flex h-[80vh] items-center justify-center px-6">
          <div className="text-center bg-gray-900/60 p-10 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl max-w-md w-full">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Vault Not Found</h1>
            <p className="text-gray-400 mb-8 leading-relaxed">
              The strategy <span className="text-white font-mono bg-white/10 px-1 rounded">{slug}</span> does not exist or is currently unavailable.
            </p>
            <Link 
              to="/vaults" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors w-full"
            >
              <ArrowLeft size={18} /> Back to Strategies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Success State ---
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 relative">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <AnimatedGradientBackground />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <VaultDetail vault={vault} />
          </div>
        </main>

        <footer className="w-full py-8 border-t border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm px-6">
            © 2025 Nyra • Private Perpetual Vaults • Data from DefiLlama
          </div>
        </footer>
      </div>
    </div>
  );
}
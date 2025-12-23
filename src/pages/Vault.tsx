import { Header } from "../components/Header/Header";
import { VaultsClient } from "../components/Vaults/VaultsClient";
import { useVaults } from "../lib/hyperliquid";
import { Loader, AlertTriangle } from "lucide-react";
import { AnimatedGradientBackground } from "../components/UI/AnimatedBackgroud";

export default function VaultsPage() {
  const { data: vaults, isLoading, error } = useVaults();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white relative">
        <AnimatedGradientBackground />
        <Header />
        <div className="flex h-[80vh] items-center justify-center relative z-10">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-10 h-10 animate-spin text-blue-500" />
            <p className="text-gray-400 font-medium">Syncing Vault Data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white relative">
        <AnimatedGradientBackground />
        <Header />
        <div className="flex h-[80vh] items-center justify-center relative z-10">
          <div className="text-center bg-gray-900/50 p-8 rounded-3xl border border-red-500/20 backdrop-blur-md">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white">Failed to load vaults</h2>
            <p className="text-gray-400 mt-2">Could not fetch the latest strategies.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 relative">
      <div className="fixed inset-0 z-0">
        <AnimatedGradientBackground />
      </div>
      
      {/* Content wrapper */}
      <div className="relative z-10">
        <Header />
        <main className="py-20 px-6">
          <VaultsClient initialVaults={vaults || []} />
        </main>

        <footer className="w-full py-8 mt-20 border-t border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
            © 2025 Nyra • Private Perpetual Vaults • Data from DefiLlama
          </div>
        </footer>
      </div>
    </div>
  );
}

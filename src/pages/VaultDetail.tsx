import { useParams, Link } from "react-router-dom";
import { Header } from "../components/Header/Header";
import { VaultDetail } from "../components/Vaults/VaultDetail";
import { useVaults } from "../lib/hyperliquid"; 
import { Loader, AlertTriangle, ArrowLeft } from "lucide-react";
import { AnimatedGradientBackground } from "../components/UI/AnimatedBackgroud";
import OutstandingBackground from "../components/UI/AnimatedGradientBackground";

export default function VaultDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: vaults, isLoading, error } = useVaults();
  const vault = vaults?.find((v) => v.slug === slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-indigo-600 w-10 h-10" />
          <p className="text-indigo-900/40 font-bold uppercase tracking-widest text-[10px]">Syncing Strategy...</p>
        </div>
      </div>
    );
  }

  if (error || !vault) {
    return (
      <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center px-6">
        <div className="text-center bg-white p-10 rounded-[3rem] border border-red-100 shadow-2xl max-w-md w-full">
          <AlertTriangle className="text-red-500 w-12 h-12 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vault Not Found</h1>
          <Link to="/vaults" className="inline-flex items-center gap-2 text-indigo-600 font-bold mt-4 hover:underline">
            <ArrowLeft size={18} /> Back to Strategies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF] selection:bg-indigo-100 relative">
      {/* Soft Ambient Background Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-100 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-100 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <OutstandingBackground />
        <main className="flex-grow pt-32 pb-20 px-6">
          <VaultDetail vault={vault} />
        </main>
        <footer className="w-full py-10 border-t border-indigo-50 bg-white/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto text-center text-gray-400 text-xs px-6 uppercase tracking-widest font-medium">
            © 2025 Nyra Protocol • High Precision Yield Aggregator
          </div>
        </footer>
      </div>
    </div>
  );
}

import { Header } from "@/components/Header/Header";
import { getRealPerpVaults } from "@/lib/hyperliquid";
import { VaultsClient } from "@/components/Vaults/VaultsClient";

// Force dynamic only if strictly necessary, but with cache it's fine.
// const dynamic = 'force-dynamic' 

export default async function VaultsPage() {
  // 1. Fetch on Server (Fast, Cached)
  const vaults = await getRealPerpVaults();

  return (
    <div>
      <Header />
      <main className="py-12 px-6">
        {/* 2. Pass data to Client Component for Interactivity */}
        <VaultsClient initialVaults={vaults} />
      </main>

      <footer className="w-full py-6 mt-12 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto text-center text-[var(--foreground-secondary)]/70 text-sm">
          © 2025 Nyra • Private Perpetual Vaults • Data from DefiLlama
        </div>
      </footer>
    </div>
  );
}

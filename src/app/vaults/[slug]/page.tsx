// app/vaults/[slug]/page.tsx
import { Header } from "@/components/Header/Header"
import { VaultDetail } from "@/components/Vaults/VaultDetail"
import { notFound } from "next/navigation"
import { getRealPerpVaults } from "@/lib/hyperliquid"

// Generate all static paths at build time
export async function generateStaticParams() {
  const vaults = await getRealPerpVaults()
  return vaults.map((vault) => ({
    slug: vault.slug,
  }))
}

// Dynamic page
export default async function VaultPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const vaults = await getRealPerpVaults()

  // Find the exact vault by slug
  const vault = vaults.find((v) => v.slug === slug)

  if (!vault) {
    notFound()
  }

  return (
    <div className="bg-[var(--background)] min-h-screen">
      <Header />
      <main className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <VaultDetail vault={vault} />
        </div>
      </main>
    </div>
  )
}
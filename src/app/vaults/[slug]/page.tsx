import { Header } from "@/components/Header/Header"
import { ClientVaultDetail } from "@/components/Vaults/ClientVaultDetail"
import { notFound } from "next/navigation"

const vaults = {
  "hjlp-2x-usdc": {
    name: "hJLP 2x (USDC)",
    manager: "Gauntlet",
    tvl: "$21.4M",
    apy: "8.61%",
    age: "399 days",
    capacity: "82%",
    maxDrawdown: "-0.12%",
    tradingVolume: "$127.3M",
    roi: "12.3%",
    sharePrice: "1.1234",
    vaultBalance: "18,421.00 USDC",
  },
  "jitosol-plus": {
    name: "JitoSOL Plus",
    manager: "Gauntlet",
    tvl: "$7.6M",
    apy: "-0.49%",
    age: "245 days",
    capacity: "98.88%",
    maxDrawdown: "-0.43%",
    tradingVolume: "$42.1M",
    roi: "0.80%",
    sharePrice: "1.0042",
    vaultBalance: "0.00 JitoSOL",
    almostFull: true,
  },
  "acepro-steady-d01": {
    name: "Ace.Pro | Steady D01",
    manager: "Ace.Pro",
    tvl: "$21.1M",
    apy: "12.77%",
    age: "290 days",
    capacity: "100%",
    full: true,
  },
  "jlp-hedge-vault": {
    name: "JLP Hedge Vault",
    manager: "PrimeNumber",
    tvl: "$11.7M",
    apy: "26.45%",
    age: "276 days",
    capacity: "95%",
  },
} as const

export async function generateStaticParams() {
  return Object.keys(vaults).map((slug) => ({ slug }))
}

export default async function VaultPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const vault = vaults[slug as keyof typeof vaults]

  if (!vault) notFound()

  return (
    <>
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#1E293B]" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent_70%)] animate-pulse" />

      <Header />

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <ClientVaultDetail vault={vault} />
        </div>
      </main>
    </>
  )
}

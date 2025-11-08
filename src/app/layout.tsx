import type { Metadata } from "next"
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/600.css'; // optional for semibold
import '@fontsource/montserrat/800.css';
import "./globals.css"
import { WalletProvider } from "@/components/Wallet/WalletProvider"

export const metadata: Metadata = {
  title: "Nyra - Privacy and Efficiency for Perpetual Markets",
  description: "Bringing privacy and efficiency to perpetual markets.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* Apply the font variable and the default theme colors from your config */}
      <body
        className={`font-sans bg-[var(--background)] font-sans text-[var(--foreground)] antialiased`}
      >
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  )
}

import './globals.css'
import type { Metadata } from 'next'
import { WalletProvider } from '../components/Wallet/WalletProvider' // Correct path alias

export const metadata: Metadata = {
  title: 'Nyra',
  description: 'Privacy and efficiency for perpetual markets.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  )
}

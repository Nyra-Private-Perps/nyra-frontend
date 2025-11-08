"use client"

import { Header } from "@/components/Header/Header"
import Link from "next/link"
import { motion, Variants } from "framer-motion" // 1. Import Framer Motion

// --- Animation Variants ---
// A container variant to orchestrate the animations of its children
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // Animate each child with a 0.2s delay
      ease: "easeOut",
    },
  },
}

// A variant for each text/button element to fade and slide in
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
}

export default function HomePage() {
  return (
    // The main container remains the same
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* --- ENHANCEMENT: Dynamic Background --- */}
      {/* This div adds a subtle, slowly pulsing aurora glow behind the content */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--background)]" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80rem] h-[40rem] bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.1),transparent_60%)]"
        />
      </div>

      <Header />
      <main className="flex-grow flex items-center justify-center text-center px-4 sm:px-6 lg:px-8">
        {/* 2. Use the container to orchestrate the animations */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl w-full"
        >
          {/* 3. Animate the headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl font-semibold text-[var(--foreground)] leading-tight"
          >
            Nyra brings{" "}
            {/* --- ENHANCEMENT: Highlighted Text --- */}
            {/* This span adds a subtle gradient to the key words for more visual appeal */}
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--foreground-secondary)] bg-clip-text text-transparent">
              privacy and efficiency
            </span>{" "}
            to perpetual markets.
          </motion.h1>

          {/* 4. Animate the paragraph */}
          <motion.p
            variants={itemVariants}
            className="mt-8 max-w-3xl mx-auto text-lg text-[var(--foreground-secondary)] leading-relaxed"
          >
            Today’s protocols require over-collateralization, locking capital and excluding millions. We’re changing that
            by aggregating liquidity and execution through a Trusted Execution Environment (TEE), ensuring every trade
            remains fully private yet verifiable on-chain.
          </motion.p>

          {/* 5. Animate the button */}
          <motion.div variants={itemVariants} className="mt-12 flex items-center justify-center">
            <motion.div
              // --- ENHANCEMENT: More interactive button animation ---
              whileHover={{ y: -3, scale: 1.05, boxShadow: "0px 10px 20px -5px hsl(var(--primary)/0.2)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <Link
                href="/vaults"
                className="block w-full sm:w-auto bg-[var(--primary)] shadow-[var(--shadow-card)] text-[var(--primary-foreground)] font-semibold py-3 px-8 rounded-lg transition-opacity duration-300"
              >
                Explore Vaults
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </main>

      <footer className="w-full py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-[var(--foreground-secondary)]/80 text-sm">
          © 2025 Nyra. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
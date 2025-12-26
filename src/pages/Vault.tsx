"use client";

import { useEffect, useRef } from "react";
import { Header } from "../components/Header/Header";
import { VaultsClient } from "../components/Vaults/VaultsClient";
import { useVaults } from "../lib/hyperliquid";
import { Loader, AlertTriangle } from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";
import Lenis from "lenis";
import OutstandingBackground from "../components/UI/AnimatedGradientBackground";

export default function VaultsPage() {
  const { data: vaults, isLoading, error } = useVaults();

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans selection:bg-indigo-100 overflow-x-hidden text-black">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-indigo-600 origin-left z-[200]" style={{ scaleX }} />
      <Header />
  
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-20 opacity-40">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-100 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-100 blur-[120px] rounded-full" />
      </div>
     
      <main className="relative z-10 pt-44 pb-32 px-6">
        {isLoading ? (
          <div className="flex h-[60vh] items-center justify-center">
             <Loader className="w-12 h-12 animate-spin text-indigo-600" />
          </div>
        ) : (
          <VaultsClient initialVaults={vaults || []} />
        )}
      </main>
    </div>
  );
}

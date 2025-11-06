// src/components/GlassModal/GlassmorphicCard.tsx
import React from 'react';

export function GlassmorphicCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        relative p-8 md:p-12 lg:p-16
        backdrop-blur-2xl
        bg-white/10
        border border-white/20
        rounded-3xl
        shadow-2xl
        overflow-hidden
        before:absolute before:inset-0
        before:bg-gradient-to-br before:from-white/20 before:to-transparent
        before:pointer-events-none
        hover:bg-white/15
        transition-all duration-500
      "
    >
      {/* Inner glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600 rounded-full filter blur-3xl opacity-20" />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
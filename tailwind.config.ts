import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        nyra: {
          void: "#0A0414",
          deep: "#120826",
          core: "#1E0F3D",
          mid: "#2D1660",
          primary: "#6B2FA0",
          vivid: "#8B45C8",
          light: "#A85FE0",
          glow: "#C77DFF",
          accent: "#E0AAFF",
          white: "#F5F0FF",
          silver: "#C0B8D6",
          muted: "#7A6B94",
          success: "#00E676",
          warning: "#FFD740",
          danger: "#FF5252",
        },
      },
      fontFamily: {
        head: ["Syne", "sans-serif"],
        body: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;

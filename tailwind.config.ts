import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // THIS IS THE CRITICAL FIX
      fontFamily: {
        // This tells Tailwind: "When you see the 'font-sans' class,
        // apply the CSS variable '--font-montserrat'".
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
      },
    },
  },
  plugins: [],
}
export default config
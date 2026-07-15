import type { Config } from "tailwindcss";

/**
 * Every value here traces back to DESIGN_SYSTEM.md at the repo root.
 * Components should reach for these tokens (bg-cloud, text-ink, etc.)
 * rather than raw Tailwind grays/blues, so the "one signature element,
 * quiet everywhere else" discipline is enforced by what's even available.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        indigo: {
          deep: "#3730A5",
          DEFAULT: "#3730A5",
          soft: "#EEEDFB",
        },
        ink: {
          slate: "#1B2036",
          DEFAULT: "#1B2036",
        },
        slate: {
          mid: "#64748B",
        },
        emerald: {
          route: "#0F9D6E",
          soft: "#E3F5EC",
        },
        amber: {
          signal: "#D97706",
          soft: "#FBF0DF",
        },
        ember: {
          red: "#DC2626",
          soft: "#FCEAEA",
        },
        cloud: "#F6F7FA",
        paper: "#FFFFFF",
        hairline: "#E4E7EC",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        display: ["48px", { lineHeight: "56px", fontWeight: "500" }],
        h1: ["32px", { lineHeight: "40px", fontWeight: "600" }],
        h2: ["24px", { lineHeight: "32px", fontWeight: "600" }],
        h3: ["18px", { lineHeight: "28px", fontWeight: "600" }],
        body: ["15px", { lineHeight: "24px", fontWeight: "400" }],
        caption: ["13px", { lineHeight: "20px", fontWeight: "500" }],
        data: ["13px", { lineHeight: "20px", fontWeight: "500" }],
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "6": "24px",
        "8": "32px",
        "12": "48px",
        "16": "64px",
      },
      borderRadius: {
        sm: "8px",
        md: "16px",
        lg: "24px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(27,32,54,0.04), 0 4px 12px rgba(27,32,54,0.06)",
        lifted: "0 4px 8px rgba(27,32,54,0.06), 0 12px 24px rgba(27,32,54,0.09)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

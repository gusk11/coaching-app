import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#0a0f1a",
        surface: "#0f1624",
        card: "#141d2e",
        "card-hover": "#192236",
        border: "#1e2d42",
        primary: "#1a3a5c",
        accent: "#3b82f6",
        "accent-light": "#60a5fa",
        "accent-dim": "#1d4ed8",
        muted: "#4b5e7a",
        "text-primary": "#f0f4ff",
        "text-secondary": "#8fa3c0",
        "text-dim": "#5a7090",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        "success-dim": "#064e3b",
        "warning-dim": "#451a03",
        "danger-dim": "#450a0a",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.4)",
        glow: "0 0 20px rgba(59,130,246,0.15)",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#080808",
        surface: "#0F0F0F",
        "surface-2": "#161616",
        soft: "#1f1f1f",
        muted: "#6b6b6b",
        "muted-soft": "#a8a39c",
        bone: "#F0EDE8",
        "bone-dim": "#c8c4be",
        gold: {
          DEFAULT: "#C6AB5C",
          bright: "#d9bf6f",
          deep: "#9c854a",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        ui: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        eyebrow: "0.32em",
        wordmark: "0.18em",
      },
    },
  },
  plugins: [],
};

export default config;

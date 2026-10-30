import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        y2k: {
          bg: "#090a10",
          panel: "#121420",
          pink: "#ec4899",
          cyan: "#22d3ee",
          lime: "#4ade80",
        },
      },
      fontFamily: {
        mono: ["'Space Mono'", "'Courier New'", "monospace"],
        pixel: ["'VT323'", "'Courier New'", "monospace"],
      },
      boxShadow: {
        "y2k-pink": "6px 6px 0px #ec4899",
        "y2k-cyan": "6px 6px 0px #22d3ee",
        "y2k-lime": "6px 6px 0px #4ade80",
        "y2k-sm-pink": "3px 3px 0px #ec4899",
        "y2k-sm-cyan": "3px 3px 0px #22d3ee",
        "y2k-sm-lime": "3px 3px 0px #4ade80",
      },
    },
  },
  plugins: [],
};

export default config;

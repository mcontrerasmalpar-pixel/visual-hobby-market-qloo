import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        market: {
          cocoa: "#4A3531",
          sky: "#E0F4FF",
          meadow: "#9AE6B4",
          butter: "#FEF08A",
          mint: "#D1FAE5",
        },
      },
      fontFamily: {
        display: ["'Fredoka'", "sans-serif"],
        hand: ["'Gaegu'", "cursive"],
        sans: ["'Quicksand'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

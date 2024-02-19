import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";
import prosePlugin from "@tailwindcss/typography";
import containerQueryPlugin from "@tailwindcss/container-queries";

const config = {
  darkMode: ["class"],
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: { sans: ["Inter, sans-serif"] },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [prosePlugin, containerQueryPlugin, animatePlugin],
} satisfies Config;

export default config;

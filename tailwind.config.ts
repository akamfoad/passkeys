import type { Config } from "tailwindcss";
import prosePlugin from "@tailwindcss/typography";
import containerQueryPlugin from "@tailwindcss/container-queries";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter, sans-serif"] },
    },
  },
  plugins: [prosePlugin, containerQueryPlugin],
} satisfies Config;

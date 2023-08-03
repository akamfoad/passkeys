import type { Config } from "tailwindcss";
import prosePlugin from "@tailwindcss/typography";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Roboto, sans-serif"] },
    },
  },
  plugins: [prosePlugin],
} satisfies Config;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef5ff",
          100: "#d8e8ff",
          700: "#0f3a73",
          800: "#0b2d5a",
          900: "#071f3f"
        }
      },
      fontFamily: {
        sans: ["Noto Sans TC", "Source Han Sans TC", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Noto Serif TC", "serif"],
        brand: ["Cinzel", "serif"]
      }
    }
  },
  plugins: []
};

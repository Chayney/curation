/** @type {import('tailwindcss').Config} */
// src/index.cssの:rootで色の設定
// hslを消せば ↑ の設定が適用

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "var(--foreground)",
        sidebar: "var(--sidebar)",
        "sidebar-foreground": "var(--sidebar-foreground)"
      },
    },
  },
  plugins: [],
}


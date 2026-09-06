import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--border-strong)",
        ring: "var(--accent)",
        background: "var(--bg)",
        foreground: "var(--text)",
        "foreground-soft": "var(--text-soft)",
        primary: { DEFAULT: "var(--text)", foreground: "#ffffff" },
        secondary: { DEFAULT: "var(--alt)", foreground: "var(--text)" },
        muted: { DEFAULT: "var(--alt)", foreground: "var(--muted)" },
        accent: { DEFAULT: "var(--alt)", foreground: "var(--text)" },
        destructive: { DEFAULT: "#b91c1c", foreground: "#ffffff" },
        card: { DEFAULT: "var(--bg)", foreground: "var(--text)" },
        popover: { DEFAULT: "var(--bg)", foreground: "var(--text)" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 3px)",
        sm: "calc(var(--radius) - 5px)",
      },
    },
  },
  plugins: [],
};
export default config;

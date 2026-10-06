import flattenColorPalette from "tailwindcss/lib/util/flattenColorPalette";

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "reds-900": "#06B6D4",
        "cyand-400": "#22d3ee",
        "slated-50": "#f8fafc",
        "slated-100": "#f1f5f9",
        "slated-200": "#e2e8f0",
        "slated-300": "#cbd5e1",
        "slated-400": "#94a3b8",
        "slated-500": "#64748b",
        "slated-600": "#475569",
        "slated-700": "#334155",
        "slated-800": "#1e293b",
        "slated-900": "#0f172a",
        "slated-950": "#020617",
        "extreme-light-blue": "#B9C3DD52",
        "extreme-light-blue-2": "rgba(147, 175, 203, 0.395)",
        "extreme-light-blue-3": "rgba(147, 175, 203)",
        "neutral-grey-3": "#768692",
        "pastel-blue": "#4a9dae",
        "neutral-grey": "#B4BEC9",
        "dark-navy": "#001543",
        "dark-slate": "#3C4758",
        "neutral-950": "#0A0A0A",
        "neutral-700": "#4B4B4B",
        "neutral-500": "#808080",
        "neutral-300": "#D1D1D1",
        "neutral-200": "#E5E5E5",
        "purple-500": "#8B5CF6",
        "blue": "#3B82F6",
      },
      animation: {
        move: "move 5s linear infinite",
        scroll:
          "scroll var(--animation-duration,40s) var(--animation-direction,forwards) linear infinite",
      },
      keyframes: {
        move: {
          "0%": { transform: "translateX(-200px)" },
          "100%": { transform: "translateX(200px)" },
        },
        scroll: {
          to: { transform: "translate(calc(-50% - 0.5rem))" },
        },
      },
    },
  },
  plugins: [
    ({ addBase, theme }) => {
      let allColors = flattenColorPalette(theme("colors"));
      let newVars = Object.fromEntries(
        Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
      );
      addBase({ ":root": newVars });
    },
  ],
};

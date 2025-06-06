import { createContext, useContext, useState } from "react";

export const themes = {
  default: "bg-extreme-light-blue",
  "Grey Fade": "bg-gradient-to-b from-neutral-grey3 to-white",
  "Slate Dots":
    "bg-[#B4BEC9] bg-[radial-gradient(#00091d33_1px,transparent_1px)] bg-[size:20px_20px]",
  bone: "bg-[#dddddd] bg-[size:20px_20px] opacity-100 shadow-[inset_0_0_100px_20px_rgba(104,151,187,0.6)]",
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState("default");

  return (
    <ThemeContext.Provider value={{ currentTheme, setCurrentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context == undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

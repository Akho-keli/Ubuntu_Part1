import React, { createContext, useContext, useEffect, useState } from "react";
import { getData, saveData, StorageKeys } from "../utils/storage";

const palettes = {
  light: {
    background: "#F8FAFC",
    card: "#FFFFFF",
    text: "#0F172A",
    subtext: "#64748B",
    primary: "#0B7A3B",
    accent: "#2563EB",
    border: "#E2E8F0",
    danger: "#DC2626",
  },
  dark: {
    background: "#0B1120",
    card: "#1E293B",
    text: "#F1F5F9",
    subtext: "#94A3B8",
    primary: "#22C55E",
    accent: "#60A5FA",
    border: "#334155",
    danger: "#F87171",
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("light");

  useEffect(() => {
    (async () => {
      const saved = await getData(StorageKeys.THEME);
      if (saved) setMode(saved);
    })();
  }, []);

  const toggleTheme = async () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    await saveData(StorageKeys.THEME, next);
  };

  return (
    <ThemeContext.Provider value={{ mode, colors: palettes[mode], toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

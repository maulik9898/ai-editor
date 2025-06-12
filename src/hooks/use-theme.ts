"use client";

import { useTheme as useNextTheme } from "next-themes";
import { useEffect, useState } from "react";

export type AppTheme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return {
      theme: "system" as AppTheme,
      setTheme,
      resolvedTheme: "dark" as ResolvedTheme,
      systemTheme: "dark" as ResolvedTheme,
      mounted: false,
      // Helper functions
      getMonacoTheme: () => "vs-dark" as const,
      getMantineColorScheme: () => "dark" as const,
      toggleTheme: () => {},
    };
  }

  const currentResolvedTheme = (resolvedTheme || "dark") as ResolvedTheme;

  // Helper to get Monaco Editor theme
  const getMonacoTheme = (): "vs-dark" | "light" => {
    return currentResolvedTheme === "dark" ? "vs-dark" : "light";
  };

  // Helper to get Mantine color scheme
  const getMantineColorScheme = (): "light" | "dark" => {
    return currentResolvedTheme;
  };

  // Helper to toggle theme
  const toggleTheme = () => {
    if (theme === "system") {
      // If currently system, switch to the opposite of system preference
      setTheme(systemTheme === "dark" ? "light" : "dark");
    } else {
      // If currently light/dark, toggle to the opposite
      setTheme(currentResolvedTheme === "dark" ? "light" : "dark");
    }
  };

  return {
    theme: (theme || "system") as AppTheme,
    setTheme,
    resolvedTheme: currentResolvedTheme,
    systemTheme: (systemTheme || "dark") as ResolvedTheme,
    mounted,
    // Helper functions
    getMonacoTheme,
    getMantineColorScheme,
    toggleTheme,
  };
}

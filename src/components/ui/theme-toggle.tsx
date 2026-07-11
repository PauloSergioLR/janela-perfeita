"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark = stored ? stored === "dark" : true;
    setIsDark(dark);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Alternar tema"
      title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      data-testid="theme-toggle"
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-soft bg-background/40 text-foreground shadow-inner shadow-white/5 backdrop-blur-sm transition hover:border-weather-accent/55 hover:bg-weather-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {isDark ? (
        <Sun className="size-4 text-amber-400" aria-hidden="true" />
      ) : (
        <Moon className="size-4 text-indigo-500" aria-hidden="true" />
      )}
    </button>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import { cx } from "@/components/ui";

type Theme = "system" | "light" | "dark";
const KEY = "mended-theme";
const listeners = new Set<() => void>();

function read(): Theme {
  try {
    const value = localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function write(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {
    // Storage unavailable; the choice applies to this visit only.
  }
  if (theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "system", label: "Automatic" },
  { value: "light", label: "Day" },
  { value: "dark", label: "Night" },
];

export function ThemePicker() {
  const theme = useSyncExternalStore(subscribe, read, () => "system" as Theme);
  return (
    <div role="radiogroup" aria-label="Appearance" className="grid grid-cols-3 gap-1 rounded-full bg-bg-deep p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={theme === option.value}
          onClick={() => write(option.value)}
          className={cx(
            "min-h-10 rounded-full text-[15px] font-semibold transition-colors",
            theme === option.value ? "bg-surface text-ink shadow-card" : "text-ink-soft hover:text-ink",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

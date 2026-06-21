"use client";

import { Check, type LucideIcon } from "lucide-react";
import { getSearchModeIcon } from "@/lib/ui/icon-system";
import { cn } from "@/lib/utils";
import type { SearchMode } from "@/types";

export interface ModeSelectorOption {
  id: SearchMode;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface ModeSelectorProps {
  options: ModeSelectorOption[];
  value: SearchMode;
  onChange: (mode: SearchMode) => void;
}

export function ModeSelector({
  options,
  value,
  onChange,
}: ModeSelectorProps) {
  return (
    <section
      className="glass-card rounded-xl p-3 sm:p-4"
      aria-labelledby="modo-label"
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(180px,0.28fr)_minmax(0,1fr)] lg:items-center">
        <div className="space-y-1">
          <p id="modo-label" className="text-sm font-medium text-foreground">
            Modo
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            Cidade, data, atividade e previsão no mesmo painel.
          </p>
        </div>
        <div
          className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
          role="radiogroup"
          aria-labelledby="modo-label"
        >
          {options.map((mode) => {
            const Icon = getSearchModeIcon(mode.id);
            const selected = value === mode.id;

            return (
              <button
                key={mode.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={cn(
                  "group relative min-h-20 rounded-lg border border-soft bg-background/45 p-3 text-left transition hover:-translate-y-0.5 hover:border-weather-accent/60 hover:bg-weather-card focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                  selected
                    ? "border-weather-accent/80 bg-weather-card text-foreground shadow-weather-glow"
                    : "",
                )}
                onClick={() => onChange(mode.id)}
              >
                <span className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-md bg-weather-muted/55 transition-colors",
                      selected && "bg-weather-accent/20",
                    )}
                  >
                    <Icon
                      className="size-4 text-weather-accent"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{mode.label}</span>
                    <span className="block text-xs leading-5 text-muted-foreground">
                      {mode.description}
                    </span>
                  </span>
                </span>
                {selected ? (
                  <Check
                    className="absolute top-3 right-3 size-3.5 text-weather-accent"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

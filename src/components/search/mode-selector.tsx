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
      className="glass-card rounded-xl p-2"
      aria-label="ModeBar"
      aria-labelledby="modo-label"
    >
      <div className="grid gap-2 lg:grid-cols-[minmax(104px,0.12fr)_minmax(0,1fr)] lg:items-center">
        <div className="space-y-0.5">
          <p id="modo-label" className="text-sm font-medium text-foreground">
            Modo
          </p>
          <p className="hidden text-xs leading-5 text-muted-foreground 2xl:block">
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
                  "group relative min-h-12 rounded-lg border border-soft bg-background/45 p-1.5 text-left transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98] motion-reduce:transition-none hover:border-weather-accent/60 hover:bg-weather-card focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                  selected
                    ? "border-weather-accent/80 bg-weather-card text-foreground shadow-weather-glow motion-safe:scale-[1.01]"
                    : "",
                )}
                onClick={() => onChange(mode.id)}
              >
                <span className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-md bg-weather-muted/55 transition-[background-color,transform] duration-200 motion-reduce:transition-none",
                      selected && "bg-weather-accent/20 motion-safe:scale-105",
                    )}
                  >
                    <Icon
                      className="size-3.5 text-weather-accent"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{mode.label}</span>
                    <span className="hidden text-xs leading-5 text-muted-foreground xl:block">
                      {mode.description}
                    </span>
                  </span>
                </span>
                {selected ? (
                  <Check
                    className="motion-selection-check absolute top-3 right-3 size-3.5 text-weather-accent"
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

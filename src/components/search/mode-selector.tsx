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
      className="glass-panel rounded-xl p-2 sm:p-3 xl:shrink-0 xl:p-1.5"
      aria-labelledby="modo-label"
      data-testid="mode-navigation"
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(180px,0.28fr)_minmax(0,1fr)] lg:items-center xl:block">
        <div className="space-y-1 xl:sr-only">
          <p id="modo-label" className="text-sm font-medium text-foreground">
            Modo
          </p>
          <p className="text-xs leading-5 text-muted-foreground xl:hidden">
            Cidade, data, atividade e previsão no mesmo painel.
          </p>
        </div>
        <div
          className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4"
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
                  "group relative min-h-20 rounded-lg border border-soft bg-background/25 p-3 text-left shadow-inner shadow-white/5 transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98] motion-reduce:transition-none hover:border-weather-accent/50 hover:bg-weather-card focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none xl:min-h-11 xl:p-1.5 2xl:min-h-14 2xl:p-2",
                  selected
                    ? "mode-active text-white shadow-weather-glow motion-safe:scale-[1.01]"
                    : "",
                )}
                onClick={() => onChange(mode.id)}
              >
                <span className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-md border border-soft bg-weather-muted/45 transition-[background-color,transform,border-color] duration-200 motion-reduce:transition-none xl:size-7 2xl:size-8",
                      selected &&
                        "border-white/35 bg-white/12 motion-safe:scale-105",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 text-weather-accent",
                        selected && "text-weather-cyan",
                      )}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{mode.label}</span>
                    <span className={cn(
                      "block text-xs leading-5 text-muted-foreground xl:hidden",
                      selected && "text-white/75",
                    )}>
                      {mode.description}
                    </span>
                  </span>
                </span>
                {selected ? (
                  <Check
                    className="motion-selection-check absolute top-3 right-3 size-3.5 text-weather-cyan"
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

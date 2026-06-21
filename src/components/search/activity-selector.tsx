"use client";

import { Check } from "lucide-react";
import { getActivityIcon } from "@/lib/ui/icon-system";
import { cn } from "@/lib/utils";
import type { Activity, ActivityId } from "@/types";

type ActivityVisual = {
  iconClassName: string;
  selectedClassName: string;
};

const ACTIVITY_VISUALS = {
  correr: {
    iconClassName: "text-emerald-400",
    selectedClassName:
      "border-emerald-400/70 bg-emerald-400/10 text-emerald-50 shadow-[0_0_30px_oklch(0.72_0.15_155_/_22%)]",
  },
  caminhar: {
    iconClassName: "text-sky-400",
    selectedClassName:
      "border-sky-400/70 bg-sky-400/10 text-sky-50 shadow-[0_0_30px_oklch(0.72_0.13_220_/_22%)]",
  },
  pedalar: {
    iconClassName: "text-cyan-400",
    selectedClassName:
      "border-cyan-400/70 bg-cyan-400/10 text-cyan-50 shadow-[0_0_30px_oklch(0.75_0.12_205_/_22%)]",
  },
  fotografar_por_do_sol: {
    iconClassName: "text-amber-400",
    selectedClassName:
      "border-amber-400/70 bg-amber-400/10 text-amber-50 shadow-[0_0_30px_oklch(0.82_0.15_78_/_22%)]",
  },
  observar_estrelas: {
    iconClassName: "text-violet-400",
    selectedClassName:
      "border-violet-400/70 bg-violet-400/10 text-violet-50 shadow-[0_0_30px_oklch(0.7_0.15_295_/_22%)]",
  },
  lavar_carro: {
    iconClassName: "text-rose-400",
    selectedClassName:
      "border-rose-400/70 bg-rose-400/10 text-rose-50 shadow-[0_0_30px_oklch(0.7_0.16_15_/_22%)]",
  },
  lavar_roupa: {
    iconClassName: "text-fuchsia-400",
    selectedClassName:
      "border-fuchsia-400/70 bg-fuchsia-400/10 text-fuchsia-50 shadow-[0_0_30px_oklch(0.7_0.16_335_/_22%)]",
  },
} satisfies Record<ActivityId, ActivityVisual>;

interface ActivitySelectorProps {
  activities: Activity[];
  value: ActivityId | "";
  onChange: (activityId: ActivityId) => void;
  disabled?: boolean;
}

export function ActivitySelector({
  activities,
  value,
  onChange,
  disabled = false,
}: ActivitySelectorProps) {
  return (
    <div
      className="grid gap-2 sm:grid-cols-2"
      role="radiogroup"
      aria-labelledby="atividade-label"
    >
      {activities.map((activity) => {
        const visual = ACTIVITY_VISUALS[activity.id];
        const Icon = getActivityIcon(activity.id);
        const selected = value === activity.id;

        return (
          <button
            key={activity.id}
            type="button"
            className={cn(
              "group relative min-h-30 rounded-lg border border-soft bg-background/40 p-3 text-left transition hover:-translate-y-0.5 hover:border-weather-accent/60 hover:bg-weather-card focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45",
              selected ? visual.selectedClassName : "",
            )}
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(activity.id)}
          >
            <span className="flex items-start gap-3">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-md bg-weather-muted/60 transition-colors group-hover:bg-weather-card",
                  selected && "bg-background/25",
                )}
              >
                <Icon
                  className={cn("size-5", visual.iconClassName)}
                  aria-hidden="true"
                />
              </span>
              <span className="min-w-0 space-y-1">
                <span className="block font-medium">{activity.name}</span>
                <span className="line-clamp-2 block text-xs leading-5 text-muted-foreground">
                  {activity.shortDescription}
                </span>
              </span>
            </span>
            {selected ? (
              <Check
                className="absolute top-3 right-3 size-3.5 text-current"
                aria-hidden="true"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

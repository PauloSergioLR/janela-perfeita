import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ControlPanelSectionProps {
  number: string;
  title: string;
  description?: string;
  className?: string;
  compact?: boolean;
  children: ReactNode;
}

export function ControlPanelSection({
  number,
  title,
  description,
  className,
  compact = false,
  children,
}: ControlPanelSectionProps) {
  return (
    <section
      className={cn(
        "space-y-2 border-t border-soft pt-4 first:border-t-0 first:pt-0 xl:space-y-1.5 xl:pt-2",
        compact && "xl:space-y-1 xl:pt-1.5",
        className,
      )}
    >
      <div className={cn("flex items-start gap-2", compact && "xl:items-center")}>
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md border border-weather-accent/45 bg-weather-accent/10 text-xs font-semibold text-weather-accent shadow-inner shadow-white/10",
            compact && "xl:size-5 xl:text-[10px]",
          )}
        >
          {number}
        </span>
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="text-xs leading-4 text-muted-foreground xl:hidden">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

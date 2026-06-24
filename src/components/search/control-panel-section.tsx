import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ControlPanelSectionProps {
  number: string;
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}

export function ControlPanelSection({
  number,
  title,
  description,
  className,
  children,
}: ControlPanelSectionProps) {
  return (
    <section
      className={cn(
        "space-y-2.5 border-t border-soft pt-3 first:border-t-0 first:pt-0",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-weather-accent/45 bg-weather-accent/10 text-xs font-semibold text-weather-accent">
          {number}
        </span>
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-sm font-semibold leading-tight text-foreground">{title}</h2>
          {description ? (
            <p className="text-xs leading-snug text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

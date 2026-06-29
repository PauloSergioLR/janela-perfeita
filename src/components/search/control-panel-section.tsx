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
        "space-y-3 border-t border-soft pt-5 first:border-t-0 first:pt-0 xl:space-y-2 xl:pt-3",
        className,
      )}
    >
      <div className="flex items-start gap-3 xl:gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-weather-accent/45 bg-weather-accent/10 text-xs font-semibold text-weather-accent xl:size-6">
          {number}
        </span>
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="text-xs leading-5 text-muted-foreground xl:leading-4">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

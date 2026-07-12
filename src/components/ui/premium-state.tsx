import {
  AlertCircle,
  Loader2,
  RefreshCw,
  SearchX,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PremiumStateVariant = "empty" | "error" | "initial" | "loading";

interface PremiumStateProps {
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  compact?: boolean;
  description: ReactNode;
  eyebrow: string;
  title: string;
  variant: PremiumStateVariant;
}

const stateStyles: Record<
  PremiumStateVariant,
  {
    icon: LucideIcon;
    iconClassName: string;
    panelClassName: string;
  }
> = {
  initial: {
    icon: Sparkles,
    iconClassName: "border-weather-accent/45 bg-weather-accent/12 text-weather-accent",
    panelClassName:
      "border-weather-accent/25 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--weather-accent)_13%,transparent),transparent_58%)]",
  },
  loading: {
    icon: Loader2,
    iconClassName: "border-sky-400/35 bg-sky-400/12 text-sky-700 dark:text-sky-200",
    panelClassName:
      "border-sky-400/30 bg-[linear-gradient(135deg,oklch(0.72_0.13_220_/_12%),transparent_58%)]",
  },
  error: {
    icon: AlertCircle,
    iconClassName: "border-danger/40 bg-danger/12 text-danger",
    panelClassName:
      "border-danger/35 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--danger)_14%,transparent),transparent_58%)]",
  },
  empty: {
    icon: SearchX,
    iconClassName: "border-warning/45 bg-warning/12 text-warning",
    panelClassName:
      "border-warning/35 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--warning)_14%,transparent),transparent_58%)]",
  },
};

export function PremiumState({
  action,
  className,
  compact = false,
  description,
  eyebrow,
  title,
  variant,
}: PremiumStateProps) {
  const state = stateStyles[variant];
  const Icon = state.icon;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border shadow-weather-soft",
        compact ? "p-3" : "min-h-64 p-5 sm:p-6",
        state.panelClassName,
        className,
      )}
      role={variant === "error" ? "alert" : "status"}
    >
      <div
        aria-hidden="true"
        className="absolute -right-16 -bottom-20 size-48 rounded-full bg-current/10 blur-3xl"
      />
      <div
        className={cn(
          "relative flex gap-3",
          compact ? "items-start" : "min-h-52 flex-col justify-center sm:flex-row sm:items-center",
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl border shadow-weather-glow",
            compact ? "size-9" : "size-12",
            state.iconClassName,
          )}
        >
          <Icon
            className={cn(
              compact ? "size-4" : "size-5",
              variant === "loading" && "animate-spin motion-reduce:animate-none",
            )}
            aria-hidden="true"
          />
        </span>
        <div className={cn("min-w-0", compact ? "space-y-1" : "max-w-xl space-y-2")}>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <h3 className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-lg")}>
            {title}
          </h3>
          <div className={cn("leading-6 text-muted-foreground", compact ? "text-xs" : "text-sm")}>
            {description}
          </div>

          {variant === "loading" ? (
            <div aria-hidden="true" className="grid max-w-md gap-2 pt-2">
              <span className="h-2.5 animate-pulse rounded-full bg-sky-400/18 motion-reduce:animate-none" />
              <span className="h-2.5 w-4/5 animate-pulse rounded-full bg-sky-400/18 [animation-delay:150ms] motion-reduce:animate-none" />
              <span className="h-2.5 w-3/5 animate-pulse rounded-full bg-sky-400/18 [animation-delay:300ms] motion-reduce:animate-none" />
            </div>
          ) : null}

          {action ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 h-9 border-glass bg-background/45"
              onClick={action.onClick}
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              {action.label}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

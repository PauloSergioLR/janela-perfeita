import { cn } from "@/lib/utils";
import type { WeatherStageVariant } from "@/lib/ui/weather-stage";

interface WeatherStageProps {
  variant: WeatherStageVariant;
  className?: string;
}

export function WeatherStage({ variant, className }: WeatherStageProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("weather-stage", className)}
      data-variant={variant}
    />
  );
}

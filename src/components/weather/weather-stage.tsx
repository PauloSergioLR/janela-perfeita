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
    >
      <span className="weather-stage__stars" />
      <span className="weather-stage__cloud weather-stage__cloud--left" />
      <span className="weather-stage__cloud weather-stage__cloud--right" />
      <span className="weather-stage__horizon" />
      <span className="weather-stage__veil" />
    </div>
  );
}

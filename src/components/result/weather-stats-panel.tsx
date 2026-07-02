import { getWeatherIcon, getWeatherMetricIcon } from "@/lib/ui/icon-system";
import { getWeatherStats } from "@/lib/ui/weather-stats";
import { cn } from "@/lib/utils";
import type { HourlyWeather } from "@/types";

interface WeatherStatsPanelProps {
  weather: HourlyWeather | null;
  sunrise?: string | null;
  sunset?: string | null;
  variant?: "wide" | "compact";
  className?: string;
}

export function WeatherStatsPanel({
  weather,
  sunrise,
  sunset,
  variant = "wide",
  className,
}: WeatherStatsPanelProps) {
  const stats = getWeatherStats({ weather, sunrise, sunset });
  const HeaderIcon = getWeatherIcon(null);
  const isCompact = variant === "compact";

  return (
    <section
      className={cn("space-y-3", isCompact && "space-y-2", className)}
      aria-label="Estatísticas climáticas"
    >
      <div className="flex items-center gap-2">
        <HeaderIcon className="size-4 text-weather-accent" aria-hidden="true" />
        <h3 className="text-sm font-medium text-slate-950 dark:text-slate-50">
          Estatísticas climáticas
        </h3>
      </div>
      <dl
        className={cn(
          "grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-soft bg-border",
          isCompact ? "sm:grid-cols-2" : "sm:grid-cols-3 lg:grid-cols-5",
        )}
      >
        {stats.map((stat) => {
          const Icon = getWeatherMetricIcon(stat.id);

          return (
            <div
              key={stat.id}
              className={cn(
                "bg-weather-card/80 dark:bg-weather-card/55",
                isCompact ? "min-h-9 p-1.5" : "min-h-24 p-3",
              )}
            >
              <dt
                className={cn(
                  "flex items-center gap-2 font-medium text-muted-foreground",
                  isCompact ? "text-[10px] leading-3" : "text-xs",
                )}
              >
                <Icon
                  className="size-3.5 text-weather-accent"
                  aria-hidden="true"
                />
                {stat.label}
              </dt>
              <dd
                className={cn(
                  "font-semibold text-slate-950 dark:text-slate-50",
                  isCompact ? "mt-0.5 text-xs 2xl:text-sm" : "mt-3 text-lg",
                )}
              >
                {stat.value}
              </dd>
              {stat.detail && !isCompact ? (
                <p
                  className={cn(
                    "text-muted-foreground",
                    "mt-1 text-xs",
                  )}
                >
                  {stat.detail}
                </p>
              ) : null}
              {stat.detail && isCompact ? (
                <span className="sr-only">{stat.detail}</span>
              ) : null}
            </div>
          );
        })}
      </dl>
    </section>
  );
}

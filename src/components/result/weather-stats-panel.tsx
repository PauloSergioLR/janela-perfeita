import { getWeatherIcon, getWeatherMetricIcon } from "@/lib/ui/icon-system";
import {
  getCompactWeatherStats,
  type WeatherStatId,
} from "@/lib/ui/weather-stats";
import { cn } from "@/lib/utils";
import type { HourlyWeather } from "@/types";

interface WeatherStatsPanelProps {
  weather: HourlyWeather | null;
  sunrise?: string | null;
  sunset?: string | null;
  variant?: "wide" | "compact";
  className?: string;
}

const statToneClasses = {
  temperature: "text-rose-400",
  "apparent-temperature": "text-rose-300",
  precipitation: "text-sky-400",
  wind: "text-cyan-300",
  gusts: "text-cyan-200",
  humidity: "text-teal-300",
  uv: "text-amber-300",
  "cloud-cover": "text-slate-300",
  sunrise: "text-yellow-300",
  sunset: "text-orange-300",
} satisfies Record<WeatherStatId, string>;

export function WeatherStatsPanel({
  weather,
  sunrise,
  sunset,
  variant = "wide",
  className,
}: WeatherStatsPanelProps) {
  const stats = getCompactWeatherStats({ weather, sunrise, sunset });
  const HeaderIcon = getWeatherIcon(null);
  const isCompact = variant === "compact";

  return (
    <section
      className={cn("min-w-0 space-y-3", isCompact && "space-y-1.5", className)}
      aria-label="Estatísticas climáticas"
    >
      <div className="flex min-w-0 items-center gap-2">
        <HeaderIcon
          className="size-4 shrink-0 text-weather-accent"
          aria-hidden="true"
        />
        <h3 className="truncate text-sm font-medium text-slate-950 dark:text-slate-50">
          Estatísticas climáticas
        </h3>
      </div>
      <dl
        className={cn(
          "grid min-w-0 grid-cols-2 gap-px overflow-hidden rounded-lg border border-soft bg-border/60 shadow-inner shadow-white/5",
          isCompact ? "xl:grid-cols-2" : "sm:grid-cols-3",
        )}
      >
        {stats.map((stat) => {
          const Icon = getWeatherMetricIcon(stat.id);

          return (
            <div
              key={stat.id}
              className={cn(
                "min-w-0 bg-weather-card/70 shadow-inner shadow-white/5 dark:bg-weather-card/50",
                isCompact
                  ? "min-h-12 p-1.5 xl:min-h-[31px] xl:p-1.5 2xl:min-h-12 2xl:p-2"
                  : "min-h-24 p-3",
              )}
            >
              <dt
                className={cn(
                  "flex min-w-0 items-center gap-1.5 font-medium text-muted-foreground",
                  isCompact ? "text-[10px] leading-3" : "text-xs",
                )}
              >
                <Icon
                  className={cn(
                    "size-3.5 shrink-0",
                    statToneClasses[stat.id],
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{stat.label}</span>
              </dt>
              <dd
                title={stat.value}
                className={cn(
                  "min-w-0 truncate font-semibold tabular-nums text-slate-950 dark:text-slate-50",
                  isCompact
                    ? "mt-0.5 text-[11px] leading-3 xl:text-[11px] 2xl:text-sm 2xl:leading-4"
                    : "mt-3 text-lg",
                )}
              >
                {stat.value}
              </dd>
              {stat.detail ? (
                <p
                  className={cn(
                    "mt-0.5 line-clamp-1 min-w-0 text-muted-foreground",
                    isCompact
                      ? "text-[9px] leading-3 xl:sr-only 2xl:not-sr-only"
                      : "text-xs",
                  )}
                  title={stat.detail}
                >
                  {stat.detail}
                </p>
              ) : null}
            </div>
          );
        })}
      </dl>
    </section>
  );
}

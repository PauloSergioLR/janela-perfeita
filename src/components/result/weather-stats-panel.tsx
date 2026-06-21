import { getWeatherIcon, getWeatherMetricIcon } from "@/lib/ui/icon-system";
import {
  getWeatherStats,
} from "@/lib/ui/weather-stats";
import type { HourlyWeather } from "@/types";

interface WeatherStatsPanelProps {
  weather: HourlyWeather | null;
  sunrise?: string | null;
  sunset?: string | null;
}

export function WeatherStatsPanel({
  weather,
  sunrise,
  sunset,
}: WeatherStatsPanelProps) {
  const stats = getWeatherStats({ weather, sunrise, sunset });
  const HeaderIcon = getWeatherIcon(null);

  return (
    <section className="space-y-3" aria-label="Estatísticas climáticas">
      <div className="flex items-center gap-2">
        <HeaderIcon className="size-4 text-weather-accent" aria-hidden="true" />
        <h3 className="text-sm font-medium text-slate-950 dark:text-slate-50">
          Estatísticas climáticas
        </h3>
      </div>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-soft bg-border sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = getWeatherMetricIcon(stat.id);

          return (
            <div
              key={stat.id}
              className="min-h-24 bg-weather-card/80 p-3 dark:bg-weather-card/55"
            >
              <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Icon className="size-3.5 text-weather-accent" aria-hidden="true" />
                {stat.label}
              </dt>
              <dd className="mt-3 text-lg font-semibold text-slate-950 dark:text-slate-50">
                {stat.value}
              </dd>
              {stat.detail ? (
                <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
              ) : null}
            </div>
          );
        })}
      </dl>
    </section>
  );
}

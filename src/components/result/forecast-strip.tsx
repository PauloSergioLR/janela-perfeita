import { CalendarDays } from "lucide-react";
import {
  formatForecastDate,
  formatForecastDayLabel,
  formatTemperatureRange,
  getForecastClassification,
  getForecastShortSummary,
  type ForecastClassificationTone,
} from "@/lib/ui/forecast-strip";
import { getWeatherIcon, getWeatherMetricIcon } from "@/lib/ui/icon-system";
import { formatCityLabel } from "@/lib/ui/search-page";
import { cn } from "@/lib/utils";
import type { WeeklyWeatherOverview } from "@/types";

interface ForecastStripProps {
  overview: WeeklyWeatherOverview;
}

const classificationClasses: Record<ForecastClassificationTone, string> = {
  excellent: "border-success/45 bg-success/10 text-success",
  good: "border-weather-accent/45 bg-weather-accent/10 text-weather-accent",
  regular: "border-warning/45 bg-warning/10 text-warning",
  rain: "border-danger/45 bg-danger/10 text-danger",
};

const TemperatureIcon = getWeatherMetricIcon("temperature");

export function ForecastStrip({ overview }: ForecastStripProps) {
  const todayDate = new Date().toISOString().slice(0, 10);

  if (overview.days.length === 0) {
    return null;
  }

  return (
    <section
      className="glass-panel space-y-2 rounded-xl p-3"
      aria-label="Previsão dos próximos dias"
    >
      <div className="flex items-center gap-2">
        <CalendarDays className="size-4 text-weather-accent" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-medium text-slate-950 dark:text-slate-50">
            Próximos dias
          </h2>
          <p className="text-xs text-muted-foreground">
            {formatCityLabel(overview.city)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-1 lg:overflow-visible">
        <div className="flex min-w-max gap-2 lg:grid lg:min-w-0 lg:grid-cols-7">
          {overview.days.map((day) => {
            const WeatherIcon = getWeatherIcon(day.weatherCode);
            const classification = getForecastClassification(day);

            return (
              <article
                key={day.date}
                className="flex w-36 shrink-0 flex-col gap-1.5 rounded-lg border border-soft bg-weather-card/75 p-2.5 lg:w-auto"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold capitalize text-slate-950 dark:text-slate-50">
                      {formatForecastDayLabel(day.date, todayDate)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatForecastDate(day.date)}
                    </p>
                  </div>
                  <WeatherIcon
                    className="size-4 shrink-0 text-weather-accent"
                    aria-hidden="true"
                  />
                </div>

                <p className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                  {formatTemperatureRange(day.temperatureMin, day.temperatureMax)}
                </p>

                <span
                  className={cn(
                    "inline-flex w-fit rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                    classificationClasses[classification.tone],
                  )}
                >
                  {classification.label}
                </span>

                <p className="line-clamp-1 text-[10px] leading-4 text-muted-foreground">
                  {getForecastShortSummary(day.summary, day.weatherLabel)}
                </p>

                <p className="mt-auto flex items-center gap-1 text-[10px] text-muted-foreground">
                  <TemperatureIcon className="size-3 text-weather-accent" aria-hidden="true" />
                  {day.weatherLabel}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

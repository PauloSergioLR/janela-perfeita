import { CalendarDays, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDailyClimateSummary } from "@/lib/ui/daily-overview";
import { getWeatherIcon, getWeatherMetricIcon } from "@/lib/ui/icon-system";
import { formatRecommendationDate } from "@/lib/ui/recommendation-result";
import { formatCityLabel } from "@/lib/ui/search-page";
import { cn } from "@/lib/utils";
import type { DailyWeatherOverview, HourlyWeather } from "@/types";

interface DailyOverviewCardProps {
  overview: DailyWeatherOverview;
}

function formatValue(value: number | null, suffix: string): string {
  return value === null ? "Sem dados" : `${Math.round(value)}${suffix}`;
}

function formatDecimal(value: number | null, suffix: string): string {
  return value === null ? "Sem dados" : `${value.toFixed(1)}${suffix}`;
}

function formatHour(time: string): string {
  return time.slice(11, 16);
}

function getHourlyRainRisk(weather: HourlyWeather): string {
  const precipitation = Math.max(
    weather.precipitation,
    weather.rain,
    weather.showers,
  );

  return precipitation > 0
    ? `${precipitation.toFixed(1)} mm`
    : `${weather.precipitation_probability}%`;
}

export function DailyOverviewCard({ overview }: DailyOverviewCardProps) {
  const WeatherIcon = getWeatherIcon(overview.weatherCode);
  const TemperatureIcon = getWeatherMetricIcon("temperature");
  const RainIcon = getWeatherMetricIcon("precipitation");
  const WindIcon = getWeatherMetricIcon("wind");
  const HumidityIcon = getWeatherMetricIcon("humidity");
  const UvIcon = getWeatherMetricIcon("uv");
  const SunIcon = getWeatherMetricIcon("sunrise");
  const climateSummary = getDailyClimateSummary(overview.hourly);
  const hasHourlyData = overview.hourly.length > 0;
  const metrics = [
    {
      label: "Temperatura",
      value: `${formatValue(overview.temperatureMin, "°C")} / ${formatValue(overview.temperatureMax, "°C")}`,
      detail: `Sensação ${formatValue(overview.apparentTemperatureMin, "°C")} / ${formatValue(overview.apparentTemperatureMax, "°C")}`,
      icon: TemperatureIcon,
      tone: "text-rose-400",
    },
    {
      label: "Chuva",
      value: formatDecimal(overview.precipitationSum, " mm"),
      detail: `Risco máx. ${formatValue(overview.precipitationProbabilityMax, "%")}`,
      icon: RainIcon,
      tone: "text-sky-500",
    },
    {
      label: "Vento",
      value: formatValue(overview.windSpeedMax, " km/h"),
      detail: `Rajadas ${formatValue(overview.windGustsMax, " km/h")}`,
      icon: WindIcon,
      tone: "text-cyan-500",
    },
    {
      label: "Umidade",
      value: formatValue(climateSummary.averageHumidity, "%"),
      detail: "Média do dia",
      icon: HumidityIcon,
      tone: "text-teal-500",
    },
    {
      label: "UV",
      value: formatValue(overview.uvIndexMax, ""),
      detail: "Máximo previsto",
      icon: UvIcon,
      tone: "text-warning",
    },
    {
      label: "Sol",
      value:
        climateSummary.sunshineHours === null
          ? "Sem dados"
          : `${climateSummary.sunshineHours}h`,
      detail: `${formatHour(overview.sunrise)} → ${formatHour(overview.sunset)}`,
      icon: SunIcon,
      tone: "text-amber-400",
    },
  ];

  return (
    <Card
      size="sm"
      className="glass-card min-w-0 rounded-xl !py-0 xl:h-full xl:min-h-0"
    >
      <CardHeader className="gap-3 border-b border-soft bg-weather-card p-3 sm:p-4 xl:gap-2 xl:px-3 xl:!py-2 xl:!pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-weather-accent">Clima por decisão</p>
            <CardTitle className="mt-1 text-slate-50">Consulta do dia</CardTitle>
            <CardDescription className="line-clamp-1">
              {formatCityLabel(overview.city)} · {formatRecommendationDate(overview.date)}
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
            <Badge
              variant="outline"
              className="h-8 w-fit border-weather-accent/50 bg-weather-accent/10 px-3 text-weather-accent"
            >
              <WeatherIcon className="size-4" aria-hidden="true" />
              {overview.weatherLabel}
            </Badge>
            <p className="hidden text-xl font-semibold text-slate-50 xl:block">
              {formatValue(overview.temperatureMin, "°C")} /{" "}
              {formatValue(overview.temperatureMax, "°C")}
            </p>
          </div>
        </div>

        <div className="grid gap-3 border-t border-soft pt-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center xl:hidden">
          <div className="grid size-14 place-items-center rounded-lg border border-weather-accent/40 bg-weather-accent/10 text-weather-accent xl:size-12">
            <WeatherIcon className="size-7 xl:size-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Condição principal</p>
            <p className="mt-1 truncate text-lg font-semibold text-slate-50">
              {overview.weatherLabel}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:justify-self-end">
            <TemperatureIcon className="size-5 text-rose-400" aria-hidden="true" />
            <p className="text-xl font-semibold text-slate-50 xl:text-2xl">
              {formatValue(overview.temperatureMin, "°C")} / {formatValue(overview.temperatureMax, "°C")}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid min-h-0 gap-3 p-3 sm:p-4 xl:flex-1 xl:grid-rows-[auto_minmax(0,1fr)_auto] xl:overflow-y-auto xl:p-3">
        <div className="grid min-w-0 gap-px overflow-hidden rounded-lg border border-soft bg-border shadow-inner shadow-white/5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                key={metric.label}
                className="min-w-0 bg-weather-card/75 p-3 dark:bg-weather-card/45"
              >
                <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Icon
                    className={cn("size-4 shrink-0", metric.tone)}
                    aria-hidden="true"
                  />
                  <span className="truncate">{metric.label}</span>
                </div>
                <p
                  className="mt-2 min-w-0 truncate text-lg font-semibold tabular-nums text-slate-50 xl:text-sm 2xl:text-base"
                  title={metric.value}
                >
                  {metric.value}
                </p>
                <p
                  className="mt-1 line-clamp-1 min-w-0 text-[11px] leading-4 text-muted-foreground"
                  title={metric.detail}
                >
                  {metric.detail}
                </p>
              </div>
            );
          })}
        </div>

        <section className="grid min-h-0 gap-3" aria-label="Timeline horária">
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-weather-accent" aria-hidden="true" />
            <h3 className="text-sm font-medium text-slate-50">
              Timeline horária
            </h3>
          </div>

          {hasHourlyData ? (
            <div className="overflow-x-auto pb-1">
              <div
                className="flex min-w-max gap-2 xl:min-w-0"
                role="list"
              >
                {overview.hourly.map((weather) => {
                  const HourWeatherIcon = getWeatherIcon(weather.weather_code);

                  return (
                    <article
                      key={weather.time}
                      role="listitem"
                      className="grid w-24 shrink-0 gap-1 rounded-lg border border-soft bg-weather-card/70 p-2 text-center dark:bg-weather-card/45 xl:w-[calc((100%-5.5rem)/12)] xl:basis-[calc((100%-5.5rem)/12)] xl:gap-0.5 xl:p-1.5"
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatHour(weather.time)}
                      </span>
                      <HourWeatherIcon className="mx-auto size-5 text-weather-accent" aria-hidden="true" />
                      <span className="text-base font-semibold text-slate-50 xl:text-sm 2xl:text-base">
                        {Math.round(weather.temperature_2m)}°
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getHourlyRainRisk(weather)}
                      </span>
                      <span className="text-xs text-muted-foreground xl:hidden 2xl:block">
                        {Math.round(weather.wind_speed_10m)} km/h
                      </span>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="border-y border-soft py-4 text-sm text-muted-foreground">
              Sem dados horários para esta data.
            </div>
          )}
        </section>

        <div className="flex items-center gap-2 border-t border-soft pt-4 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5 text-weather-accent" aria-hidden="true" />
          Dados para {formatRecommendationDate(overview.date)}
        </div>
      </CardContent>
    </Card>
  );
}

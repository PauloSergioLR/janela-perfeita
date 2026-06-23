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
  const ApparentTemperatureIcon = getWeatherMetricIcon("apparent-temperature");
  const climateSummary = getDailyClimateSummary(overview.hourly);
  const hasHourlyData = overview.hourly.length > 0;
  const metrics = [
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
    {
      label: "Sensação",
      value: `${formatValue(overview.apparentTemperatureMin, "°C")} / ${formatValue(overview.apparentTemperatureMax, "°C")}`,
      detail: "Mínima / máxima",
      icon: ApparentTemperatureIcon,
      tone: "text-rose-400",
    },
  ];

  return (
    <Card className="glass-card overflow-hidden rounded-xl">
      <CardHeader className="gap-4 border-b border-soft bg-weather-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-weather-accent">Clima por decisão</p>
            <CardTitle className="mt-1">Consulta do dia</CardTitle>
            <CardDescription>
              {formatCityLabel(overview.city)} · {formatRecommendationDate(overview.date)}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="h-8 w-fit border-weather-accent/50 bg-weather-accent/10 px-3 text-weather-accent"
          >
            <WeatherIcon className="size-4" aria-hidden="true" />
            {overview.weatherLabel}
          </Badge>
        </div>

        <div className="grid gap-4 border-t border-soft pt-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
          <div className="grid size-16 place-items-center rounded-lg border border-weather-accent/40 bg-weather-accent/10 text-weather-accent">
            <WeatherIcon className="size-8" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Condição principal</p>
            <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-50">
              {overview.weatherLabel}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:justify-self-end">
            <TemperatureIcon className="size-5 text-rose-400" aria-hidden="true" />
            <p className="text-2xl font-semibold text-slate-950 dark:text-slate-50">
              {formatValue(overview.temperatureMin, "°C")} / {formatValue(overview.temperatureMax, "°C")}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-px overflow-hidden rounded-lg border border-soft bg-border sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div key={metric.label} className="min-h-28 bg-weather-card/70 p-4 dark:bg-weather-card/45">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Icon className={cn("size-4", metric.tone)} aria-hidden="true" />
                  {metric.label}
                </div>
                <p className="mt-3 text-xl font-semibold text-slate-950 dark:text-slate-50">
                  {metric.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
              </div>
            );
          })}
        </div>

        <section className="space-y-3" aria-label="Timeline horária">
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-weather-accent" aria-hidden="true" />
            <h3 className="text-sm font-medium text-slate-950 dark:text-slate-50">
              Timeline horária
            </h3>
          </div>

          {hasHourlyData ? (
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-max gap-2" role="list">
                {overview.hourly.map((weather) => {
                  const HourWeatherIcon = getWeatherIcon(weather.weather_code);

                  return (
                    <article
                      key={weather.time}
                      role="listitem"
                      className="grid w-24 shrink-0 gap-2 rounded-lg border border-soft bg-weather-card/70 p-3 text-center dark:bg-weather-card/45"
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatHour(weather.time)}
                      </span>
                      <HourWeatherIcon className="mx-auto size-5 text-weather-accent" aria-hidden="true" />
                      <span className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                        {Math.round(weather.temperature_2m)}°
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getHourlyRainRisk(weather)}
                      </span>
                      <span className="text-xs text-muted-foreground">
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

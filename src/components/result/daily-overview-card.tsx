import {
  CalendarDays,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Gauge,
  MapPin,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatRecommendationDate,
} from "@/lib/ui/recommendation-result";
import { formatCityLabel } from "@/lib/ui/search-page";
import type { DailyWeatherOverview, HourlyWeather } from "@/types";

interface DailyOverviewCardProps {
  overview: DailyWeatherOverview;
}

type WeatherIcon = typeof Sun;

function getWeatherIcon(code: number | null): WeatherIcon {
  if (code === null) {
    return Cloud;
  }

  if ([95, 96, 99].includes(code)) {
    return CloudLightning;
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return CloudSnow;
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return CloudRain;
  }

  if ([45, 48].includes(code)) {
    return CloudFog;
  }

  if (code === 0) {
    return Sun;
  }

  return CloudSun;
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

  if (precipitation > 0) {
    return `${precipitation.toFixed(1)} mm`;
  }

  return `${weather.precipitation_probability}%`;
}

export function DailyOverviewCard({ overview }: DailyOverviewCardProps) {
  const WeatherIcon = getWeatherIcon(overview.weatherCode);
  const hasHourlyData = overview.hourly.length > 0;

  return (
    <Card className="overflow-hidden rounded-lg border-border/80 bg-white shadow-sm dark:bg-card">
      <CardHeader className="gap-3 border-b border-slate-100 bg-slate-50/70 dark:border-border dark:bg-muted/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Consulta do dia</CardTitle>
            <CardDescription>
              {formatCityLabel(overview.city)}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="h-8 border-sky-200 bg-sky-50 px-3 text-sky-900 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-100"
          >
            <WeatherIcon className="size-4" aria-hidden="true" />
            {overview.weatherLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-border dark:bg-muted/20">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-300">
              <Thermometer className="size-4 text-rose-700" aria-hidden="true" />
              Temperatura
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
              {formatValue(overview.temperatureMin, "°C")} -{" "}
              {formatValue(overview.temperatureMax, "°C")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Sensação {formatValue(overview.apparentTemperatureMin, "°C")} -{" "}
              {formatValue(overview.apparentTemperatureMax, "°C")}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-border dark:bg-muted/20">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-300">
              <Droplets className="size-4 text-sky-700" aria-hidden="true" />
              Chuva
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
              {formatDecimal(overview.precipitationSum, " mm")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Risco máx. {formatValue(overview.precipitationProbabilityMax, "%")}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-border dark:bg-muted/20">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-300">
              <Wind className="size-4 text-cyan-700" aria-hidden="true" />
              Vento
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
              {formatValue(overview.windSpeedMax, " km/h")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Rajadas {formatValue(overview.windGustsMax, " km/h")}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-border dark:bg-muted/20">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-300">
              <Gauge className="size-4 text-amber-700" aria-hidden="true" />
              Índice UV
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
              {formatValue(overview.uvIndexMax, "")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Máximo previsto no dia
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-border dark:bg-muted/20">
            <CalendarDays className="size-4 text-sky-700" aria-hidden="true" />
            {formatRecommendationDate(overview.date)}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-border dark:bg-muted/20">
            <Sunrise className="size-4 text-amber-700" aria-hidden="true" />
            Nascer {formatHour(overview.sunrise)}
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-border dark:bg-muted/20">
            <Sunset className="size-4 text-rose-700" aria-hidden="true" />
            Pôr {formatHour(overview.sunset)}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-border dark:bg-muted/20">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-950 dark:text-slate-50">
            <MapPin className="size-4 text-sky-700" aria-hidden="true" />
            Timeline horária
          </div>
          {hasHourlyData ? (
            <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto pr-1">
              {overview.hourly.map((weather) => (
                <div
                  key={weather.time}
                  className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{formatHour(weather.time)}</span>
                  <span className="min-w-0 truncate text-muted-foreground">
                    {Math.round(weather.temperature_2m)}°C · chuva{" "}
                    {getHourlyRainRisk(weather)} · vento{" "}
                    {Math.round(weather.wind_speed_10m)} km/h
                  </span>
                  <Badge variant="outline" className="h-7 bg-background px-2">
                    {weather.weather_code}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Sem dados horários para esta data.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import {
  CalendarDays,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Flame,
  Snowflake,
  Sun,
  Thermometer,
  ThumbsDown,
  ThumbsUp,
  Wind,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCityLabel } from "@/lib/ui/search-page";
import type { WeeklyWeatherDayOverview, WeeklyWeatherOverview } from "@/types";

interface WeeklyOverviewCardProps {
  overview: WeeklyWeatherOverview;
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

function formatNumber(value: number | null, suffix: string): string {
  return value === null ? "Sem dados" : `${Math.round(value)}${suffix}`;
}

function formatDecimal(value: number | null, suffix: string): string {
  return value === null ? "Sem dados" : `${value.toFixed(1)}${suffix}`;
}

function formatWeekday(date: string): string {
  if (!date) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(
    new Date(`${date}T00:00:00`),
  );
}

function formatShortDate(date: string): string {
  if (!date) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T00:00:00`));
}

function Highlight({
  label,
  icon,
  day,
  value,
}: {
  label: string;
  icon: ReactNode;
  day: WeeklyWeatherDayOverview | null;
  value: string;
}) {
  if (!day) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-border dark:bg-muted/20">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-normal text-slate-500 dark:text-slate-300">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-semibold text-slate-950 dark:text-slate-50">
        {formatWeekday(day.date)}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatShortDate(day.date)} · {value}
      </p>
    </div>
  );
}

export function WeeklyOverviewCard({ overview }: WeeklyOverviewCardProps) {
  const hasDays = overview.days.length > 0;

  return (
    <Card className="overflow-hidden rounded-lg border-border/80 bg-white shadow-sm dark:bg-card">
      <CardHeader className="gap-3 border-b border-slate-100 bg-slate-50/70 dark:border-border dark:bg-muted/30">
        <div>
          <CardTitle>Consulta da semana</CardTitle>
          <CardDescription>
            {formatCityLabel(overview.city)} · {formatShortDate(overview.startDate)} a{" "}
            {formatShortDate(overview.endDate)}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-4 sm:p-5">
        {hasDays ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Highlight
                label="Melhor dia"
                icon={<ThumbsUp className="size-3.5 text-emerald-700" aria-hidden="true" />}
                day={overview.highlights.bestDay}
                value={`${overview.highlights.bestDay?.comfortScore ?? 0}/100`}
              />
              <Highlight
                label="Pior dia"
                icon={<ThumbsDown className="size-3.5 text-rose-700" aria-hidden="true" />}
                day={overview.highlights.worstDay}
                value={`${overview.highlights.worstDay?.comfortScore ?? 0}/100`}
              />
              <Highlight
                label="Mais chuva"
                icon={<Droplets className="size-3.5 text-sky-700" aria-hidden="true" />}
                day={overview.highlights.rainiestDay}
                value={formatNumber(
                  overview.highlights.rainiestDay?.precipitationProbabilityMax ?? null,
                  "%",
                )}
              />
              <Highlight
                label="Mais quente"
                icon={<Flame className="size-3.5 text-orange-700" aria-hidden="true" />}
                day={overview.highlights.hottestDay}
                value={formatNumber(
                  overview.highlights.hottestDay?.temperatureMax ?? null,
                  "°C",
                )}
              />
              <Highlight
                label="Mais frio"
                icon={<Snowflake className="size-3.5 text-cyan-700" aria-hidden="true" />}
                day={overview.highlights.coldestDay}
                value={formatNumber(
                  overview.highlights.coldestDay?.temperatureMin ?? null,
                  "°C",
                )}
              />
            </div>

            <div className="grid gap-3">
              {overview.days.map((day) => {
                const WeatherIcon = getWeatherIcon(day.weatherCode);

                return (
                  <article
                    key={day.date}
                    className="rounded-lg border border-slate-200 bg-white p-4 dark:border-border dark:bg-muted/20"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <WeatherIcon className="size-5 text-sky-700" aria-hidden="true" />
                          <div>
                            <h3 className="font-semibold capitalize text-slate-950 dark:text-slate-50">
                              {formatWeekday(day.date)}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {formatShortDate(day.date)} · {day.weatherLabel}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {day.summary}
                        </p>
                      </div>
                      <Badge className="h-8 bg-sky-700 px-3 text-white hover:bg-sky-700">
                        {day.comfortScore}/100
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
                      <span className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                        <Thermometer className="size-4 text-rose-700" aria-hidden="true" />
                        {formatNumber(day.temperatureMin, "°C")} /{" "}
                        {formatNumber(day.temperatureMax, "°C")}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                        <Droplets className="size-4 text-sky-700" aria-hidden="true" />
                        {formatNumber(day.precipitationProbabilityMax, "%")}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                        <CloudRain className="size-4 text-cyan-700" aria-hidden="true" />
                        {formatDecimal(day.precipitationSum, " mm")}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                        <Wind className="size-4 text-teal-700" aria-hidden="true" />
                        {formatNumber(day.windSpeedMax, " km/h")}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                        <CalendarDays className="size-4 text-amber-700" aria-hidden="true" />
                        UV {formatNumber(day.uvIndexMax, "")}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Sem dados diários para montar a previsão da semana.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

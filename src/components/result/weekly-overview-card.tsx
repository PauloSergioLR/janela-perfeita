import {
  CalendarDays,
  CloudRain,
  Droplets,
  Sparkles,
  Thermometer,
  ThumbsDown,
  ThumbsUp,
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
import { getWeatherIcon } from "@/lib/ui/icon-system";
import { formatCityLabel } from "@/lib/ui/search-page";
import type { WeeklyWeatherDayOverview, WeeklyWeatherOverview } from "@/types";

interface WeeklyOverviewCardProps {
  overview: WeeklyWeatherOverview;
}

type HighlightTone = "success" | "danger" | "warning";

function formatNumber(value: number | null, suffix: string): string {
  return value === null ? "Sem dados" : `${Math.round(value)}${suffix}`;
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

function getHighlightClasses(tone: HighlightTone): string {
  const tones = {
    success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300",
    danger: "border-rose-400/30 bg-rose-400/10 text-rose-600 dark:text-rose-300",
    warning: "border-sky-400/30 bg-sky-400/10 text-sky-600 dark:text-sky-300",
  };

  return tones[tone];
}

function Highlight({
  label,
  icon,
  day,
  value,
  tone,
}: {
  label: string;
  icon: ReactNode;
  day: WeeklyWeatherDayOverview | null;
  value: string;
  tone: HighlightTone;
}) {
  if (!day) {
    return null;
  }

  return (
    <article
      className={`rounded-xl border p-3.5 ${getHighlightClasses(tone)}`}
      aria-label={`${label}: ${formatWeekday(day.date)}`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
        {icon}
        {label}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="font-semibold capitalize text-slate-950 dark:text-slate-50">
            {formatWeekday(day.date)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatShortDate(day.date)} · {day.weatherLabel}
          </p>
        </div>
        <span className="text-lg font-semibold tabular-nums">{value}</span>
      </div>
    </article>
  );
}

export function WeeklyOverviewCard({ overview }: WeeklyOverviewCardProps) {
  const hasDays = overview.days.length > 0;

  return (
    <Card className="glass-card overflow-hidden rounded-xl">
      <CardHeader className="gap-3 border-b border-soft bg-weather-card p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium text-weather-accent">
              <Sparkles className="size-4" aria-hidden="true" />
              Clima por decisão
            </p>
            <CardTitle className="mt-1">Consulta da semana</CardTitle>
            <CardDescription>
              {formatCityLabel(overview.city)} · {formatShortDate(overview.startDate)} a{" "}
              {formatShortDate(overview.endDate)}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="h-8 w-fit border-weather-accent/50 bg-weather-accent/10 px-3 text-weather-accent"
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            {overview.days.length} dias
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-3">
        {hasDays ? (
          <>
            <section aria-label="Destaques da semana">
              <div className="grid gap-2 md:grid-cols-3">
                <Highlight
                  label="Melhor dia"
                  icon={<ThumbsUp className="size-3.5" aria-hidden="true" />}
                  day={overview.highlights.bestDay}
                  value={`${overview.highlights.bestDay?.comfortScore ?? 0}/100`}
                  tone="success"
                />
                <Highlight
                  label="Pior dia"
                  icon={<ThumbsDown className="size-3.5" aria-hidden="true" />}
                  day={overview.highlights.worstDay}
                  value={`${overview.highlights.worstDay?.comfortScore ?? 0}/100`}
                  tone="danger"
                />
                <Highlight
                  label="Maior chance de chuva"
                  icon={<Droplets className="size-3.5" aria-hidden="true" />}
                  day={overview.highlights.rainiestDay}
                  value={formatNumber(
                    overview.highlights.rainiestDay?.precipitationProbabilityMax ?? null,
                    "%",
                  )}
                  tone="warning"
                />
              </div>
            </section>

            <section className="space-y-3" aria-label="Previsão dos próximos 7 dias">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-950 dark:text-slate-50">
                    Próximos 7 dias
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Deslize para explorar a previsão completa.
                  </p>
                </div>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {overview.days.length} previsões
                </span>
              </div>

              <div className="overflow-x-auto pb-1 lg:overflow-visible">
                <div className="flex min-w-max gap-2 lg:grid lg:min-w-0 lg:grid-cols-7" role="list">
                  {overview.days.map((day) => {
                    const WeatherIcon = getWeatherIcon(day.weatherCode);

                    return (
                      <article
                        key={day.date}
                        role="listitem"
                        className="group flex w-36 shrink-0 flex-col rounded-lg border border-soft bg-weather-card/70 p-2.5 shadow-weather-soft transition-transform motion-safe:hover:-translate-y-1 motion-reduce:transition-none dark:bg-weather-card/45 lg:w-auto"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold capitalize text-slate-950 dark:text-slate-50">
                              {formatWeekday(day.date)}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {formatShortDate(day.date)}
                            </p>
                          </div>
                          <div className="grid size-8 place-items-center rounded-lg border border-weather-accent/30 bg-weather-accent/10 text-weather-accent">
                            <WeatherIcon className="size-4" aria-hidden="true" />
                          </div>
                        </div>

                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">{day.weatherLabel}</p>
                          <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                            {formatNumber(day.temperatureMin, "°C")} <span className="text-base font-medium text-muted-foreground">/</span>{" "}
                            {formatNumber(day.temperatureMax, "°C")}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">Mínima / máxima</p>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-1 border-y border-soft py-2 text-[10px]">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Droplets className="size-3.5 text-sky-500" aria-hidden="true" />
                            {formatNumber(day.precipitationProbabilityMax, "%")}
                          </span>
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <CloudRain className="size-3.5 text-cyan-500" aria-hidden="true" />
                            {formatNumber(day.precipitationSum, " mm")}
                          </span>
                        </div>

                        <p className="mt-2 line-clamp-2 text-xs leading-4 text-muted-foreground">{day.summary}</p>

                        <div className="mt-auto pt-2">
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                              <Thermometer className="size-3.5 text-rose-400" aria-hidden="true" />
                              Conforto
                            </span>
                            <span className="font-semibold tabular-nums text-slate-950 dark:text-slate-50">
                              {day.comfortScore}/100
                            </span>
                          </div>
                          <div
                            className="mt-2 h-1.5 overflow-hidden rounded-full bg-weather-muted"
                            aria-label={`Conforto: ${day.comfortScore} de 100`}
                          >
                            <div
                              className="h-full rounded-full bg-weather-accent transition-[width] duration-500 motion-reduce:transition-none"
                              style={{ width: `${Math.max(0, Math.min(day.comfortScore, 100))}%` }}
                            />
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-xl border border-soft bg-weather-card/70 p-4 text-sm text-muted-foreground dark:bg-weather-card/45">
            Sem dados diários para montar a previsão da semana.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

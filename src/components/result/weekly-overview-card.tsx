import {
  CalendarDays,
  Droplets,
  Sparkles,
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
    success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    danger: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    warning: "border-sky-400/30 bg-sky-400/10 text-sky-300",
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
      className={`rounded-xl border p-3 ${getHighlightClasses(tone)}`}
      aria-label={`${label}: ${formatWeekday(day.date)}`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
        {icon}
        {label}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="font-semibold capitalize text-slate-50">
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
  const hottestDay = overview.highlights.hottestDay;
  const coldestDay = overview.highlights.coldestDay;

  return (
    <Card
      size="sm"
      className="glass-card min-w-0 rounded-xl !py-0 xl:h-full xl:min-h-0"
    >
      <CardHeader className="gap-2 border-b border-soft bg-weather-card p-3 sm:p-4 xl:px-3 xl:!py-2 xl:!pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium text-weather-accent">
              <Sparkles className="size-4" aria-hidden="true" />
              Clima por decisão
            </p>
            <CardTitle className="mt-1">Consulta da semana</CardTitle>
            <CardDescription className="line-clamp-1">
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

      <CardContent className="grid min-h-0 gap-3 p-3 sm:p-4 xl:flex-1 xl:grid-rows-[auto_minmax(0,1fr)] xl:overflow-y-auto xl:p-3">
        {hasDays ? (
          <>
            <section aria-label="Destaques da semana">
              <div className="grid gap-3 md:grid-cols-3">
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

            <section
              className="grid min-h-0 gap-3 rounded-xl border border-soft bg-background/25 p-3 xl:grid-cols-3"
              aria-label="Resumo climático da semana"
            >
              <div className="min-w-0 xl:col-span-1">
                <h3 className="font-semibold text-slate-50">
                  Resumo da semana
                </h3>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Melhor conforto, pior conforto, chuva e extremos de
                  temperatura do período.
                </p>
              </div>

              <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:col-span-2">
                <div className="rounded-lg border border-soft bg-weather-card/70 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Mais quente
                  </p>
                  <p className="mt-1 truncate font-semibold capitalize text-slate-50">
                    {hottestDay ? formatWeekday(hottestDay.date) : "Sem dados"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatNumber(hottestDay?.temperatureMax ?? null, "°C")}
                  </p>
                </div>
                <div className="rounded-lg border border-soft bg-weather-card/70 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Mais frio
                  </p>
                  <p className="mt-1 truncate font-semibold capitalize text-slate-50">
                    {coldestDay ? formatWeekday(coldestDay.date) : "Sem dados"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatNumber(coldestDay?.temperatureMin ?? null, "°C")}
                  </p>
                </div>
                <div className="rounded-lg border border-soft bg-weather-card/70 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Dias avaliados
                  </p>
                  <p className="mt-1 font-semibold tabular-nums text-slate-50">
                    {overview.days.length}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Previsões consolidadas.
                  </p>
                </div>
                <div className="rounded-lg border border-soft bg-weather-card/70 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Janela temporal
                  </p>
                  <p className="mt-1 font-semibold text-slate-50">
                    {formatShortDate(overview.startDate)} a{" "}
                    {formatShortDate(overview.endDate)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Próximos dias para comparar.
                  </p>
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

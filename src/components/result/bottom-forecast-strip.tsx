"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  MapPin,
  Search,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  formatForecastDayLabel,
  formatTemperatureRange,
  getForecastClassification,
  getForecastShortSummary,
  type ForecastClassificationTone,
} from "@/lib/ui/forecast-strip";
import { getWeatherIcon } from "@/lib/ui/icon-system";
import { formatCityLabel } from "@/lib/ui/search-page";
import { cn } from "@/lib/utils";
import type { WeeklyWeatherOverview } from "@/types";

interface BottomForecastStripProps {
  className?: string;
  overview?: WeeklyWeatherOverview;
  modeLabel: string;
  cityLabel: string;
  dateLabel: string;
  activityLabel: string;
  resultLabel: string;
}

interface BottomStripCard {
  id: string;
  label: string;
  value: string;
  detail: string;
  meta: string;
  icon: LucideIcon;
  tone?: ForecastClassificationTone;
}

const PAGE_SIZE = 5;

const classificationClasses: Record<ForecastClassificationTone, string> = {
  excellent: "border-success/45 bg-success/10 text-success",
  good: "border-weather-accent/45 bg-weather-accent/10 text-weather-accent",
  regular: "border-warning/45 bg-warning/10 text-warning",
  rain: "border-danger/45 bg-danger/10 text-danger",
};

export function BottomForecastStrip({
  className,
  overview,
  modeLabel,
  cityLabel,
  dateLabel,
  activityLabel,
  resultLabel,
}: BottomForecastStripProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const todayDate = new Date().toISOString().slice(0, 10);
  const hasForecast = Boolean(overview && overview.days.length > 0);
  const cards = useMemo<BottomStripCard[]>(() => {
    if (overview && overview.days.length > 0) {
      return overview.days.map((day) => {
        const WeatherIcon = getWeatherIcon(day.weatherCode);
        const classification = getForecastClassification(day);

        return {
          id: day.date,
          label: formatForecastDayLabel(day.date, todayDate),
          value: formatTemperatureRange(day.temperatureMin, day.temperatureMax),
          detail: classification.label,
          meta: getForecastShortSummary(day.summary, day.weatherLabel),
          icon: WeatherIcon,
          tone: classification.tone,
        };
      });
    }

    return [
      {
        id: "mode",
        label: "Modo",
        value: modeLabel,
        detail: "Fluxo real",
        meta: "Busca usa API e regras atuais.",
        icon: Search,
      },
      {
        id: "city",
        label: "Cidade",
        value: cityLabel,
        detail: "Local da previsão",
        meta: "Autocomplete mantém cidades reais.",
        icon: MapPin,
      },
      {
        id: "date",
        label: "Período",
        value: dateLabel,
        detail: "Data escolhida",
        meta: "Hoje e seletor de data seguem ativos.",
        icon: CalendarDays,
      },
      {
        id: "activity",
        label: "Atividade",
        value: activityLabel,
        detail: "Preferência",
        meta: "Atividade alimenta o score.",
        icon: Trophy,
      },
      {
        id: "result",
        label: "Resultado",
        value: resultLabel,
        detail: "Estado atual",
        meta: "Recomendação aparece após cálculo.",
        icon: Sparkles,
      },
    ];
  }, [
    activityLabel,
    cityLabel,
    dateLabel,
    modeLabel,
    overview,
    resultLabel,
    todayDate,
  ]);
  const totalPages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
  const firstCardIndex = pageIndex * PAGE_SIZE;
  const visibleCards = cards.slice(firstCardIndex, firstCardIndex + PAGE_SIZE);

  useEffect(() => {
    setPageIndex((currentPage) => Math.min(currentPage, totalPages - 1));
  }, [totalPages]);

  return (
    <section
      className={cn("glass-panel h-full rounded-xl p-2 sm:p-3", className)}
      aria-label="Previsão dos próximos dias"
    >
      <div className="grid h-full min-h-0 gap-2 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-stretch">
        <div className="flex min-h-0 min-w-0 items-center gap-2 rounded-lg border border-soft bg-background/45 px-3 py-2">
          <span className="glow-primary flex size-10 shrink-0 items-center justify-center rounded-md border border-weather-accent/45 bg-weather-accent/12">
            <CloudSun className="size-5 text-weather-accent" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-weather-accent">
              {hasForecast ? "Próximos dias" : "Consulta"}
            </p>
            <p className="truncate text-sm font-semibold">
              {overview ? formatCityLabel(overview.city) : cityLabel}
            </p>
          </div>
        </div>

        <div className="min-h-0 min-w-0">
          <div className="mb-1 flex items-center justify-between gap-3">
            <p className="truncate text-xs text-muted-foreground">
              {hasForecast
                ? "Cards reais da previsão semanal."
                : "Cards refletem a consulta atual."}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label="Cards anteriores"
                disabled={pageIndex === 0}
                onClick={() =>
                  setPageIndex((currentPage) => Math.max(0, currentPage - 1))
                }
                className="inline-flex size-8 items-center justify-center rounded-md border border-soft bg-background/45 text-muted-foreground transition hover:border-weather-accent/55 hover:text-weather-accent disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Próximos cards"
                disabled={pageIndex >= totalPages - 1}
                onClick={() =>
                  setPageIndex((currentPage) =>
                    Math.min(totalPages - 1, currentPage + 1),
                  )
                }
                className="inline-flex size-8 items-center justify-center rounded-md border border-soft bg-background/45 text-muted-foreground transition hover:border-weather-accent/55 hover:text-weather-accent disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid min-h-0 gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {visibleCards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.id}
                  className="flex min-h-0 min-w-0 flex-col rounded-lg border border-soft bg-weather-card/75 p-2"
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs text-muted-foreground">
                        {card.label}
                      </p>
                      <p className="truncate text-sm font-semibold">
                        {card.value}
                      </p>
                    </div>
                    <Icon
                      className="size-4 shrink-0 text-weather-accent"
                      aria-hidden="true"
                    />
                  </div>
                  <span
                    className={cn(
                      "mb-1 inline-flex w-fit rounded-md border border-soft bg-background/45 px-2 py-0.5 text-[11px] font-medium",
                      card.tone ? classificationClasses[card.tone] : "",
                    )}
                  >
                    {card.detail}
                  </span>
                  <p className="line-clamp-1 text-[11px] leading-4 text-muted-foreground">
                    {card.meta}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

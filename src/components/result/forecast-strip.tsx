"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useRef } from "react";
import {
  formatForecastDate,
  formatForecastDayLabel,
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
  subtitle?: string;
  title?: string;
}

const classificationClasses: Record<ForecastClassificationTone, string> = {
  excellent: "border-success/45 bg-success/10 text-success",
  good: "border-weather-accent/45 bg-weather-accent/10 text-weather-accent",
  regular: "border-warning/45 bg-warning/10 text-warning",
  rain: "border-danger/45 bg-danger/10 text-danger",
};

const TemperatureIcon = getWeatherMetricIcon("temperature");

function formatTemperatureValue(value: number | null): string {
  return value === null ? "--" : `${Math.round(value)}°`;
}

export function ForecastStrip({
  overview,
  subtitle,
  title = "Próximos dias",
}: ForecastStripProps) {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const todayDate = new Date().toISOString().slice(0, 10);
  const scrollForecast = useCallback((direction: "previous" | "next") => {
    const viewport = scrollViewportRef.current;

    if (!viewport) {
      return;
    }

    const offset = viewport.clientWidth * 0.72 * (direction === "next" ? 1 : -1);
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    viewport.scrollBy({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      left: offset,
    });
  }, []);

  if (overview.days.length === 0) {
    return null;
  }

  return (
    <section
      className="glass-panel min-w-0 rounded-xl p-3 sm:p-4 xl:p-1.5"
      aria-label="Previsão dos próximos dias"
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg border border-weather-accent/35 bg-weather-accent/10 text-weather-accent shadow-inner shadow-white/10">
            <CalendarDays className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
              {title}
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {subtitle ?? formatCityLabel(overview.city)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="grid size-7 place-items-center rounded-md border border-soft bg-background/40 text-muted-foreground transition hover:border-weather-accent/50 hover:bg-weather-card hover:text-weather-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label="Ver dias anteriores"
            title="Ver dias anteriores"
            onClick={() => scrollForecast("previous")}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="grid size-7 place-items-center rounded-md border border-soft bg-background/40 text-muted-foreground transition hover:border-weather-accent/50 hover:bg-weather-card hover:text-weather-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label="Ver próximos dias"
            title="Ver próximos dias"
            onClick={() => scrollForecast("next")}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={scrollViewportRef}
        className="scrollbar-none mt-1.5 flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-0.5 xl:mt-1"
        role="list"
      >
        {overview.days.map((day) => {
          const WeatherIcon = getWeatherIcon(day.weatherCode);
          const classification = getForecastClassification(day);
          const shortSummary = getForecastShortSummary(day.summary, day.weatherLabel);

          return (
            <article
              key={day.date}
              className="cockpit-surface grid h-[7rem] min-w-[9.4rem] flex-[0_0_9.4rem] snap-start grid-rows-[auto_1fr_auto] rounded-lg border p-2 shadow-inner shadow-white/5 sm:min-w-[10.25rem] sm:flex-[0_0_10.25rem] xl:h-[5.65rem] xl:min-w-0 xl:flex-[0_0_clamp(8.75rem,13vw,10.5rem)] xl:p-1.5"
              role="listitem"
            >
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold capitalize text-slate-950 dark:text-slate-50">
                    {formatForecastDayLabel(day.date, todayDate)}
                  </p>
                  <p className="truncate text-[11px] leading-4 text-muted-foreground">
                    {formatForecastDate(day.date)}
                  </p>
                </div>
                <div className="grid size-7 shrink-0 place-items-center rounded-md border border-weather-accent/30 bg-weather-accent/10 text-weather-accent xl:size-6">
                  <WeatherIcon className="size-4 xl:size-3.5" aria-hidden="true" />
                </div>
              </div>

              <div className="min-w-0 self-center">
                <p className="truncate text-base font-semibold tabular-nums text-slate-950 dark:text-slate-50 xl:text-sm">
                  {formatTemperatureValue(day.temperatureMax)}
                  <span className="px-1 text-xs font-medium text-muted-foreground">
                    /
                  </span>
                  {formatTemperatureValue(day.temperatureMin)}
                </p>
                <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] leading-4 text-muted-foreground xl:leading-3">
                  <TemperatureIcon className="size-3 text-weather-accent" aria-hidden="true" />
                  Máx / mín
                </p>
              </div>

              <div className="flex min-w-0 items-center">
                <span
                  className={cn(
                    "inline-flex max-w-full truncate rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4",
                    classificationClasses[classification.tone],
                  )}
                  title={`${classification.label}: ${shortSummary}`}
                >
                  {classification.label}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

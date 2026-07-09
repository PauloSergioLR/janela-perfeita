"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  forecastStripViewOptions,
  formatForecastDate,
  formatForecastDayLabel,
  getForecastClassification,
  getForecastShortSummary,
  getForecastStripDaysForView,
  type ForecastClassificationTone,
  type ForecastStripView,
} from "@/lib/ui/forecast-strip";
import { getWeatherIcon, getWeatherMetricIcon } from "@/lib/ui/icon-system";
import { formatCityLabel } from "@/lib/ui/search-page";
import { cn } from "@/lib/utils";
import type { WeeklyWeatherOverview } from "@/types";

interface ForecastStripProps {
  overview: WeeklyWeatherOverview;
  subtitle?: string;
  title?: string;
  defaultView?: ForecastStripView;
  showViewTabs?: boolean;
  className?: string;
}

interface ScrollState {
  canScrollNext: boolean;
  canScrollPrevious: boolean;
}

const classificationClasses: Record<ForecastClassificationTone, string> = {
  excellent: "border-success/45 bg-success/10 text-success",
  good: "border-weather-accent/45 bg-weather-accent/10 text-weather-accent",
  regular: "border-warning/45 bg-warning/10 text-warning",
  rain: "border-danger/45 bg-danger/10 text-danger",
};

const RainIcon = getWeatherMetricIcon("precipitation");
const DEFAULT_VIEW: ForecastStripView = "next-days";
const SCROLL_TOLERANCE_PX = 2;

function formatTemperatureValue(value: number | null): string {
  return value === null ? "--" : `${Math.round(value)}°`;
}

function formatPrecipitationChance(value: number | null): string {
  return value === null ? "--" : `${Math.round(value)}%`;
}

function getScrollState(viewport: HTMLDivElement): ScrollState {
  const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth;

  return {
    canScrollNext: viewport.scrollLeft < maxScrollLeft - SCROLL_TOLERANCE_PX,
    canScrollPrevious: viewport.scrollLeft > SCROLL_TOLERANCE_PX,
  };
}

export function BottomForecastStrip({
  overview,
  subtitle,
  defaultView = DEFAULT_VIEW,
  showViewTabs = true,
  className,
  title = "Próximos dias",
}: ForecastStripProps) {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<ForecastStripView>(defaultView);
  const [scrollState, setScrollState] = useState<ScrollState>({
    canScrollNext: false,
    canScrollPrevious: false,
  });
  const todayDate = new Date().toISOString().slice(0, 10);
  const visibleDays = useMemo(
    () => getForecastStripDaysForView(overview.days, activeView),
    [activeView, overview.days],
  );
  const updateScrollState = useCallback(() => {
    const viewport = scrollViewportRef.current;

    if (!viewport) {
      return;
    }

    const nextState = getScrollState(viewport);

    setScrollState((currentState) =>
      currentState.canScrollNext === nextState.canScrollNext &&
      currentState.canScrollPrevious === nextState.canScrollPrevious
        ? currentState
        : nextState,
    );
  }, []);
  const scrollForecast = useCallback(
    (direction: "previous" | "next") => {
      const viewport = scrollViewportRef.current;

      if (!viewport) {
        return;
      }

      const offset =
        Math.max(180, viewport.clientWidth * 0.74) *
        (direction === "next" ? 1 : -1);
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      viewport.scrollBy({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        left: offset,
      });
    },
    [],
  );

  useEffect(() => {
    setActiveView(defaultView);
  }, [defaultView]);

  useEffect(() => {
    const viewport = scrollViewportRef.current;

    if (!viewport) {
      return;
    }

    viewport.scrollTo({ behavior: "auto", left: 0 });

    const updateFrame = window.requestAnimationFrame(updateScrollState);
    const handleScroll = () => updateScrollState();
    let resizeObserver: ResizeObserver | null = null;

    viewport.addEventListener("scroll", handleScroll, { passive: true });

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateScrollState);
      resizeObserver.observe(viewport);
    } else {
      window.addEventListener("resize", updateScrollState);
    }

    return () => {
      window.cancelAnimationFrame(updateFrame);
      viewport.removeEventListener("scroll", handleScroll);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [activeView, updateScrollState, visibleDays.length]);

  if (overview.days.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "glass-panel min-w-0 rounded-xl p-3 sm:p-4 xl:shrink-0 xl:p-2",
        className,
      )}
      aria-label="Previsão dos próximos dias"
    >
      <div className="grid min-w-0 gap-2 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
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

        <div className="flex min-w-0 items-center justify-between gap-2 xl:justify-end">
          {showViewTabs ? (
            <div
              className="scrollbar-none flex min-w-0 gap-1 overflow-x-auto rounded-lg border border-soft bg-background/35 p-1"
              role="tablist"
              aria-label="Recorte da previsão"
            >
              {forecastStripViewOptions.map((option) => {
                const isActive = option.value === activeView;

                return (
                  <button
                    key={option.value}
                    type="button"
                    id={`bottom-forecast-tab-${option.value}`}
                    className={cn(
                      "min-h-7 shrink-0 rounded-md px-2.5 text-[11px] font-medium leading-none text-muted-foreground transition hover:bg-weather-card hover:text-weather-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:text-xs",
                      isActive &&
                        "cockpit-active text-slate-950 shadow-weather-glow dark:text-slate-50",
                    )}
                    role="tab"
                    aria-controls="bottom-forecast-panel"
                    aria-selected={isActive}
                    onClick={() => setActiveView(option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="grid size-8 place-items-center rounded-md border border-soft bg-background/40 text-muted-foreground transition hover:border-weather-accent/50 hover:bg-weather-card hover:text-weather-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Ver dias anteriores"
              title="Ver dias anteriores"
              disabled={!scrollState.canScrollPrevious}
              onClick={() => scrollForecast("previous")}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="grid size-8 place-items-center rounded-md border border-soft bg-background/40 text-muted-foreground transition hover:border-weather-accent/50 hover:bg-weather-card hover:text-weather-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Ver próximos dias"
              title="Ver próximos dias"
              disabled={!scrollState.canScrollNext}
              onClick={() => scrollForecast("next")}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div
        id="bottom-forecast-panel"
        className="relative mt-2 min-w-0"
        role="tabpanel"
        aria-label={showViewTabs ? undefined : title}
        aria-labelledby={
          showViewTabs ? `bottom-forecast-tab-${activeView}` : undefined
        }
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-10 w-8 rounded-l-lg bg-gradient-to-r from-background/80 to-transparent transition-opacity",
            scrollState.canScrollPrevious ? "opacity-100" : "opacity-0",
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-10 w-8 rounded-r-lg bg-gradient-to-l from-background/80 to-transparent transition-opacity",
            scrollState.canScrollNext ? "opacity-100" : "opacity-0",
          )}
          aria-hidden="true"
        />

        <div
          ref={scrollViewportRef}
          className="scrollbar-none flex min-w-0 touch-pan-x snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-0.5"
          role="list"
        >
          {visibleDays.map((day) => {
            const WeatherIcon = getWeatherIcon(day.weatherCode);
            const classification = getForecastClassification(day);
            const shortSummary = getForecastShortSummary(
              day.summary,
              day.weatherLabel,
            );

            return (
              <article
                key={day.date}
                className="cockpit-surface grid h-[7rem] min-w-0 flex-[0_0_clamp(10.5rem,17vw,22rem)] snap-start grid-rows-[auto_1fr_auto] rounded-lg border p-2 shadow-inner shadow-white/5 xl:h-[6rem]"
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
                  <div className="grid size-7 shrink-0 place-items-center rounded-md border border-weather-accent/30 bg-weather-accent/10 text-weather-accent">
                    <WeatherIcon className="size-4" aria-hidden="true" />
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
                  <p className="mt-0.5 truncate text-[11px] leading-4 text-muted-foreground">
                    {shortSummary}
                  </p>
                </div>

                <div className="flex min-w-0 items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex max-w-full truncate rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4",
                      classificationClasses[classification.tone],
                    )}
                    title={`${classification.label}: ${shortSummary}`}
                  >
                    {classification.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[11px] leading-4 text-muted-foreground">
                    <RainIcon
                      className="size-3 text-weather-accent"
                      aria-hidden="true"
                    />
                    {formatPrecipitationChance(day.precipitationProbabilityMax)}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <p className="sr-only">
        Use as setas ou arraste horizontalmente para navegar pelos cards.
      </p>
    </section>
  );
}

export function ForecastStrip(props: ForecastStripProps) {
  return <BottomForecastStrip {...props} />;
}

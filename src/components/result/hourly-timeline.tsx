"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getWeatherIcon } from "@/lib/ui/icon-system";
import { cn } from "@/lib/utils";
import type { HourlyWeather } from "@/types";

interface HourlyTimelineProps { hourly: HourlyWeather[] }

const SCROLL_TOLERANCE_PX = 2;

function formatHour(time: string): string { return time.slice(11, 16); }

function getHourlyRainRisk(weather: HourlyWeather): string {
  const precipitation = Math.max(weather.precipitation, weather.rain, weather.showers);
  return precipitation > 0 ? `${precipitation.toFixed(1)} mm` : `${weather.precipitation_probability}%`;
}

export function HourlyTimeline({ hourly }: HourlyTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateNavigation = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > SCROLL_TOLERANCE_PX);
    setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - SCROLL_TOLERANCE_PX);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ left: 0 });
    updateNavigation();
    const resizeObserver = new ResizeObserver(updateNavigation);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [hourly, updateNavigation]);

  function scroll(direction: -1 | 1) {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollBy({ left: direction * container.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <div className="grid min-w-0 content-start gap-2">
      <div className="flex justify-end gap-1.5">
        <Button type="button" variant="outline" size="icon-sm" aria-label="Ver horários anteriores" disabled={!canScrollLeft} onClick={() => scroll(-1)}>
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button type="button" variant="outline" size="icon-sm" aria-label="Ver próximos horários" disabled={!canScrollRight} onClick={() => scroll(1)}>
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
      <div className="relative min-w-0 overflow-hidden">
        <div className={cn("pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-weather-card to-transparent transition-opacity", canScrollLeft ? "opacity-100" : "opacity-0")} aria-hidden="true" />
        <div className={cn("pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-weather-card to-transparent transition-opacity", canScrollRight ? "opacity-100" : "opacity-0")} aria-hidden="true" />
        <div ref={scrollRef} data-testid="hourly-timeline-scroll" className="scrollbar-none min-w-0 overflow-x-auto overscroll-x-contain pb-1" onScroll={updateNavigation}>
          <div className="flex min-w-max gap-2" role="list">
            {hourly.map((weather) => {
              const HourWeatherIcon = getWeatherIcon(weather.weather_code);
              return (
                <article key={weather.time} role="listitem" className="cockpit-surface grid w-24 shrink-0 gap-1 rounded-lg border p-2 text-center xl:gap-0.5 xl:p-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{formatHour(weather.time)}</span>
                  <HourWeatherIcon className="mx-auto size-5 text-weather-accent" aria-hidden="true" />
                  <span className="text-base font-semibold text-slate-950 dark:text-slate-50 xl:text-sm 2xl:text-base">{Math.round(weather.temperature_2m)}°</span>
                  <span className="text-xs text-muted-foreground">{getHourlyRainRisk(weather)}</span>
                  <span className="text-xs text-muted-foreground xl:hidden 2xl:block">{Math.round(weather.wind_speed_10m)} km/h</span>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

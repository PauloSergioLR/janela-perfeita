"use client";

import { Info, Sparkles } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildOpportunityTooltip,
  getOpportunityBarHeight,
  getOpportunityTone,
} from "@/lib/ui/opportunity-timeline";
import {
  buildTimelineData,
  formatForecastConfidenceLevel,
  formatWindowTimeRange,
} from "@/lib/ui/recommendation-result";
import { cn } from "@/lib/utils";
import type { Recommendation } from "@/types";

interface OpportunityTimelineProps {
  recommendation: Recommendation;
  variant?: "card" | "embedded";
  className?: string;
}

export function OpportunityTimeline({
  recommendation,
  variant = "card",
  className,
}: OpportunityTimelineProps) {
  const minRecommendedScore = recommendation.activity.minRecommendedScore;
  const data = buildTimelineData(
    recommendation.scores,
    minRecommendedScore,
    recommendation.bestWindow,
  );
  const bestWindowLabel = recommendation.bestWindow
    ? formatWindowTimeRange(recommendation.bestWindow)
    : null;
  const [selectedTime, setSelectedTime] = useState(
    data.find((datum) => datum.isBestWindow)?.time ?? data[0]?.time ?? null,
  );
  const selectedDatum =
    data.find((datum) => datum.time === selectedTime) ?? data[0] ?? null;
  const isEmbedded = variant === "embedded";
  const timelineStyle = {
    "--timeline-count": data.length,
  } as CSSProperties;
  const header = (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        isEmbedded && "gap-2",
      )}
    >
      <div>
        <p
          className={cn(
            "text-sm font-medium text-weather-accent",
            isEmbedded && "text-xs",
          )}
        >
          Oportunidade por hora
        </p>
        <CardTitle className={cn("mt-1", isEmbedded && "text-sm")}>
          Timeline de scores
        </CardTitle>
        <CardDescription className={cn(isEmbedded && "sr-only")}>
          Selecione um horário para ver os fatores da previsão.
        </CardDescription>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={cn(
            "h-7 border-success/45 bg-success/10 px-3 text-success",
            isEmbedded && "h-5 px-2 text-[10px]",
          )}
          aria-label={`Score mínimo recomendado: ${minRecommendedScore}/100`}
        >
          Mínimo {minRecommendedScore}/100
        </Badge>
        {bestWindowLabel ? (
          <Badge
            variant="outline"
            className={cn(
              "h-7 border-weather-accent/50 bg-weather-accent/10 px-3 text-weather-accent",
              isEmbedded && "h-5 px-2 text-[10px]",
            )}
            aria-label={`Melhor janela: ${bestWindowLabel}`}
          >
            Melhor {bestWindowLabel}
          </Badge>
        ) : null}
      </div>
    </div>
  );
  const content = (
    <div className={cn("space-y-4", isEmbedded && "space-y-2")}>
      {data.length > 0 ? (
        <>
          <div
            className={cn(
              "rounded-lg border border-soft bg-background/25 p-2",
              isEmbedded && "xl:p-1.5",
            )}
          >
            <div
              className={cn(
                "grid min-w-0 grid-cols-6 gap-1 sm:grid-cols-12",
                isEmbedded &&
                  "xl:grid-cols-[repeat(var(--timeline-count),minmax(0,1fr))] xl:gap-0.5",
                !isEmbedded &&
                  "xl:grid-cols-[repeat(var(--timeline-count),minmax(0,1fr))]",
              )}
              style={timelineStyle}
            >
              {data.map((datum) => {
                const tone = getOpportunityTone(datum);
                const isSelected = datum.time === selectedDatum?.time;

                return (
                  <button
                    key={datum.time}
                    type="button"
                    onClick={() => setSelectedTime(datum.time)}
                    title={buildOpportunityTooltip(datum)}
                    aria-pressed={isSelected}
                    aria-label={`${datum.hourLabel}, score ${datum.score} de 100. ${tone.label}. ${datum.reason}`}
                    className={cn(
                      "group relative grid min-h-20 min-w-0 grid-rows-[auto_1fr_auto] gap-1 rounded-md border border-soft bg-weather-card/45 p-1 text-center transition-[transform,border-color,background-color,box-shadow,opacity] duration-200 ease-out motion-safe:active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
                      isEmbedded &&
                        "min-h-16 xl:min-h-14 2xl:min-h-[4.75rem]",
                      datum.score < 40 && "opacity-65 hover:opacity-100",
                      datum.isBestWindow &&
                        "motion-timeline-best border-weather-accent/60 bg-weather-accent/10",
                      isSelected &&
                        "border-weather-accent/70 bg-weather-accent/15 motion-safe:-translate-y-1 shadow-weather-glow ring-1 ring-weather-accent/50",
                    )}
                  >
                    {datum.isBestWindow ? (
                      <span
                        className="pointer-events-none absolute inset-x-1 top-1 h-0.5 rounded-full bg-weather-accent shadow-weather-glow"
                        aria-hidden="true"
                      />
                    ) : null}
                    <span
                      className={cn(
                        "truncate text-[10px] leading-3 font-medium text-muted-foreground",
                        datum.isBestWindow && "text-weather-accent",
                      )}
                    >
                      {datum.hourLabel.slice(0, 2)}h
                    </span>
                    <span
                      className={cn(
                        "flex h-12 min-h-0 items-end rounded-[0.35rem] border border-soft bg-muted/25 p-0.5",
                        isEmbedded && "h-10 xl:h-8 2xl:h-12",
                        datum.isBestWindow &&
                          "border-weather-accent/55 bg-weather-accent/10",
                      )}
                    >
                      <span
                        className={cn(
                          "w-full rounded-[0.2rem] transition-[height] duration-200 motion-reduce:transition-none",
                          tone.barClassName,
                        )}
                        style={{
                          height: `${getOpportunityBarHeight(datum.score)}%`,
                        }}
                      />
                    </span>
                    <span
                      className={cn(
                        "truncate text-[10px] leading-3 font-semibold text-slate-950 dark:text-slate-50",
                        datum.isBestWindow && "text-weather-accent",
                      )}
                    >
                      {datum.score}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDatum ? (
            <div
              className={cn(
                "border-y border-soft py-4",
                isEmbedded && "rounded-lg border bg-background/25 px-2 py-1.5",
                isEmbedded && "xl:sr-only",
              )}
              aria-live="polite"
              aria-label={`Detalhes de ${selectedDatum.hourLabel}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-950 dark:text-slate-50">
                  <Sparkles
                    className="size-4 text-weather-accent"
                    aria-hidden="true"
                  />
                  {selectedDatum.hourLabel}
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "h-7 px-3",
                    getOpportunityTone(selectedDatum).markerClassName,
                  )}
                >
                  {selectedDatum.score}/100
                </Badge>
              </div>
              <p
                className={cn(
                  "mt-3 text-sm leading-6 text-muted-foreground",
                  isEmbedded && "mt-1 line-clamp-1 text-xs leading-4",
                )}
              >
                {selectedDatum.reason}
              </p>
              <div
                className={cn(
                  "mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground",
                  isEmbedded && "mt-1",
                )}
              >
                {selectedDatum.rainRisk ? (
                  <span>{selectedDatum.rainRisk}</span>
                ) : null}
                {selectedDatum.wind ? <span>{selectedDatum.wind}</span> : null}
                {selectedDatum.confidenceLevel ? (
                  <span>
                    Confiança{" "}
                    {formatForecastConfidenceLevel(
                      selectedDatum.confidenceLevel,
                    ).toLowerCase()}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex items-center gap-2 border-y border-soft py-4 text-sm text-muted-foreground">
          <Info className="size-4 text-weather-accent" aria-hidden="true" />
          Sem dados disponíveis para montar a timeline.
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return (
      <section
        className={cn(
          "min-w-0 rounded-lg border border-soft bg-background/25 p-3",
          isEmbedded && "xl:p-2",
          className,
        )}
        aria-label="Timeline de oportunidade"
      >
        {header}
        {content}
      </section>
    );
  }

  return (
    <Card
      className={cn("glass-card min-w-0 overflow-hidden rounded-xl", className)}
      aria-label="Timeline de oportunidade"
    >
      <CardHeader className="gap-3 border-b border-soft bg-weather-card">
        {header}
      </CardHeader>
      <CardContent className="p-4 sm:p-5">{content}</CardContent>
    </Card>
  );
}

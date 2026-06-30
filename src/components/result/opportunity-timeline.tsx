"use client";

import { Info, Sparkles } from "lucide-react";
import { useState } from "react";
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
}

export function OpportunityTimeline({ recommendation }: OpportunityTimelineProps) {
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

  return (
    <Card
      className="glass-card min-w-0 overflow-hidden rounded-xl"
      aria-label="Timeline de oportunidade"
    >
      <CardHeader className="gap-3 border-b border-soft bg-weather-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-weather-accent">
              Oportunidade por hora
            </p>
            <CardTitle className="mt-1">Timeline de scores</CardTitle>
            <CardDescription>
              Selecione um horário para ver os fatores da previsão.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="h-7 border-success/45 bg-success/10 px-3 text-success"
              aria-label={`Score mínimo recomendado: ${minRecommendedScore}/100`}
            >
              Mínimo {minRecommendedScore}/100
            </Badge>
            {bestWindowLabel ? (
              <Badge
                variant="outline"
                className="h-7 border-weather-accent/50 bg-weather-accent/10 px-3 text-weather-accent"
                aria-label={`Melhor janela: ${bestWindowLabel}`}
              >
                Melhor {bestWindowLabel}
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        {data.length > 0 ? (
          <>
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-max items-end gap-2 px-1 pt-4">
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
                        "group grid w-[4.75rem] shrink-0 gap-2 rounded-lg border border-transparent p-2 text-left transition-[transform,border-color,background-color,box-shadow,opacity] duration-200 ease-out motion-safe:active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/45",
                        datum.score < 40 && "opacity-55 hover:opacity-100",
                        datum.isBestWindow && "motion-timeline-best ring-1 ring-weather-accent/35",
                        isSelected &&
                          "border-weather-accent/55 bg-weather-accent/10 motion-safe:-translate-y-1 shadow-weather-glow",
                      )}
                    >
                      <span className="flex h-36 items-end rounded-md border border-soft bg-muted/35 p-1">
                        <span
                          className={cn(
                            "w-full rounded-sm transition-[height] duration-200 motion-reduce:transition-none",
                            tone.barClassName,
                          )}
                          style={{
                            height: `${getOpportunityBarHeight(datum.score)}%`,
                          }}
                        />
                      </span>
                      <span className="flex items-center justify-between gap-1 text-xs text-muted-foreground">
                        <span>{datum.hourLabel}</span>
                        <span className="font-semibold text-slate-950 dark:text-slate-50">
                          {datum.score}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDatum ? (
              <div
                className="border-y border-soft py-4"
                aria-live="polite"
                aria-label={`Detalhes de ${selectedDatum.hourLabel}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-950 dark:text-slate-50">
                    <Sparkles className="size-4 text-weather-accent" aria-hidden="true" />
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
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {selectedDatum.reason}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {selectedDatum.rainRisk ? <span>{selectedDatum.rainRisk}</span> : null}
                  {selectedDatum.wind ? <span>{selectedDatum.wind}</span> : null}
                  {selectedDatum.confidenceLevel ? (
                    <span>
                      Confiança {formatForecastConfidenceLevel(selectedDatum.confidenceLevel).toLowerCase()}
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
      </CardContent>
    </Card>
  );
}

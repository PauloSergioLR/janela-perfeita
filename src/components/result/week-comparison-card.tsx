import { AlertCircle, CalendarDays, CheckCircle2, Clock3, Trophy } from "lucide-react";
import type { DayRankingItem, WeekComparison } from "@/types";
import { ShareResultButton } from "@/components/result/share-result-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatForecastConfidenceLevel,
  formatRecommendationDate,
} from "@/lib/ui/recommendation-result";
import {
  formatWindowSummary,
  getRecommendationRankingReason,
} from "@/lib/ui/exploration-result";
import { buildWeekComparisonShareText } from "@/lib/ui/share-result";
import { formatCityLabel } from "@/lib/ui/search-page";
import { cn } from "@/lib/utils";

interface WeekComparisonCardProps {
  comparison: WeekComparison;
}

function DayBadge({ item }: { item: DayRankingItem }) {
  return item.isRecommended ? (
    <Badge className="h-7 shrink-0 bg-sky-700 text-white hover:bg-sky-700">
      {item.score}/100
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="h-7 shrink-0 border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
    >
      Não recomendado
    </Badge>
  );
}

export function WeekComparisonCard({ comparison }: WeekComparisonCardProps) {
  const bestRecommendation = comparison.bestDay?.recommendation;
  const shareText = buildWeekComparisonShareText(comparison);

  return (
    <Card
      size="sm"
      className="glass-card min-w-0 rounded-xl !py-0 xl:h-full xl:min-h-0"
    >
      <CardHeader className="cockpit-surface-strong border-b px-3 !py-2 sm:px-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-weather-accent">
              Decisão por modo
            </p>
            <CardTitle className="mt-1">Melhor dia da semana</CardTitle>
            <CardDescription className="line-clamp-1">
              {comparison.activity.name} em {formatCityLabel(comparison.city)}
            </CardDescription>
          </div>
          <div className="shrink-0">
            <ShareResultButton title="Janela Perfeita" text={shareText} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-col gap-3 p-3 sm:p-4 xl:flex-1 xl:overflow-y-auto">
        <div className="grid min-h-0 gap-3 xl:flex-1 xl:grid-cols-[minmax(13rem,0.34fr)_minmax(0,1fr)]">
          {bestRecommendation ? (
            <section className="rounded-lg border border-sky-400/35 bg-sky-400/10 p-3 text-sky-900 shadow-inner shadow-white/10 dark:text-sky-50 xl:min-h-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal">
                <Trophy className="size-4" aria-hidden="true" />
                Melhor opção
              </div>
              <p className="mt-2 text-xl font-semibold tracking-normal xl:text-2xl">
                {formatRecommendationDate(bestRecommendation.date)}
              </p>
              <p className="mt-1 text-sm">
                {comparison.bestDay?.score ?? 0}/100 ·{" "}
                {formatWindowSummary(bestRecommendation.bestWindow)}
              </p>
            </section>
          ) : null}

          <ol
            className={cn(
              "grid min-h-0 gap-2",
              bestRecommendation ? "" : "xl:col-span-2",
              "xl:grid-cols-2 xl:content-start",
            )}
            aria-label="Comparação de dias da semana"
          >
            {comparison.days.map((item) => {
              const recommendation = item.recommendation;
              const confidence = recommendation.bestWindow?.confidence.level;

              return (
                <li
                  key={recommendation.date}
                  className={cn(
                    "rounded-lg border p-3",
                    item.isRecommended
                      ? "border-sky-400/30 bg-sky-400/10 shadow-inner shadow-white/5"
                      : "cockpit-surface",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-background/70 text-xs font-semibold">
                          {item.position}
                        </span>
                        <p className="truncate font-medium">
                          {formatRecommendationDate(recommendation.date)}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="size-3" aria-hidden="true" />
                          {formatWindowSummary(recommendation.bestWindow)}
                        </span>
                        {confidence ? (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="size-3" aria-hidden="true" />
                            Confiança {formatForecastConfidenceLevel(confidence)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <AlertCircle className="size-3" aria-hidden="true" />
                            Sem janela boa
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3" aria-hidden="true" />
                          {recommendation.date}
                        </span>
                      </div>
                    </div>
                    <DayBadge item={item} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-4 text-muted-foreground">
                    {getRecommendationRankingReason(recommendation)}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

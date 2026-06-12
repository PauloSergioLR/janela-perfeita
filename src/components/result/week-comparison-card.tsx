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
    <Card className="overflow-hidden rounded-lg border-border/80 bg-white shadow-sm dark:bg-card">
      <CardHeader className="border-b border-slate-100 bg-slate-50/70 dark:border-border dark:bg-muted/30">
        <CardTitle>Melhor dia da semana</CardTitle>
        <CardDescription>
          {comparison.activity.name} em {formatCityLabel(comparison.city)}
        </CardDescription>
        <ShareResultButton title="Janela Perfeita" text={shareText} />
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        {bestRecommendation ? (
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-50">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal">
              <Trophy className="size-4" aria-hidden="true" />
              Melhor opção
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-normal">
              {formatRecommendationDate(bestRecommendation.date)}
            </p>
            <p className="mt-1 text-sm">
              {comparison.bestDay?.score ?? 0}/100 ·{" "}
              {formatWindowSummary(bestRecommendation.bestWindow)}
            </p>
          </div>
        ) : null}

        <ol className="space-y-3" aria-label="Comparação de dias da semana">
          {comparison.days.map((item) => {
            const recommendation = item.recommendation;
            const confidence = recommendation.bestWindow?.confidence.level;

            return (
              <li
                key={recommendation.date}
                className={cn(
                  "rounded-lg border p-3",
                  item.isRecommended
                    ? "border-sky-200 bg-sky-50/60 dark:border-sky-900/50 dark:bg-sky-950/20"
                    : "border-border bg-muted/30",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-background text-xs font-semibold">
                        {item.position}
                      </span>
                      <p className="font-medium">
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
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {getRecommendationRankingReason(recommendation)}
                </p>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

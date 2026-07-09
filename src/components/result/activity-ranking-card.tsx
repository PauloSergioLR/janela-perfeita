import { AlertCircle, CheckCircle2, Clock3, Trophy } from "lucide-react";
import type { ActivityRankingItem, ActivityRanking } from "@/types";
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
  formatAvailabilityNotice,
  formatForecastConfidenceLevel,
  formatRecommendationDate,
} from "@/lib/ui/recommendation-result";
import {
  formatWindowSummary,
  getRecommendationRankingReason,
} from "@/lib/ui/exploration-result";
import { buildActivityRankingShareText } from "@/lib/ui/share-result";
import { formatCityLabel } from "@/lib/ui/search-page";
import { cn } from "@/lib/utils";

interface ActivityRankingCardProps {
  ranking: ActivityRanking;
}

function RecommendationBadge({ item }: { item: ActivityRankingItem }) {
  return item.isRecommended ? (
    <Badge className="h-7 shrink-0 bg-emerald-600 text-white hover:bg-emerald-600">
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

export function ActivityRankingCard({ ranking }: ActivityRankingCardProps) {
  const bestRecommendation = ranking.bestActivity?.recommendation;
  const shareText = buildActivityRankingShareText(ranking);
  const availabilityNotice = ranking.availability
    ? formatAvailabilityNotice(ranking.availability)
    : null;

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
            <CardTitle className="mt-1">Ranking de atividades</CardTitle>
            <CardDescription className="line-clamp-1">
              {formatCityLabel(ranking.city)} ·{" "}
              {formatRecommendationDate(ranking.date)}
            </CardDescription>
          </div>
          <div className="shrink-0">
            <ShareResultButton title="Janela Perfeita" text={shareText} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-col gap-3 p-3 sm:p-4 xl:flex-1">
        {availabilityNotice ? (
          <div className="rounded-lg border border-sky-400/30 bg-sky-400/10 p-3 text-xs leading-4 text-sky-900 dark:text-sky-100">
            {availabilityNotice}
          </div>
        ) : null}

        <div className="grid min-h-0 gap-3 xl:flex-1 xl:grid-cols-[minmax(13rem,0.34fr)_minmax(0,1fr)]">
          {bestRecommendation ? (
            <section className="rounded-lg border border-emerald-400/35 bg-emerald-400/10 p-3 text-emerald-900 shadow-inner shadow-white/10 dark:text-emerald-50 xl:min-h-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal">
                <Trophy className="size-4" aria-hidden="true" />
                Mais recomendada
              </div>
              <p className="mt-2 text-xl font-semibold tracking-normal xl:text-2xl">
                {bestRecommendation.activity.name}
              </p>
              <p className="mt-1 text-sm">
                {ranking.bestActivity?.score ?? 0}/100 ·{" "}
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
            aria-label="Ranking de atividades recomendadas"
          >
            {ranking.items.map((item) => {
              const recommendation = item.recommendation;
              const confidence = recommendation.bestWindow?.confidence.level;

              return (
                <li
                  key={recommendation.activity.id}
                  className={cn(
                    "rounded-lg border p-3",
                    item.isRecommended
                      ? "border-emerald-400/30 bg-emerald-400/10 shadow-inner shadow-white/5"
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
                          {recommendation.activity.name}
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
                            Janela abaixo do mínimo
                          </span>
                        )}
                      </div>
                    </div>
                    <RecommendationBadge item={item} />
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

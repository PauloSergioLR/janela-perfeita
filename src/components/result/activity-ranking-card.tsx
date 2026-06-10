import { AlertCircle, CheckCircle2, Clock3, Trophy } from "lucide-react";
import type { ActivityRankingItem, ActivityRanking } from "@/types";
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
import { formatCityLabel } from "@/lib/ui/search-page";
import { cn } from "@/lib/utils";

interface ActivityRankingCardProps {
  ranking: ActivityRanking;
}

function RecommendationBadge({ item }: { item: ActivityRankingItem }) {
  return item.isRecommended ? (
    <Badge className="h-7 bg-emerald-600 text-white hover:bg-emerald-600">
      {item.score}/100
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="h-7 border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
    >
      Não recomendado
    </Badge>
  );
}

export function ActivityRankingCard({ ranking }: ActivityRankingCardProps) {
  const bestRecommendation = ranking.bestActivity?.recommendation;

  return (
    <Card className="overflow-hidden rounded-lg border-border/80 bg-white shadow-sm dark:bg-card">
      <CardHeader className="border-b border-slate-100 bg-slate-50/70 dark:border-border dark:bg-muted/30">
        <CardTitle>Ranking de atividades</CardTitle>
        <CardDescription>
          {formatCityLabel(ranking.city)} · {formatRecommendationDate(ranking.date)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5">
        {bestRecommendation ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-50">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal">
              <Trophy className="size-4" />
              Mais recomendada
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-normal">
              {bestRecommendation.activity.name}
            </p>
            <p className="mt-1 text-sm">
              {ranking.bestActivity?.score ?? 0}/100 ·{" "}
              {formatWindowSummary(bestRecommendation.bestWindow)}
            </p>
          </div>
        ) : null}

        <ol className="space-y-3">
          {ranking.items.map((item) => {
            const recommendation = item.recommendation;
            const confidence = recommendation.bestWindow?.confidence.level;

            return (
              <li
                key={recommendation.activity.id}
                className={cn(
                  "rounded-lg border p-3",
                  item.isRecommended
                    ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                    : "border-border bg-muted/30",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-background text-xs font-semibold">
                        {item.position}
                      </span>
                      <p className="font-medium">{recommendation.activity.name}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3" />
                        {formatWindowSummary(recommendation.bestWindow)}
                      </span>
                      {confidence ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          Confiança {formatForecastConfidenceLevel(confidence)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <AlertCircle className="size-3" />
                          Janela abaixo do mínimo
                        </span>
                      )}
                    </div>
                  </div>
                  <RecommendationBadge item={item} />
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

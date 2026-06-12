import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Gauge,
  MapPin,
  ShieldCheck,
  Timer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";
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
  formatDurationHours,
  formatForecastConfidenceLevel,
  formatRecommendationDate,
  formatRecommendationLocation,
  getAlternativeWindows,
  getPeakHourScore,
  getPrimaryReason,
} from "@/lib/ui/recommendation-result";
import { buildRecommendationShareText } from "@/lib/ui/share-result";
import { cn } from "@/lib/utils";
import type { Recommendation, RuleResult } from "@/types";

interface RecommendationCardProps {
  recommendation: Recommendation;
}

function getScoreTone(score: number): string {
  if (score >= 75) {
    return "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-50";
  }

  if (score >= 55) {
    return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-50";
  }

  return "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-50";
}

function getConfidenceTone(level: string): string {
  if (level === "alta") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100";
  }

  if (level === "media") {
    return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100";
  }

  return "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-100";
}

function sortByImpact(a: RuleResult, b: RuleResult): number {
  return (
    b.score - a.score || b.weight - a.weight || a.label.localeCompare(b.label)
  );
}

function sortByPenalty(a: RuleResult, b: RuleResult): number {
  return (
    a.score - b.score || b.weight - a.weight || a.label.localeCompare(b.label)
  );
}

function getFactorGroups(recommendation: Recommendation): {
  positive: RuleResult[];
  attention: RuleResult[];
} {
  const sourceScore = recommendation.bestWindow
    ? getPeakHourScore(recommendation.bestWindow.scores)
    : getPeakHourScore(recommendation.scores);
  const rules = sourceScore?.breakdown ?? [];

  return {
    positive: rules
      .filter((rule) => rule.score >= 70)
      .sort(sortByImpact)
      .slice(0, 3),
    attention: rules
      .filter((rule) => rule.score < 70)
      .sort(sortByPenalty)
      .slice(0, 3),
  };
}

function FactorList({
  title,
  icon,
  rules,
}: {
  title: string;
  icon: ReactNode;
  rules: RuleResult[];
}) {
  if (rules.length === 0) {
    return null;
  }

  return (
      <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-950 dark:text-slate-50">
        {icon}
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {rules.map((rule) => (
          <Badge
            key={`${rule.factor}-${rule.score}`}
            variant="outline"
            className="min-h-8 max-w-full justify-start gap-2 whitespace-normal border-slate-200 bg-white px-3 py-1 text-left text-slate-700 dark:border-border dark:bg-muted/30 dark:text-slate-200"
          >
            <span className="font-medium text-slate-950 dark:text-slate-50">
              {rule.label}
            </span>
            <span>{rule.score}/100</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const bestWindow = recommendation.bestWindow;
  const fallbackScore = getPeakHourScore(recommendation.scores);
  const displayScore = bestWindow?.avgScore ?? fallbackScore?.score ?? 0;
  const alternatives = getAlternativeWindows(recommendation.windows);
  const timeLabel = bestWindow
    ? `${bestWindow.startLabel} - ${bestWindow.endLabel}`
    : fallbackScore
      ? `${fallbackScore.hourLabel} foi o melhor horário isolado`
      : "Sem horário avaliado";
  const factorGroups = getFactorGroups(recommendation);
  const primaryReason =
    bestWindow?.highlights[0] ??
    (fallbackScore ? getPrimaryReason(fallbackScore) : null);
  const shareText = buildRecommendationShareText(recommendation);

  return (
    <Card className="overflow-hidden rounded-lg border-border/80 bg-white shadow-sm dark:bg-card">
      <CardHeader className="gap-3 border-b border-slate-100 bg-slate-50/70 dark:border-border dark:bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Recomendação</CardTitle>
            <CardDescription>
              {recommendation.activity.name} em{" "}
              {formatRecommendationLocation(recommendation)}
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge
              variant="outline"
              className={cn(
                "h-7 px-3",
                bestWindow
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100"
                  : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100",
              )}
            >
              {bestWindow ? (
                <CheckCircle2 className="size-3" aria-hidden="true" />
              ) : (
                <AlertTriangle className="size-3" aria-hidden="true" />
              )}
              {bestWindow ? "Janela ideal" : "Sem janela ideal"}
            </Badge>
            <ShareResultButton
              title="Janela Perfeita"
              text={shareText}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(130px,0.45fr)_minmax(0,1fr)]">
          <div
            className={cn(
              "flex min-h-36 flex-col justify-between rounded-lg border p-4",
              getScoreTone(displayScore),
            )}
          >
            <span className="text-xs font-medium uppercase tracking-wider">
              Score
            </span>
            <div>
              <span className="text-5xl leading-none font-semibold">
                {displayScore}
              </span>
              <span className="ml-1 text-sm font-medium">/100</span>
            </div>
            <span className="text-xs">
              Mínimo {recommendation.activity.minRecommendedScore}/100
            </span>
          </div>

          <div className="grid gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-border dark:bg-muted/20">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-300">
                <Timer className="size-4 text-sky-700" aria-hidden="true" />
                Janela recomendada
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                {timeLabel}
              </p>
              <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-cyan-700" aria-hidden="true" />
                  {formatRecommendationDate(recommendation.date)}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-sky-700" aria-hidden="true" />
                  {formatRecommendationLocation(recommendation)}
                </div>
              </div>
            </div>

            {bestWindow ? (
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-border dark:bg-muted/20">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-950 dark:text-slate-50">
                  <ShieldCheck className="size-4 text-emerald-700" aria-hidden="true" />
                  Confiança da previsão
                </div>
                <div className="mt-2 flex flex-wrap items-start gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-7 px-3",
                      getConfidenceTone(bestWindow.confidence.level),
                    )}
                  >
                    {formatForecastConfidenceLevel(
                      bestWindow.confidence.level,
                    )}
                  </Badge>
                  <p className="min-w-0 flex-1 text-sm leading-6 text-muted-foreground">
                    {bestWindow.confidence.reason}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">
                Nenhuma janela atingiu o mínimo de{" "}
                {recommendation.activity.minRecommendedScore}/100. O melhor
                horário isolado ainda aparece para comparação.
              </div>
            )}
          </div>
        </div>

        {primaryReason ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-border dark:bg-muted/30">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-950 dark:text-slate-50">
              <Gauge className="size-4 text-emerald-700" aria-hidden="true" />
              Motivo principal
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {primaryReason}
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <FactorList
            title="Fatores a favor"
            icon={<TrendingUp className="size-4 text-emerald-700" aria-hidden="true" />}
            rules={factorGroups.positive}
          />
          <FactorList
            title="Pontos de atenção"
            icon={<TrendingDown className="size-4 text-amber-700" aria-hidden="true" />}
            rules={factorGroups.attention}
          />
        </div>

        {alternatives.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-950 dark:text-slate-50">
              Alternativas
            </h3>
            <div className="grid gap-2">
              {alternatives.map((window) => (
                <div
                  key={`${window.startTime}-${window.endTime}`}
                  className="grid gap-3 rounded-lg border border-border bg-white px-3 py-3 text-sm dark:bg-muted/20 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium text-slate-950 dark:text-slate-50">
                      {window.startLabel} - {window.endLabel}
                    </p>
                    <p className="line-clamp-2 text-muted-foreground">
                      {formatDurationHours(window.durationHours)}
                      {window.highlights[0] ? ` - ${window.highlights[0]}` : ""}
                    </p>
                    <p className="text-muted-foreground">
                      Confiança{" "}
                      {formatForecastConfidenceLevel(
                        window.confidence.level,
                      ).toLowerCase()}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="h-8 shrink-0 justify-self-start border-sky-200 bg-sky-50 px-3 text-sky-900 sm:justify-self-end"
                  >
                    {window.avgScore}/100
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

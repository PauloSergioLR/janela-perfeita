import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { ReasonChips } from "@/components/result/reason-chips";
import { ShareResultButton } from "@/components/result/share-result-button";
import { ScoreRing } from "@/components/result/score-ring";
import { WeatherStatsPanel } from "@/components/result/weather-stats-panel";
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
  formatDecisionWindow,
  formatForecastConfidenceLevel,
  formatRecommendationDate,
  formatRecommendationLocation,
  formatWindowTimeRange,
  getAlternativeWindows,
  getPeakHourScore,
} from "@/lib/ui/recommendation-result";
import { getScoreRingBand, type ScoreRingTone } from "@/lib/ui/score-ring";
import { buildRecommendationShareText } from "@/lib/ui/share-result";
import { cn } from "@/lib/utils";
import type { ModelAgreement, Recommendation } from "@/types";

interface RecommendationCardProps {
  recommendation: Recommendation;
}

function getScoreTone(tone: ScoreRingTone): string {
  if (tone === "success") {
    return "border-success/55 bg-success/10 text-success";
  }

  if (tone === "accent") {
    return "border-weather-accent/55 bg-weather-accent/10 text-weather-accent";
  }

  if (tone === "warning") {
    return "border-warning/55 bg-warning/10 text-warning";
  }

  if (tone === "caution") {
    return "border-amber-400/55 bg-amber-400/10 text-amber-300";
  }

  return "border-danger/55 bg-danger/10 text-danger";
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

function formatModelAgreementLevel(level: ModelAgreement["level"]): string {
  if (level === "alta") {
    return "Alta";
  }

  if (level === "media") {
    return "Média";
  }

  return "Baixa";
}

function getAgreementTone(level: ModelAgreement["level"]): string {
  if (level === "alta") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-100";
  }

  if (level === "media") {
    return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100";
  }

  return "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-100";
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const bestWindow = recommendation.bestWindow;
  const fallbackScore = getPeakHourScore(recommendation.scores);
  const resultScore = bestWindow
    ? getPeakHourScore(bestWindow.scores)
    : fallbackScore;
  const displayScore = bestWindow?.avgScore ?? resultScore?.score ?? 0;
  const alternatives = getAlternativeWindows(recommendation.windows);
  const decisionWindow = formatDecisionWindow(bestWindow);
  const scoreBand = getScoreRingBand(displayScore);
  const qualityLabel = scoreBand.label;
  const scoreTone = getScoreTone(scoreBand.tone);
  const reasonRules = resultScore?.breakdown ?? [];
  const modelAgreement = recommendation.modelAgreement;
  const worstDivergence = modelAgreement?.divergences[0];
  const providerComparison = recommendation.providerComparison;
  const worstProviderDivergence = providerComparison?.divergences[0];
  const shareText = buildRecommendationShareText(recommendation);
  const timeFilterNotice =
    recommendation.availabilityNotice ?? recommendation.timeWindowNotice;

  return (
    <Card className="glass-card overflow-hidden rounded-xl">
      <CardHeader className="gap-3 border-b border-soft bg-weather-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-weather-accent">
              Decisão principal
            </p>
            <CardTitle className="mt-1">Recomendação</CardTitle>
            <CardDescription>
              {recommendation.activity.name} ·{" "}
              {formatRecommendationLocation(recommendation)} ·{" "}
              {formatRecommendationDate(recommendation.date)}
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge
              variant="outline"
              className={cn(
                "h-7 px-3",
                scoreTone,
              )}
            >
              {bestWindow ? (
                <CheckCircle2 className="size-3" aria-hidden="true" />
              ) : (
                <AlertTriangle className="size-3" aria-hidden="true" />
              )}
              {qualityLabel}
            </Badge>
            <ShareResultButton
              title="Janela Perfeita"
              text={shareText}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(180px,0.48fr)_minmax(0,1fr)]">
          <div className="grid min-h-52 place-items-center rounded-lg border border-soft bg-weather-card/65 p-4">
            <div className="grid place-items-center gap-2">
              <ScoreRing score={displayScore} />
              <span className="text-xs text-muted-foreground">
                Mínimo {recommendation.activity.minRecommendedScore}/100
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="border-y border-soft py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-300">
                <Timer className="size-4 text-weather-accent" aria-hidden="true" />
                Janela recomendada
              </div>
              <p className="mt-2 text-4xl font-semibold text-slate-950 dark:text-slate-50">
                {decisionWindow}
              </p>
              {bestWindow ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Duração: {formatDurationHours(bestWindow.durationHours)}
                </p>
              ) : null}
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
              <div className="border-b border-soft pb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-950 dark:text-slate-50">
                  <ShieldCheck className="size-4 text-success" aria-hidden="true" />
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
              <div className="border-b border-warning/45 pb-4 text-sm leading-6 text-warning">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="size-4" aria-hidden="true" />
                  Sem janela ideal
                </div>
                <p className="mt-2">
                Nenhuma janela atingiu o mínimo de{" "}
                {recommendation.activity.minRecommendedScore}/100. O melhor
                horário isolado ainda aparece para comparação.
                </p>
              </div>
            )}
          </div>
        </div>

        {timeFilterNotice ? (
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-100">
            {timeFilterNotice}
          </div>
        ) : null}

        <ReasonChips rules={reasonRules} />

        <WeatherStatsPanel
          weather={resultScore?.weather ?? null}
          sunrise={recommendation.sunrise}
          sunset={recommendation.sunset}
        />

        {modelAgreement ? (
          <div
            className={cn(
              "rounded-lg border p-4 text-sm leading-6",
              getAgreementTone(modelAgreement.level),
            )}
          >
            <div className="flex items-center gap-2 font-medium">
              {modelAgreement.level === "alta" ? (
                <ShieldCheck className="size-4" aria-hidden="true" />
              ) : (
                <AlertTriangle className="size-4" aria-hidden="true" />
              )}
              Concordância entre modelos:{" "}
              {formatModelAgreementLevel(modelAgreement.level)} (
              {modelAgreement.score}/100)
            </div>
            <p className="mt-2">{modelAgreement.reason}</p>
            {worstDivergence ? (
              <p className="mt-1">
                Maior divergência: {worstDivergence.reason}
              </p>
            ) : null}
          </div>
        ) : null}

        {providerComparison ? (
          <div
            className={cn(
              "rounded-lg border p-4 text-sm leading-6",
              getAgreementTone(providerComparison.level),
            )}
          >
            <div className="flex items-center gap-2 font-medium">
              {providerComparison.level === "alta" ? (
                <ShieldCheck className="size-4" aria-hidden="true" />
              ) : (
                <AlertTriangle className="size-4" aria-hidden="true" />
              )}
              Concordância entre fontes:{" "}
              {formatModelAgreementLevel(providerComparison.level)} (
              {providerComparison.score}/100)
            </div>
            <p className="mt-2">{providerComparison.reason}</p>
            {worstProviderDivergence ? (
              <p className="mt-1">
                Maior divergência: {worstProviderDivergence.reason}
              </p>
            ) : null}
          </div>
        ) : null}

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
                      {formatWindowTimeRange(window)}
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

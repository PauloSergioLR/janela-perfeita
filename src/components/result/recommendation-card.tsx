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
import { getForecastConfidenceIcon } from "@/lib/ui/icon-system";
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
  const ConfidenceIcon = bestWindow
    ? getForecastConfidenceIcon(bestWindow.confidence.level)
    : null;
  const confidenceIconClassName =
    bestWindow?.confidence.level === "alta"
      ? "text-success"
      : bestWindow?.confidence.level === "media"
        ? "text-warning"
        : "text-danger";

  return (
    <Card className="glass-card relative rounded-xl">
      <CardHeader className="gap-1.5 border-b border-soft bg-weather-card p-2.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-weather-accent">Melhor janela para</p>
            <CardTitle className="mt-0.5 text-xl">{recommendation.activity.name}</CardTitle>
            <CardDescription className="text-xs">
              {formatRecommendationLocation(recommendation)} · {formatRecommendationDate(recommendation.date)}
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

      <CardContent className="space-y-2.5 p-2.5">
        <div className="grid gap-3 xl:grid-cols-[minmax(144px,0.38fr)_minmax(0,1fr)_minmax(280px,0.82fr)]">
          <div className="grid min-h-0 place-items-center rounded-lg border border-soft bg-weather-card/65 p-2">
            <div className="grid place-items-center gap-2">
              <ScoreRing score={displayScore} className="w-28 sm:w-32" />
              <span className="text-[10px] text-muted-foreground">
                Mínimo {recommendation.activity.minRecommendedScore}/100
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="rounded-lg border border-soft bg-background/25 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-300">
                <Timer className="size-4 text-weather-accent" aria-hidden="true" />
                Janela recomendada
              </div>
              <p className="mt-1.5 text-3xl font-semibold text-slate-950 dark:text-slate-50">
                {decisionWindow}
              </p>
              {bestWindow ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Duração: {formatDurationHours(bestWindow.durationHours)}
                </p>
              ) : null}
              <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
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
              <div className="rounded-lg border border-soft bg-weather-card/45 p-2.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-950 dark:text-slate-50">
                  {ConfidenceIcon ? (
                    <ConfidenceIcon
                      className={cn("size-4", confidenceIconClassName)}
                      aria-hidden="true"
                    />
                  ) : null}
                  Confiança da previsão
                </div>
                <div className="mt-1.5 flex flex-wrap items-start gap-2">
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
                  <p className="min-w-0 flex-1 text-xs leading-4 text-muted-foreground">
                    {bestWindow.confidence.reason}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-xl border border-warning/45 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--warning)_14%,transparent),transparent_64%)] p-3 text-xs leading-5 text-warning">
                <div
                  aria-hidden="true"
                  className="absolute -right-10 -bottom-14 size-32 rounded-full bg-warning/15 blur-3xl"
                />
                <div className="relative">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="flex size-7 items-center justify-center rounded-lg border border-warning/45 bg-warning/12">
                      <AlertTriangle className="size-3.5" aria-hidden="true" />
                    </span>
                    Sem janela ideal hoje
                  </div>
                  <p className="mt-2">
                    Nenhuma janela atingiu o mínimo de{" "}
                    {recommendation.activity.minRecommendedScore}/100. O melhor
                    horário isolado ainda aparece para comparação.
                  </p>
                </div>
              </div>
            )}
          </div>
          <WeatherStatsPanel
            compact
            weather={resultScore?.weather ?? null}
            sunrise={recommendation.sunrise}
            sunset={recommendation.sunset}
          />
        </div>

        <ReasonChips compact rules={reasonRules} />

        <details className="group relative">
          <summary className="w-fit cursor-pointer rounded-md border border-soft bg-weather-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-weather-accent/50 hover:text-foreground">
            Ver detalhes da análise
          </summary>
          <div className="mt-2 space-y-3 lg:absolute lg:top-full lg:right-0 lg:z-40 lg:w-[min(42rem,calc(100vw-3rem))] lg:rounded-xl lg:border lg:border-soft lg:bg-popover lg:p-3 lg:shadow-weather-card">
        {timeFilterNotice ? (
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-100">
            {timeFilterNotice}
          </div>
        ) : null}

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
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

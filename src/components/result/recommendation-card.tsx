import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  MapPin,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { OpportunityTimeline } from "@/components/result/opportunity-timeline";
import { ReasonChips } from "@/components/result/reason-chips";
import { ScoreBreakdown } from "@/components/result/score-breakdown";
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
import { getForecastConfidenceIcon } from "@/lib/ui/icon-system";
import {
  formatDecisionWindow,
  formatDurationHours,
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
  const ConfidenceIcon = bestWindow
    ? getForecastConfidenceIcon(bestWindow.confidence.level)
    : null;
  const confidenceIconClassName =
    bestWindow?.confidence.level === "alta"
      ? "text-success"
      : bestWindow?.confidence.level === "media"
        ? "text-warning"
        : "text-danger";
  const hasSecondaryContext = Boolean(
    modelAgreement || providerComparison || alternatives.length > 0,
  );

  return (
    <Card
      size="sm"
      className="glass-card min-w-0 overflow-hidden rounded-xl !py-0 xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:gap-0"
    >
      <CardHeader className="cockpit-surface-strong gap-2 border-b px-3 !py-2 !pb-2 sm:px-4 xl:!py-1 xl:!pb-1 2xl:!py-2 2xl:!pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-weather-accent">
              Decisão principal
            </p>
            <CardTitle className="mt-1 text-base">Recomendação</CardTitle>
            <CardDescription className="line-clamp-1 xl:hidden 2xl:block">
              {recommendation.activity.name} ·{" "}
              {formatRecommendationLocation(recommendation)} ·{" "}
              {formatRecommendationDate(recommendation.date)}
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge variant="outline" className={cn("h-7 px-3", scoreTone)}>
              {bestWindow ? (
                <CheckCircle2 className="size-3" aria-hidden="true" />
              ) : (
                <AlertTriangle className="size-3" aria-hidden="true" />
              )}
              {qualityLabel}
            </Badge>
            <div className="xl:hidden 2xl:block">
              <ShareResultButton title="Janela Perfeita" text={shareText} />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-2 p-2 sm:p-3 xl:min-h-0 xl:flex-1 xl:grid-rows-[auto_auto_auto] xl:gap-1 xl:p-2 2xl:p-3">
        <div className="grid min-w-0 gap-2 xl:grid-cols-[minmax(145px,0.34fr)_minmax(0,1.1fr)_minmax(220px,0.56fr)] xl:gap-1">
          <section className="score-orb grid min-h-36 place-items-center rounded-lg border border-weather-accent/25 bg-weather-card/65 p-2 shadow-inner shadow-white/10 xl:min-h-28 2xl:min-h-40">
            <div className="grid place-items-center gap-2">
              <ScoreRing score={displayScore} className="!w-28 2xl:!w-44" />
              <span className="text-xs text-muted-foreground">
                Mínimo {recommendation.activity.minRecommendedScore}/100
              </span>
            </div>
          </section>

          <section className="cockpit-surface grid min-w-0 content-start gap-2 rounded-lg border p-2 xl:min-h-28 2xl:min-h-40">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-slate-500 dark:text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <Timer
                    className="size-4 text-weather-accent"
                    aria-hidden="true"
                  />
                  Janela recomendada
                </span>
                {bestWindow ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "hidden h-6 px-2 text-xs xl:inline-flex 2xl:hidden",
                      getConfidenceTone(bestWindow.confidence.level),
                    )}
                  >
                    {formatForecastConfidenceLevel(
                      bestWindow.confidence.level,
                    )}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-xl leading-tight font-semibold text-slate-950 dark:text-slate-50 2xl:text-3xl">
                {decisionWindow}
              </p>
              {bestWindow ? (
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {recommendation.activity.name} ·{" "}
                  {formatDurationHours(bestWindow.durationHours)}
                </p>
              ) : (
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {recommendation.activity.name}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground xl:hidden 2xl:flex">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <CalendarDays className="size-3.5 shrink-0 text-cyan-700" aria-hidden="true" />
                  {formatRecommendationDate(recommendation.date)}
                </span>
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0 text-sky-700" aria-hidden="true" />
                  <span className="truncate">
                    {formatRecommendationLocation(recommendation)}
                  </span>
                </span>
              </div>
            </div>

            {bestWindow ? (
              <div className="cockpit-surface hidden rounded-lg border p-2 2xl:block">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-950 dark:text-slate-50">
                  {ConfidenceIcon ? (
                    <ConfidenceIcon
                      className={cn("size-4", confidenceIconClassName)}
                      aria-hidden="true"
                    />
                  ) : null}
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
                  <p className="min-w-0 flex-1 text-xs leading-4 text-muted-foreground line-clamp-2">
                    {bestWindow.confidence.reason}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative rounded-lg border border-warning/45 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--warning)_14%,transparent),transparent_64%)] p-2 text-xs leading-4 text-warning">
                <div className="flex items-center gap-2 font-medium">
                  <span className="flex size-7 items-center justify-center rounded-lg border border-warning/45 bg-warning/12">
                    <AlertTriangle className="size-3.5" aria-hidden="true" />
                  </span>
                  Sem janela ideal hoje
                </div>
                <p className="mt-1 line-clamp-2">
                  Nenhuma janela atingiu o mínimo de{" "}
                  {recommendation.activity.minRecommendedScore}/100. O melhor
                  horário isolado ainda aparece para comparação.
                </p>
              </div>
            )}

            {timeFilterNotice ? (
              <div className="line-clamp-2 rounded-lg border border-sky-200 bg-sky-50 p-2 text-xs leading-4 text-sky-950 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-100">
                {timeFilterNotice}
              </div>
            ) : null}

            <ReasonChips rules={reasonRules} density="compact" />
            <ScoreBreakdown
              recommendation={recommendation}
              variant="compact"
            />
          </section>

          <aside className="cockpit-surface min-w-0 rounded-lg border p-2 xl:min-h-28 2xl:min-h-40">
            <WeatherStatsPanel
              weather={resultScore?.weather ?? null}
              sunrise={recommendation.sunrise}
              sunset={recommendation.sunset}
              variant="compact"
            />
          </aside>
        </div>

        <OpportunityTimeline
          recommendation={recommendation}
          variant="embedded"
        />

        {hasSecondaryContext ? (
          <div className="grid min-w-0 gap-2 lg:grid-cols-3 xl:auto-rows-fr">
            {modelAgreement ? (
              <div
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm leading-5",
                  getAgreementTone(modelAgreement.level),
                )}
              >
                <div className="flex items-center gap-2 font-medium">
                  {modelAgreement.level === "alta" ? (
                    <ShieldCheck className="size-4" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="size-4" aria-hidden="true" />
                  )}
                  Modelos: {formatModelAgreementLevel(modelAgreement.level)} (
                  {modelAgreement.score}/100)
                </div>
                <p className="mt-1 line-clamp-2">{modelAgreement.reason}</p>
                {worstDivergence ? (
                  <p className="mt-1 line-clamp-1 text-xs">
                    Maior divergência: {worstDivergence.reason}
                  </p>
                ) : null}
              </div>
            ) : null}

            {providerComparison ? (
              <div
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm leading-5",
                  getAgreementTone(providerComparison.level),
                )}
              >
                <div className="flex items-center gap-2 font-medium">
                  {providerComparison.level === "alta" ? (
                    <ShieldCheck className="size-4" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="size-4" aria-hidden="true" />
                  )}
                  Fontes: {formatModelAgreementLevel(providerComparison.level)} (
                  {providerComparison.score}/100)
                </div>
                <p className="mt-1 line-clamp-2">{providerComparison.reason}</p>
                {worstProviderDivergence ? (
                  <p className="mt-1 line-clamp-1 text-xs">
                    Maior divergência: {worstProviderDivergence.reason}
                  </p>
                ) : null}
              </div>
            ) : null}

            {alternatives.length > 0 ? (
              <details className="cockpit-surface group rounded-lg border p-3 lg:col-span-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-slate-950 dark:text-slate-50 [&::-webkit-details-marker]:hidden">
                  <span>Alternativas</span>
                  <span className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="h-7 border-weather-accent/45 bg-weather-accent/10 px-3 text-weather-accent"
                    >
                      {alternatives.length}
                    </Badge>
                    <ChevronDown
                      className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </span>
                </summary>
                <div className="mt-3 grid gap-2">
                  {alternatives.map((window) => (
                    <div
                      key={`${window.startTime}-${window.endTime}`}
                      className="grid gap-2 rounded-lg border border-soft bg-background/35 px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-950 dark:text-slate-50">
                          {formatWindowTimeRange(window)}
                        </p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {formatDurationHours(window.durationHours)}
                          {window.highlights[0]
                            ? ` · ${window.highlights[0]}`
                            : ""}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="h-7 shrink-0 justify-self-start border-sky-200 bg-sky-50 px-3 text-sky-900 sm:justify-self-end"
                      >
                        {window.avgScore}/100
                      </Badge>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Layers3,
  ListChecks,
  MapPin,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { BottomForecastStrip } from "@/components/result/forecast-strip";
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
import type { Recommendation, WeeklyWeatherOverview } from "@/types";

interface RecommendationCardProps {
  recommendation: Recommendation;
  forecastOverview?: WeeklyWeatherOverview;
}

type RecommendationTabId =
  | "summary"
  | "hourly"
  | "next-days"
  | "week"
  | "stats"
  | "alternatives";

interface RecommendationTabOption {
  id: RecommendationTabId;
  label: string;
  icon: LucideIcon;
}

const RECOMMENDATION_TABS = [
  { id: "summary", label: "Resumo", icon: CheckCircle2 },
  { id: "hourly", label: "Por hora", icon: Clock3 },
  { id: "next-days", label: "Próximos dias", icon: CalendarDays },
  { id: "week", label: "Semana", icon: CalendarRange },
  { id: "stats", label: "Estatísticas", icon: BarChart3 },
  { id: "alternatives", label: "Alternativas", icon: Layers3 },
] satisfies RecommendationTabOption[];

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

function ForecastEmptyState({ title }: { title: string }) {
  return (
    <div className="cockpit-surface grid min-h-48 place-items-center rounded-lg border p-4 text-center">
      <div className="max-w-sm">
        <CalendarDays
          className="mx-auto size-7 text-weather-accent"
          aria-hidden="true"
        />
        <h3 className="mt-3 text-sm font-semibold text-slate-950 dark:text-slate-50">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          A previsão complementar não veio nesta consulta. Refaça a busca para
          atualizar os próximos dias.
        </p>
      </div>
    </div>
  );
}

export function RecommendationCard({
  recommendation,
  forecastOverview,
}: RecommendationCardProps) {
  const [activeTab, setActiveTab] =
    useState<RecommendationTabId>("summary");
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
  const forecastSubtitle = `${formatRecommendationLocation(
    recommendation,
  )} · ${formatRecommendationDate(recommendation.date)}`;

  return (
    <Card
      size="sm"
      className="glass-card min-w-0 overflow-hidden rounded-xl !py-0 xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:gap-0"
    >
      <CardHeader className="cockpit-surface-strong gap-2 border-b px-3 !py-2 !pb-2 sm:px-4 xl:!py-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-weather-accent">
              Decisão principal
            </p>
            <CardTitle className="mt-1 text-base">Recomendação</CardTitle>
            <CardDescription className="line-clamp-1">
              {recommendation.activity.name} ·{" "}
              {formatRecommendationLocation(recommendation)} ·{" "}
              {formatRecommendationDate(recommendation.date)}
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="outline" className={cn("h-7 px-3", scoreTone)}>
              {bestWindow ? (
                <CheckCircle2 className="size-3" aria-hidden="true" />
              ) : (
                <AlertTriangle className="size-3" aria-hidden="true" />
              )}
              {qualityLabel}
            </Badge>
            <ShareResultButton title="Janela Perfeita" text={shareText} />
          </div>
        </div>

        <div
          className="scrollbar-none flex min-w-0 gap-1 overflow-x-auto rounded-lg border border-soft bg-background/35 p-1"
          role="tablist"
          aria-label="Explorar resultado"
        >
          {RECOMMENDATION_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                id={`recommendation-tab-${tab.id}`}
                className={cn(
                  "inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-weather-card hover:text-weather-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  isActive &&
                    "cockpit-active text-slate-950 shadow-weather-glow dark:text-slate-50",
                )}
                role="tab"
                aria-controls={`recommendation-panel-${tab.id}`}
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-3 xl:min-h-0 xl:flex-1 xl:overflow-hidden">
        {activeTab === "summary" ? (
          <section
            id="recommendation-panel-summary"
            className="grid min-h-0 gap-2 xl:h-full xl:grid-rows-[minmax(0,1fr)_auto]"
            role="tabpanel"
            aria-labelledby="recommendation-tab-summary"
          >
            <div className="grid min-w-0 gap-2 xl:min-h-0 xl:grid-cols-[minmax(150px,0.34fr)_minmax(0,1fr)_minmax(210px,0.5fr)]">
              <section className="score-orb grid min-h-40 place-items-center rounded-lg border border-weather-accent/25 bg-weather-card/65 p-3 shadow-inner shadow-white/10 xl:min-h-0">
                <div className="grid place-items-center gap-2">
                  <ScoreRing score={displayScore} className="!w-32 2xl:!w-44" />
                  <span className="text-xs text-muted-foreground">
                    Mínimo {recommendation.activity.minRecommendedScore}/100
                  </span>
                </div>
              </section>

              <section className="cockpit-surface grid min-w-0 content-start gap-2 rounded-lg border p-3">
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
                          "h-6 px-2 text-xs",
                          getConfidenceTone(bestWindow.confidence.level),
                        )}
                      >
                        {formatForecastConfidenceLevel(
                          bestWindow.confidence.level,
                        )}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-2xl leading-tight font-semibold text-slate-950 dark:text-slate-50 2xl:text-4xl">
                    {decisionWindow}
                  </p>
                  {bestWindow ? (
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {recommendation.activity.name} ·{" "}
                      {formatDurationHours(bestWindow.durationHours)}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {recommendation.activity.name}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <CalendarDays
                        className="size-3.5 shrink-0 text-cyan-700"
                        aria-hidden="true"
                      />
                      {formatRecommendationDate(recommendation.date)}
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <MapPin
                        className="size-3.5 shrink-0 text-sky-700"
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {formatRecommendationLocation(recommendation)}
                      </span>
                    </span>
                  </div>
                </div>

                {bestWindow ? (
                  <div className="cockpit-surface rounded-lg border p-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-950 dark:text-slate-50">
                      {ConfidenceIcon ? (
                        <ConfidenceIcon
                          className={cn("size-4", confidenceIconClassName)}
                          aria-hidden="true"
                        />
                      ) : null}
                      Confiança da previsão
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground">
                      {bestWindow.confidence.reason}
                    </p>
                  </div>
                ) : (
                  <div className="relative rounded-lg border border-warning/45 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--warning)_14%,transparent),transparent_64%)] p-2 text-xs leading-4 text-warning">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="flex size-7 items-center justify-center rounded-lg border border-warning/45 bg-warning/12">
                        <AlertTriangle
                          className="size-3.5"
                          aria-hidden="true"
                        />
                      </span>
                      Sem janela ideal hoje
                    </div>
                    <p className="mt-1 line-clamp-2">
                      Nenhuma janela atingiu o mínimo de{" "}
                      {recommendation.activity.minRecommendedScore}/100.
                    </p>
                  </div>
                )}

                {timeFilterNotice ? (
                  <div className="line-clamp-2 rounded-lg border border-sky-200 bg-sky-50 p-2 text-xs leading-4 text-sky-950 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-sky-100">
                    {timeFilterNotice}
                  </div>
                ) : null}
              </section>

              <aside className="cockpit-surface min-w-0 rounded-lg border p-3">
                <WeatherStatsPanel
                  weather={resultScore?.weather ?? null}
                  sunrise={recommendation.sunrise}
                  sunset={recommendation.sunset}
                  variant="compact"
                  limit={4}
                />
              </aside>
            </div>

            <div className="cockpit-surface rounded-lg border p-2">
              <ReasonChips rules={reasonRules} density="compact" limit={4} />
            </div>
          </section>
        ) : null}

        {activeTab === "hourly" ? (
          <section
            id="recommendation-panel-hourly"
            className="min-h-0 xl:h-full xl:overflow-y-auto"
            role="tabpanel"
            aria-labelledby="recommendation-tab-hourly"
          >
            <OpportunityTimeline
              recommendation={recommendation}
              variant="embedded"
              className="xl:h-full"
            />
          </section>
        ) : null}

        {activeTab === "next-days" ? (
          <section
            id="recommendation-panel-next-days"
            className="min-h-0 xl:h-full"
            role="tabpanel"
            aria-labelledby="recommendation-tab-next-days"
          >
            {forecastOverview ? (
              <BottomForecastStrip
                overview={forecastOverview}
                title="Próximos dias"
                subtitle={forecastSubtitle}
                defaultView="next-days"
                showViewTabs={false}
                className="xl:h-full"
              />
            ) : (
              <ForecastEmptyState title="Próximos dias indisponíveis" />
            )}
          </section>
        ) : null}

        {activeTab === "week" ? (
          <section
            id="recommendation-panel-week"
            className="min-h-0 xl:h-full"
            role="tabpanel"
            aria-labelledby="recommendation-tab-week"
          >
            {forecastOverview ? (
              <BottomForecastStrip
                overview={forecastOverview}
                title="Semana"
                subtitle={forecastSubtitle}
                defaultView="weekly"
                showViewTabs={false}
                className="xl:h-full"
              />
            ) : (
              <ForecastEmptyState title="Semana indisponível" />
            )}
          </section>
        ) : null}

        {activeTab === "stats" ? (
          <section
            id="recommendation-panel-stats"
            className="scrollbar-none grid min-h-0 gap-3 xl:h-full xl:overflow-y-auto"
            role="tabpanel"
            aria-labelledby="recommendation-tab-stats"
          >
            <div className="cockpit-surface min-w-0 rounded-lg border p-3">
              <WeatherStatsPanel
                weather={resultScore?.weather ?? null}
                sunrise={recommendation.sunrise}
                sunset={recommendation.sunset}
                variant="wide"
              />
            </div>
            <ScoreBreakdown recommendation={recommendation} variant="compact" />
          </section>
        ) : null}

        {activeTab === "alternatives" ? (
          <section
            id="recommendation-panel-alternatives"
            className="scrollbar-none grid min-h-0 gap-3 xl:h-full xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:overflow-y-auto"
            role="tabpanel"
            aria-labelledby="recommendation-tab-alternatives"
          >
            <div className="cockpit-surface min-w-0 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                  <ListChecks
                    className="size-4 text-weather-accent"
                    aria-hidden="true"
                  />
                  Janelas alternativas
                </h3>
                <Badge
                  variant="outline"
                  className="h-7 border-weather-accent/45 bg-weather-accent/10 px-3 text-weather-accent"
                >
                  {alternatives.length}
                </Badge>
              </div>

              {alternatives.length > 0 ? (
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
                        <p className="line-clamp-2 text-xs text-muted-foreground">
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
              ) : (
                <p className="mt-3 rounded-lg border border-soft bg-background/35 p-3 text-sm text-muted-foreground">
                  Nenhuma janela alternativa ficou acima da melhor recomendação
                  para esta consulta.
                </p>
              )}
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}

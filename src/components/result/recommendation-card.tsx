import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gauge,
  MapPin,
  Sparkles,
} from "lucide-react";
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
  formatRecommendationDate,
  formatRecommendationLocation,
  getAlternativeWindows,
  getPeakHourScore,
  getPrimaryReason,
} from "@/lib/ui/recommendation-result";
import type { Recommendation } from "@/types";

interface RecommendationCardProps {
  recommendation: Recommendation;
}

function RecommendationHighlights({
  recommendation,
}: RecommendationCardProps) {
  const bestWindow = recommendation.bestWindow;
  const fallbackScore = getPeakHourScore(recommendation.scores);
  const highlights = bestWindow?.highlights.length
    ? bestWindow.highlights
    : fallbackScore
      ? [
          `Nenhuma janela atingiu o mínimo de ${recommendation.activity.minRecommendedScore}/100.`,
          getPrimaryReason(fallbackScore),
        ]
      : ["Sem horários avaliados para esta data."];

  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {highlights.map((highlight) => (
        <li key={highlight} className="flex gap-2">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-600" />
          <span>{highlight}</span>
        </li>
      ))}
    </ul>
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

  return (
    <Card className="rounded-lg border-border/80 shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Recomendação</CardTitle>
            <CardDescription>
              {recommendation.activity.name} em{" "}
              {formatRecommendationLocation(recommendation)}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={
              bestWindow
                ? "h-7 border-emerald-200 bg-emerald-50 px-3 text-emerald-800"
                : "h-7 border-amber-200 bg-amber-50 px-3 text-amber-900"
            }
          >
            {bestWindow ? (
              <CheckCircle2 className="size-3" />
            ) : (
              <AlertTriangle className="size-3" />
            )}
            {bestWindow ? "Janela ideal" : "Sem janela ideal"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <div className="flex min-h-28 min-w-28 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-950 px-4 text-white">
            <span className="text-xs font-medium text-slate-300">Score</span>
            <span className="text-4xl leading-none font-semibold">
              {displayScore}
            </span>
            <span className="text-xs text-slate-300">/100</span>
          </div>

          <dl className="grid gap-3 text-sm">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-emerald-700" />
              <div>
                <dt className="font-medium text-slate-950">Atividade</dt>
                <dd className="text-muted-foreground">
                  {recommendation.activity.name}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-sky-700" />
              <div>
                <dt className="font-medium text-slate-950">Cidade</dt>
                <dd className="text-muted-foreground">
                  {formatRecommendationLocation(recommendation)}
                </dd>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-cyan-700" />
                <div>
                  <dt className="font-medium text-slate-950">Data</dt>
                  <dd className="text-muted-foreground">
                    {formatRecommendationDate(recommendation.date)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-violet-700" />
                <div>
                  <dt className="font-medium text-slate-950">Horário</dt>
                  <dd className="text-muted-foreground">{timeLabel}</dd>
                </div>
              </div>
            </div>
          </dl>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-950">
            <Gauge className="size-4 text-emerald-700" />
            Destaques
          </div>
          <RecommendationHighlights recommendation={recommendation} />
        </div>

        {alternatives.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-950">
              Alternativas
            </h3>
            <div className="grid gap-2">
              {alternatives.map((window) => (
                <div
                  key={`${window.startTime}-${window.endTime}`}
                  className="grid gap-2 rounded-lg border border-border px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-950">
                      {window.startLabel} - {window.endLabel}
                    </p>
                    <p className="truncate text-muted-foreground">
                      {formatDurationHours(window.durationHours)}
                      {window.highlights[0] ? ` - ${window.highlights[0]}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="h-7 justify-self-start border-sky-200 bg-sky-50 px-3 text-sky-900 sm:justify-self-end"
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

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildTimelineData,
  formatForecastConfidenceLevel,
  type TimelineDatum,
} from "@/lib/ui/recommendation-result";
import type { Recommendation } from "@/types";

interface ScoreTimelineProps {
  recommendation: Recommendation;
}

function getBarColor(datum: TimelineDatum): string {
  if (datum.isBestWindow) {
    return "#0f766e";
  }

  if (datum.isRecommended) {
    return "#059669";
  }

  if (datum.score >= 40) {
    return "#d97706";
  }

  return "#e11d48";
}

function TimelineTooltip({
  active,
  payload,
}: TooltipContentProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const datum = payload[0]?.payload as TimelineDatum | undefined;

  if (!datum) {
    return null;
  }

  return (
    <div className="max-w-80 rounded-lg border border-border bg-background p-3 text-sm shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium text-slate-950 dark:text-slate-50">
          {datum.hourLabel}
        </p>
        <Badge
          variant="outline"
          className="h-6 border-slate-200 bg-slate-50 px-2 text-slate-900"
        >
          {datum.score}/100
        </Badge>
      </div>
      <p className="mt-2 leading-5 text-muted-foreground">{datum.reason}</p>
      <div className="mt-3 grid gap-1 text-xs text-slate-600 dark:text-slate-300">
        {datum.rainRisk ? <p>{datum.rainRisk}</p> : null}
        {datum.confidenceLevel ? (
          <p>
            Confiança{" "}
            {formatForecastConfidenceLevel(
              datum.confidenceLevel,
            ).toLowerCase()}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ScoreTimeline({ recommendation }: ScoreTimelineProps) {
  const minRecommendedScore = recommendation.activity.minRecommendedScore;
  const data = buildTimelineData(
    recommendation.scores,
    minRecommendedScore,
    recommendation.bestWindow,
  );
  const bestWindowLabel = recommendation.bestWindow
    ? `${recommendation.bestWindow.startLabel} - ${recommendation.bestWindow.endLabel}`
    : null;

  return (
    <Card className="rounded-lg border-border/80 bg-white shadow-sm dark:bg-card">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Timeline de scores</CardTitle>
          <CardDescription>
            Avaliação hora a hora para {recommendation.activity.name}, com
            referência do mínimo recomendado.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="h-7 border-emerald-200 bg-emerald-50 px-3 text-emerald-800"
            aria-label={`Score mínimo recomendado: ${minRecommendedScore}/100`}
          >
            Mínimo {minRecommendedScore}/100
          </Badge>
          {bestWindowLabel ? (
            <Badge
              variant="outline"
              className="h-7 border-sky-200 bg-sky-50 px-3 text-sky-900"
              aria-label={`Melhor janela: ${bestWindowLabel}`}
            >
              Melhor {bestWindowLabel}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div
            className="h-80 w-full min-w-0 sm:h-72"
            role="img"
            aria-label={`Timeline de scores por hora para ${recommendation.activity.name}. Melhor janela: ${bestWindowLabel ?? "não identificada"}. Score mínimo recomendado: ${minRecommendedScore}/100.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
              >
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="hourLabel"
                  fontSize={12}
                  interval="preserveStartEnd"
                  minTickGap={16}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tick={{ fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  content={(props) => <TimelineTooltip {...props} />}
                  cursor={false}
                />
                <ReferenceLine
                  y={minRecommendedScore}
                  stroke="var(--primary)"
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                />
                <Bar
                  dataKey="score"
                  radius={[5, 5, 0, 0]}
                  isAnimationActive={false}
                >
                  {data.map((datum) => (
                    <Cell key={datum.time} fill={getBarColor(datum)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Sem dados disponíveis para montar a timeline.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

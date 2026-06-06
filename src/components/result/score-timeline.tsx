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
  type TimelineDatum,
} from "@/lib/ui/recommendation-result";
import type { Recommendation } from "@/types";

interface ScoreTimelineProps {
  recommendation: Recommendation;
}

function getBarColor(datum: TimelineDatum): string {
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
    <div className="max-w-72 rounded-lg border border-border bg-background p-3 text-sm shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium text-slate-950">{datum.hourLabel}</p>
        <Badge
          variant="outline"
          className="h-6 border-slate-200 bg-slate-50 px-2 text-slate-900"
        >
          {datum.score}/100
        </Badge>
      </div>
      <p className="mt-2 leading-5 text-muted-foreground">{datum.reason}</p>
    </div>
  );
}

export function ScoreTimeline({ recommendation }: ScoreTimelineProps) {
  const minRecommendedScore = recommendation.activity.minRecommendedScore;
  const data = buildTimelineData(
    recommendation.scores,
    minRecommendedScore,
  );

  return (
    <Card className="rounded-lg border-border/80 shadow-sm">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Timeline de scores</CardTitle>
          <CardDescription>
            Avaliacao hora a hora para {recommendation.activity.name}.
          </CardDescription>
        </div>
        <Badge
          variant="outline"
          className="h-7 border-emerald-200 bg-emerald-50 px-3 text-emerald-800"
        >
          Minimo {minRecommendedScore}/100
        </Badge>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
              >
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="hourLabel"
                  fontSize={12}
                  interval={2}
                  minTickGap={8}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  content={(props) => <TimelineTooltip {...props} />}
                  cursor={false}
                />
                <ReferenceLine
                  y={minRecommendedScore}
                  stroke="#047857"
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {data.map((datum) => (
                    <Cell key={datum.time} fill={getBarColor(datum)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Sem scores disponiveis para montar a timeline.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

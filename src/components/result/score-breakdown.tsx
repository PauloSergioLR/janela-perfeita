import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBreakdownSource } from "@/lib/ui/recommendation-result";
import type { RuleResult, Recommendation } from "@/types";

interface ScoreBreakdownProps {
  recommendation: Recommendation;
}

function getScoreBarClass(rule: RuleResult): string {
  if (rule.score >= 70) {
    return "bg-emerald-600";
  }

  if (rule.score >= 40) {
    return "bg-amber-600";
  }

  return "bg-rose-600";
}

export function ScoreBreakdown({ recommendation }: ScoreBreakdownProps) {
  const source = getBreakdownSource(recommendation);

  return (
    <Card className="rounded-lg border-border/80 bg-white shadow-sm dark:bg-card">
      <CardHeader>
        <div className="flex items-start gap-2">
          <SlidersHorizontal className="mt-0.5 size-4 shrink-0 text-sky-700" aria-hidden="true" />
          <div>
            <CardTitle>{source.title}</CardTitle>
            <CardDescription>{source.subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {source.score ? (
          <ul className="space-y-3">
            {source.score.breakdown.map((rule) => (
              <li
                key={rule.factor}
                className="rounded-lg border border-border px-3 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-950 dark:text-slate-50">
                      {rule.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Peso {rule.weight}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="h-7 border-slate-200 bg-slate-50 px-3 text-slate-900"
                  >
                    {rule.score}/100
                  </Badge>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    role="progressbar"
                    aria-valuenow={rule.score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${rule.label}: ${rule.score}/100`}
                    className={getScoreBarClass(rule)}
                    style={{ width: `${rule.score}%`, height: "100%" }}
                  />
                </div>
                <p className="mt-3 text-sm leading-5 text-muted-foreground break-words">
                  {rule.reason}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Sem fatores disponíveis para esta busca.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
import { cn } from "@/lib/utils";
import type { RuleResult, Recommendation } from "@/types";

interface ScoreBreakdownProps {
  recommendation: Recommendation;
  variant?: "card" | "compact";
  className?: string;
}

interface ScoreRuleListProps {
  rules: RuleResult[];
  compact?: boolean;
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

function ScoreRuleList({ rules, compact = false }: ScoreRuleListProps) {
  return (
    <ul
      className={cn(
        "space-y-3",
        compact && "grid gap-2 space-y-0 sm:grid-cols-2 xl:grid-cols-3",
      )}
    >
      {rules.map((rule) => (
        <li
          key={rule.factor}
          className={cn(
            "rounded-lg border border-soft px-3 py-3",
            compact && "cockpit-surface px-2.5 py-2",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-slate-950 dark:text-slate-50">
                {rule.label}
              </p>
              <p className="text-xs text-muted-foreground">Peso {rule.weight}</p>
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
          <p
            className={cn(
              "mt-3 text-sm leading-5 text-muted-foreground break-words",
              compact && "line-clamp-2 text-xs leading-4",
            )}
          >
            {rule.reason}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ScoreBreakdown({
  recommendation,
  variant = "card",
  className,
}: ScoreBreakdownProps) {
  const source = getBreakdownSource(recommendation);

  if (variant === "compact") {
    return (
      <details
        className={cn(
          "cockpit-surface group rounded-lg border p-2",
          className,
        )}
      >
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 items-start gap-2">
            <SlidersHorizontal
              className="mt-0.5 size-4 shrink-0 text-weather-accent"
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-slate-950 dark:text-slate-50">
                {source.title}
              </span>
              <span className="line-clamp-1 text-xs text-muted-foreground">
                {source.subtitle}
              </span>
            </span>
          </span>
          <Badge
            variant="outline"
            className="h-6 shrink-0 border-weather-accent/45 bg-weather-accent/10 px-2 text-xs text-weather-accent shadow-inner shadow-white/5"
          >
            Detalhes
          </Badge>
        </summary>
        <div className="mt-3">
          {source.score ? (
            <ScoreRuleList rules={source.score.breakdown} compact />
          ) : (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Sem fatores disponíveis para esta busca.
            </div>
          )}
        </div>
      </details>
    );
  }

  return (
    <Card
      className={cn(
        "min-w-0 rounded-lg border-border/80 bg-white shadow-sm dark:bg-card",
        className,
      )}
    >
      <CardHeader>
        <div className="flex items-start gap-2">
          <SlidersHorizontal
            className="mt-0.5 size-4 shrink-0 text-sky-700"
            aria-hidden="true"
          />
          <div>
            <CardTitle>{source.title}</CardTitle>
            <CardDescription>{source.subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {source.score ? (
          <ScoreRuleList rules={source.score.breakdown} />
        ) : (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Sem fatores disponíveis para esta busca.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

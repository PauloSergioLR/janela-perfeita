import {
  AlertTriangle,
  CheckCircle2,
  CircleX,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getReasonGroups, type ReasonKind } from "@/lib/ui/reason-chips";
import { cn } from "@/lib/utils";
import type { RuleResult } from "@/types";

interface ReasonChipsProps {
  rules: RuleResult[];
  density?: "normal" | "compact";
  limit?: number;
}

interface ReasonStyle {
  icon: LucideIcon;
  badgeClassName: string;
  iconClassName: string;
}

const reasonStyles: Record<ReasonKind, ReasonStyle> = {
  positive: {
    icon: CheckCircle2,
    badgeClassName: "border-success/35 bg-success/10 text-success",
    iconClassName: "text-success",
  },
  attention: {
    icon: AlertTriangle,
    badgeClassName: "border-warning/35 bg-warning/10 text-warning",
    iconClassName: "text-warning",
  },
  negative: {
    icon: CircleX,
    badgeClassName: "border-danger/35 bg-danger/10 text-danger",
    iconClassName: "text-danger",
  },
};

function getFactorToneClassName(factor: string): string {
  if (factor.includes("temperatura")) {
    return "border-rose-400/35 bg-rose-400/10 text-rose-300";
  }

  if (factor.includes("chuva") || factor.includes("precipit")) {
    return "border-sky-400/35 bg-sky-400/10 text-sky-300";
  }

  if (factor.includes("vento") || factor.includes("rajada")) {
    return "border-cyan-400/35 bg-cyan-400/10 text-cyan-300";
  }

  if (factor.includes("uv") || factor.includes("sol") || factor.includes("golden")) {
    return "border-amber-400/35 bg-amber-400/10 text-amber-300";
  }

  if (factor.includes("ceu") || factor.includes("noite") || factor.includes("luminos")) {
    return "border-violet-400/35 bg-violet-400/10 text-violet-300";
  }

  if (factor.includes("umidade")) {
    return "border-blue-400/35 bg-blue-400/10 text-blue-300";
  }

  return "";
}

export function ReasonChips({
  rules,
  density = "normal",
  limit,
}: ReasonChipsProps) {
  const groups = getReasonGroups(rules);
  const visibleGroups =
    typeof limit === "number"
      ? groups.reduce<typeof groups>((result, group) => {
          const used = result.reduce(
            (total, currentGroup) => total + currentGroup.rules.length,
            0,
          );
          const available = Math.max(limit - used, 0);

          if (available === 0) {
            return result;
          }

          const visibleRules = group.rules.slice(0, available);

          return visibleRules.length > 0
            ? [...result, { ...group, rules: visibleRules }]
            : result;
        }, [])
      : groups;
  const isCompact = density === "compact";

  if (visibleGroups.length === 0) {
    return null;
  }

  if (isCompact) {
    return (
      <section
        className="flex flex-wrap items-center gap-2"
        aria-label="Motivos da recomendação"
      >
        <h3 className="shrink-0 text-[10px] leading-3 font-medium text-muted-foreground">
          Motivos da recomendação
        </h3>
        <div className="scrollbar-none flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto pb-0.5">
          {visibleGroups.flatMap((group) => {
            const style = reasonStyles[group.kind];
            const Icon = style.icon;

            return group.rules.map((rule) => (
              <Badge
                key={`${rule.factor}-${rule.reason}`}
                variant="outline"
                className={cn(
                  "motion-chip-enter min-h-7 max-w-[16rem] shrink-0 snap-start justify-start gap-2 whitespace-normal px-2 py-0.5 text-left text-xs leading-4",
                  style.badgeClassName,
                  getFactorToneClassName(rule.factor),
                )}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="line-clamp-1">{rule.reason}</span>
              </Badge>
            ));
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-label="Motivos da recomendação">
      <h3 className="text-sm font-medium text-slate-950 dark:text-slate-50">
        Motivos da recomendação
      </h3>
      <div className="grid gap-4">
        {visibleGroups.map((group) => {
          const style = reasonStyles[group.kind];
          const Icon = style.icon;

          return (
            <div key={group.kind} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <Icon
                  className={cn("size-4", style.iconClassName)}
                  aria-hidden="true"
                />
                {group.title}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.rules.map((rule) => (
                  <Badge
                    key={`${rule.factor}-${rule.reason}`}
                    variant="outline"
                    className={cn(
                      "motion-chip-enter min-h-8 max-w-full justify-start gap-2 whitespace-normal px-3 py-1 text-left text-sm leading-5",
                      style.badgeClassName,
                      getFactorToneClassName(rule.factor),
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>{rule.reason}</span>
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

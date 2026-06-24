import {
  AlertTriangle,
  CheckCircle2,
  CircleX,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getReasonGroups,
  type ReasonKind,
} from "@/lib/ui/reason-chips";
import { cn } from "@/lib/utils";
import type { RuleResult } from "@/types";

interface ReasonChipsProps {
  rules: RuleResult[];
  compact?: boolean;
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

export function ReasonChips({ rules, compact = false }: ReasonChipsProps) {
  const groups = getReasonGroups(rules);

  if (groups.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <section className="space-y-2" aria-label="Motivos da recomendação">
        <h3 className="text-xs font-medium text-slate-950 dark:text-slate-50">
          Por que esta é uma boa janela?
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {groups.flatMap((group) => {
            const style = reasonStyles[group.kind];
            const Icon = style.icon;

            return group.rules.map((rule) => (
              <Badge
                key={`${rule.factor}-${rule.reason}`}
                variant="outline"
                className={cn(
                  "min-h-7 max-w-full gap-1.5 whitespace-normal px-2 py-0.5 text-left text-xs leading-4",
                  style.badgeClassName,
                )}
              >
                <Icon className="size-3 shrink-0" aria-hidden="true" />
                <span>{rule.reason}</span>
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
        {groups.map((group) => {
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

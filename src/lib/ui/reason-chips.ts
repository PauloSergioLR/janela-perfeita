import type { RuleResult } from "@/types";

export type ReasonKind = "positive" | "attention" | "negative";

export interface ReasonGroup {
  kind: ReasonKind;
  title: string;
  rules: RuleResult[];
}

const REASON_GROUPS: Array<Pick<ReasonGroup, "kind" | "title">> = [
  { kind: "positive", title: "A favor" },
  { kind: "attention", title: "Atenção" },
  { kind: "negative", title: "Desfavoráveis" },
];

export function getReasonKind(score: number): ReasonKind {
  if (score >= 70) {
    return "positive";
  }

  if (score >= 40) {
    return "attention";
  }

  return "negative";
}

function normalizeReason(reason: string): string {
  return reason
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

function sortRules(a: RuleResult, b: RuleResult): number {
  return b.score - a.score || b.weight - a.weight || a.label.localeCompare(b.label);
}

export function getReasonGroups(rules: RuleResult[]): ReasonGroup[] {
  const rulesByKind: Record<ReasonKind, RuleResult[]> = {
    positive: [],
    attention: [],
    negative: [],
  };
  const seenReasons = new Set<string>();

  for (const rule of rules) {
    const key = normalizeReason(rule.reason || rule.label);

    if (!key || seenReasons.has(key)) {
      continue;
    }

    seenReasons.add(key);
    rulesByKind[getReasonKind(rule.score)].push(rule);
  }

  return REASON_GROUPS.map((group) => ({
    ...group,
    rules: rulesByKind[group.kind].sort(sortRules),
  })).filter((group) => group.rules.length > 0);
}

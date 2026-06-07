import type { HourScore, Recommendation, RuleResult, WindowResult } from "@/types";
import { formatCityLabel } from "./search-page";

export interface TimelineDatum {
  time: string;
  hourLabel: string;
  score: number;
  reason: string;
  isRecommended: boolean;
}

export interface BreakdownSource {
  title: string;
  subtitle: string;
  score: HourScore | null;
}

function compareRulesByPositiveImpact(a: RuleResult, b: RuleResult): number {
  return b.score - a.score || b.weight - a.weight || a.label.localeCompare(b.label);
}

function compareRulesByPenalty(a: RuleResult, b: RuleResult): number {
  return a.score - b.score || b.weight - a.weight || a.label.localeCompare(b.label);
}

function sortByPeakScore(a: HourScore, b: HourScore): number {
  return b.score - a.score || a.time.localeCompare(b.time);
}

export function getPrimaryReason(score: HourScore): string {
  const orderedRules = [...score.breakdown].sort(
    score.score >= 70 ? compareRulesByPositiveImpact : compareRulesByPenalty,
  );

  return orderedRules[0]?.reason ?? "Sem detalhamento para este horario.";
}

export function buildTimelineData(
  scores: HourScore[],
  minRecommendedScore: number,
): TimelineDatum[] {
  return scores.map((score) => ({
    time: score.time,
    hourLabel: score.hourLabel,
    score: score.score,
    reason: getPrimaryReason(score),
    isRecommended: score.score >= minRecommendedScore,
  }));
}

export function getAlternativeWindows(windows: WindowResult[]): WindowResult[] {
  return windows.slice(1);
}

export function getPeakHourScore(scores: HourScore[]): HourScore | null {
  return [...scores].sort(sortByPeakScore)[0] ?? null;
}

export function getBreakdownSource(
  recommendation: Recommendation,
): BreakdownSource {
  const bestWindowPeak = recommendation.bestWindow
    ? getPeakHourScore(recommendation.bestWindow.scores)
    : null;
  const fallbackPeak = getPeakHourScore(recommendation.scores);
  const score = bestWindowPeak ?? fallbackPeak;

  return {
    title: bestWindowPeak
      ? "Fatores da melhor janela"
      : "Fatores do melhor horario disponivel",
    subtitle: score
      ? `${score.hourLabel} com score ${score.score}/100`
      : "Sem horarios avaliados para esta data",
    score,
  };
}

export function formatDurationHours(durationHours: number): string {
  return durationHours === 1 ? "1 hora" : `${durationHours} horas`;
}

export function formatRecommendationDate(date: string): string {
  const parsedDate = new Date(`${date}T00:00:00`);

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(parsedDate);
}

export function formatRecommendationLocation(
  recommendation: Recommendation,
): string {
  return formatCityLabel(recommendation.city);
}

import type { ActivityRanking, Recommendation, WeekComparison } from "@/types";
import {
  formatRecommendationDate,
  formatRecommendationLocation,
  getPeakHourScore,
  getPrimaryReason,
} from "./recommendation-result";
import {
  formatWindowSummary,
  getRecommendationRankingReason,
} from "./exploration-result";
import { formatCityLabel } from "./search-page";

function getRecommendationScore(recommendation: Recommendation): number {
  return (
    recommendation.bestWindow?.avgScore ??
    getPeakHourScore(recommendation.scores)?.score ??
    0
  );
}

function getRecommendationReason(recommendation: Recommendation): string {
  const peakScore = getPeakHourScore(recommendation.scores);

  return (
    recommendation.bestWindow?.highlights[0] ??
    (peakScore
      ? getPrimaryReason(peakScore)
      : "Sem horários avaliados para esta data.")
  );
}

export function buildRecommendationShareText(
  recommendation: Recommendation,
): string {
  const windowSummary = recommendation.bestWindow
    ? `${recommendation.bestWindow.startLabel} às ${recommendation.bestWindow.endLabel}`
    : "sem janela ideal";

  return [
    `Janela Perfeita para ${recommendation.activity.name.toLowerCase()} em ${formatRecommendationLocation(recommendation)}:`,
    `${formatRecommendationDate(recommendation.date)}, ${windowSummary}.`,
    `Score: ${getRecommendationScore(recommendation)}/100.`,
    `Motivo: ${getRecommendationReason(recommendation)}`,
  ].join("\n");
}

export function buildActivityRankingShareText(ranking: ActivityRanking): string {
  const bestItem = ranking.bestActivity;
  const lines = ranking.items.slice(0, 3).map((item) => {
    const recommendation = item.recommendation;
    const suffix = item.isRecommended
      ? `${item.score}/100, ${formatWindowSummary(recommendation.bestWindow)}`
      : "não recomendado";

    return `${item.position}. ${recommendation.activity.name}: ${suffix}`;
  });

  return [
    `Janela Perfeita em ${formatCityLabel(ranking.city)}:`,
    `${formatRecommendationDate(ranking.date)}.`,
    bestItem
      ? `Melhor atividade: ${bestItem.recommendation.activity.name} (${bestItem.score}/100).`
      : "Sem atividade recomendada.",
    ...lines,
  ].join("\n");
}

export function buildWeekComparisonShareText(
  comparison: WeekComparison,
): string {
  const bestDay = comparison.bestDay;

  return [
    `Melhor dia para ${comparison.activity.name.toLowerCase()} em ${formatCityLabel(comparison.city)}:`,
    bestDay
      ? `${formatRecommendationDate(bestDay.recommendation.date)} - ${bestDay.score}/100.`
      : "Sem dia recomendado.",
    bestDay
      ? `Janela: ${formatWindowSummary(bestDay.recommendation.bestWindow)}.`
      : "Janela: não recomendada.",
    bestDay
      ? `Motivo: ${getRecommendationRankingReason(bestDay.recommendation)}`
      : "",
  ].filter(Boolean).join("\n");
}

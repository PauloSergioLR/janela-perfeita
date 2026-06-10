import type { Recommendation, WindowResult } from "@/types";
import {
  formatDurationHours,
  getPeakHourScore,
  getPrimaryReason,
} from "./recommendation-result";

export function getRecommendationRankingReason(
  recommendation: Recommendation,
): string {
  const highlight = recommendation.bestWindow?.highlights[0];

  if (highlight) {
    return highlight;
  }

  const peakScore = getPeakHourScore(recommendation.scores);

  return peakScore
    ? getPrimaryReason(peakScore)
    : "Sem horários avaliados para esta data.";
}

export function formatWindowSummary(window: WindowResult | null): string {
  if (!window) {
    return "Não recomendado";
  }

  return `${window.startLabel} às ${window.endLabel} (${formatDurationHours(
    window.durationHours,
  )})`;
}

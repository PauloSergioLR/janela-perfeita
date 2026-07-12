import type { Recommendation, WindowResult } from "@/types";
import {
  formatDurationHours,
  formatWindowTimeRange,
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
    return "Nenhuma janela ideal encontrada";
  }

  const timeRange = formatWindowTimeRange(window);

  if (timeRange === "Dia inteiro") {
    return "Dia inteiro";
  }

  return `${timeRange} (${formatDurationHours(
    window.durationHours,
  )})`;
}

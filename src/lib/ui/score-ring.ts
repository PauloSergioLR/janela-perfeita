export type ScoreRingTone = "success" | "accent" | "warning" | "caution" | "danger";

export interface ScoreRingBand {
  label: string;
  tone: ScoreRingTone;
}

export function normalizeScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

export function getScoreRingBand(score: number): ScoreRingBand {
  const normalizedScore = normalizeScore(score);

  if (normalizedScore >= 85) {
    return { label: "Excelente", tone: "success" };
  }

  if (normalizedScore >= 70) {
    return { label: "Boa", tone: "accent" };
  }

  if (normalizedScore >= 60) {
    return { label: "Aceitável", tone: "warning" };
  }

  if (normalizedScore >= 40) {
    return { label: "Fraca", tone: "caution" };
  }

  return { label: "Não recomendado", tone: "danger" };
}

export function getScoreRingStrokeOffset(
  score: number,
  circumference: number,
): number {
  return circumference * (1 - normalizeScore(score) / 100);
}

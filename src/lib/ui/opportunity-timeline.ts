import type { TimelineDatum } from "./recommendation-result";

export interface OpportunityTone {
  barClassName: string;
  markerClassName: string;
  label: string;
}

export function getOpportunityTone(
  datum: Pick<TimelineDatum, "score" | "isBestWindow" | "isRecommended">,
): OpportunityTone {
  if (datum.isBestWindow) {
    return {
      barClassName: "bg-weather-accent shadow-weather-glow",
      markerClassName: "border-weather-accent bg-weather-accent/15 text-weather-accent",
      label: "Melhor janela",
    };
  }

  if (datum.isRecommended) {
    return {
      barClassName: "bg-success",
      markerClassName: "border-success/60 bg-success/10 text-success",
      label: "Recomendado",
    };
  }

  if (datum.score >= 40) {
    return {
      barClassName: "bg-warning/75",
      markerClassName: "border-warning/55 bg-warning/10 text-warning",
      label: "Atenção",
    };
  }

  return {
    barClassName: "bg-danger/55",
    markerClassName: "border-danger/45 bg-danger/10 text-danger",
    label: "Pouco favorável",
  };
}

export function getOpportunityBarHeight(score: number): number {
  return Math.min(100, Math.max(8, score));
}

export function buildOpportunityTooltip(datum: TimelineDatum): string {
  return [
    `${datum.hourLabel}: ${datum.score}/100`,
    datum.reason,
    datum.rainRisk,
    datum.wind,
  ]
    .filter(Boolean)
    .join("\n");
}

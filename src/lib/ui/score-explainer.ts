import type { Activity } from "@/types";

export interface ScoreExplainerRule {
  factor: string;
  label: string;
  weight: number;
}

export interface ScoreExplainerActivity {
  id: Activity["id"];
  name: string;
  shortDescription: string;
  minRecommendedScore: number;
  minDurationHours: number;
  rules: ScoreExplainerRule[];
  totalWeight: number;
}

export function buildScoreExplainerActivities(
  activities: Activity[],
): ScoreExplainerActivity[] {
  return activities.map((activity) => ({
    id: activity.id,
    name: activity.name,
    shortDescription: activity.shortDescription,
    minRecommendedScore: activity.minRecommendedScore,
    minDurationHours: activity.minDurationHours,
    rules: activity.rules.map((rule) => ({
      factor: rule.factor,
      label: rule.label,
      weight: rule.weight,
    })),
    totalWeight: activity.rules.reduce((sum, rule) => sum + rule.weight, 0),
  }));
}

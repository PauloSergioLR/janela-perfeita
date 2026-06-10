import type {
  Activity,
  ActivityRanking,
  ActivityRankingItem,
  City,
  DailyAstronomy,
  DayRankingItem,
  HourlyWeather,
  Recommendation,
  WeekComparison,
} from "@/types";
import { calculateDayScores } from "./score-calculator";
import { findBestWindows } from "./window-finder";

export const RECOMMENDATION_DISCLAIMER =
  "Recomendação estimada com base na previsão meteorológica da Open-Meteo; não substitui avaliação local das condições.";

interface BuildRecommendationInput {
  activity: Activity;
  city: City;
  hourly: HourlyWeather[];
  astronomy: DailyAstronomy;
  generatedAt: string;
  now: string;
}

interface BuildActivityRankingInput {
  activities: Activity[];
  city: City;
  hourly: HourlyWeather[];
  astronomy: DailyAstronomy;
  generatedAt: string;
  now: string;
}

interface BuildWeekComparisonInput {
  activity: Activity;
  city: City;
  hourly: HourlyWeather[];
  dailyAstronomy: DailyAstronomy[];
  generatedAt: string;
  now: string;
}

function getPeakScore(recommendation: Recommendation): number {
  return Math.max(0, ...recommendation.scores.map((score) => score.score));
}

function getRankingScore(recommendation: Recommendation): number {
  return recommendation.bestWindow?.avgScore ?? getPeakScore(recommendation);
}

function sortActivityItems(
  a: Omit<ActivityRankingItem, "position">,
  b: Omit<ActivityRankingItem, "position">,
): number {
  return (
    Number(b.isRecommended) - Number(a.isRecommended) ||
    b.score - a.score ||
    a.recommendation.activity.name.localeCompare(b.recommendation.activity.name)
  );
}

function sortDayItems(
  a: Omit<DayRankingItem, "position">,
  b: Omit<DayRankingItem, "position">,
): number {
  return (
    Number(b.isRecommended) - Number(a.isRecommended) ||
    b.score - a.score ||
    a.recommendation.date.localeCompare(b.recommendation.date)
  );
}

function withPositions<T extends { position: number }>(
  items: Omit<T, "position">[],
): T[] {
  return items.map((item, index) => ({
    ...item,
    position: index + 1,
  })) as T[];
}

export function buildRecommendation({
  activity,
  city,
  hourly,
  astronomy,
  generatedAt,
  now,
}: BuildRecommendationInput): Recommendation {
  const scores = calculateDayScores({
    activity,
    hourly,
    astronomy,
    now,
  });
  const windows = findBestWindows(scores, activity);

  return {
    activity,
    city,
    date: astronomy.date,
    generatedAt,
    scores,
    windows,
    bestWindow: windows[0] ?? null,
    disclaimer: RECOMMENDATION_DISCLAIMER,
  };
}

export function buildActivityRanking({
  activities,
  city,
  hourly,
  astronomy,
  generatedAt,
  now,
}: BuildActivityRankingInput): ActivityRanking {
  const items = withPositions<ActivityRankingItem>(
    activities
      .map((activity) => {
        const recommendation = buildRecommendation({
          activity,
          city,
          hourly,
          astronomy,
          generatedAt,
          now,
        });

        return {
          recommendation,
          score: getRankingScore(recommendation),
          isRecommended: recommendation.bestWindow !== null,
        };
      })
      .sort(sortActivityItems),
  );

  return {
    city,
    date: astronomy.date,
    generatedAt,
    items,
    bestActivity: items[0] ?? null,
    disclaimer: RECOMMENDATION_DISCLAIMER,
  };
}

export function buildWeekComparison({
  activity,
  city,
  hourly,
  dailyAstronomy,
  generatedAt,
  now,
}: BuildWeekComparisonInput): WeekComparison {
  const days = withPositions<DayRankingItem>(
    dailyAstronomy
      .map((astronomy) => {
        const recommendation = buildRecommendation({
          activity,
          city,
          hourly,
          astronomy,
          generatedAt,
          now,
        });

        return {
          recommendation,
          score: getRankingScore(recommendation),
          isRecommended: recommendation.bestWindow !== null,
        };
      })
      .sort(sortDayItems),
  );

  return {
    activity,
    city,
    startDate: dailyAstronomy[0]?.date ?? "",
    endDate: dailyAstronomy[dailyAstronomy.length - 1]?.date ?? "",
    generatedAt,
    days,
    bestDay: days[0] ?? null,
    disclaimer: RECOMMENDATION_DISCLAIMER,
  };
}

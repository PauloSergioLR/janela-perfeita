import type {
  Activity,
  ActivityTimeWindow,
  ActivityRanking,
  ActivityRankingItem,
  City,
  DailyAstronomy,
  DayRankingItem,
  HourlyWeather,
  Recommendation,
  UserAvailability,
  WeekComparison,
} from "@/types";
import { calculateDayScores } from "./score-calculator";
import { addMinutesToLocalIso, formatHourLabel } from "./weather-context";
import { findBestWindows } from "./window-finder";

const GOLDEN_HOUR_START_OFFSET_MINUTES = -60;
const GOLDEN_HOUR_END_OFFSET_MINUTES = 15;

export const RECOMMENDATION_DISCLAIMER =
  "Recomendação estimada com base na previsão meteorológica da Open-Meteo; não substitui avaliação local das condições.";

interface BuildRecommendationInput {
  activity: Activity;
  city: City;
  hourly: HourlyWeather[];
  astronomy: DailyAstronomy;
  generatedAt: string;
  now: string;
  availability?: UserAvailability;
}

interface BuildActivityRankingInput {
  activities: Activity[];
  city: City;
  hourly: HourlyWeather[];
  astronomy: DailyAstronomy;
  generatedAt: string;
  now: string;
  availability?: UserAvailability;
}

interface BuildWeekComparisonInput {
  activity: Activity;
  city: City;
  hourly: HourlyWeather[];
  dailyAstronomy: DailyAstronomy[];
  generatedAt: string;
  now: string;
  availability?: UserAvailability;
}

function buildAvailabilityNotice(availability: UserAvailability): string {
  return `Dentro da sua disponibilidade: ${formatActivityTimeWindow({
    start: availability.availableFrom,
    end: availability.availableTo,
  })}.`;
}

function formatActivityTimeWindow(window: ActivityTimeWindow): string {
  if (window.start === window.end) {
    return "Dia inteiro";
  }

  return `Das ${window.start} às ${window.end}`;
}

function buildGoldenHourTimeWindow(astronomy: DailyAstronomy): ActivityTimeWindow {
  return {
    start: formatHourLabel(
      addMinutesToLocalIso(
        astronomy.sunset,
        GOLDEN_HOUR_START_OFFSET_MINUTES,
      ),
    ),
    end: formatHourLabel(
      addMinutesToLocalIso(astronomy.sunset, GOLDEN_HOUR_END_OFFSET_MINUTES),
    ),
    label: "Hora dourada",
  };
}

function getDefaultTimeWindows(
  activity: Activity,
  astronomy: DailyAstronomy,
): ActivityTimeWindow[] {
  if (activity.defaultTimeWindowStrategy === "golden_hour") {
    return [buildGoldenHourTimeWindow(astronomy)];
  }

  return activity.defaultTimeWindows ?? [];
}

function buildDefaultTimeWindowNotice(
  activity: Activity,
  astronomy: DailyAstronomy,
): string | undefined {
  const windows = getDefaultTimeWindows(activity, astronomy);

  if (!windows.length) {
    return undefined;
  }

  return `Dentro do horário recomendado para esta atividade: ${windows.map(formatActivityTimeWindow).join(" ou ")}.`;
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
  availability,
}: BuildRecommendationInput): Recommendation {
  const scores = calculateDayScores({
    activity,
    hourly,
    astronomy,
    now,
    availability,
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
    availability,
    availabilityNotice: availability
      ? buildAvailabilityNotice(availability)
      : undefined,
    timeWindowNotice: availability
      ? undefined
      : buildDefaultTimeWindowNotice(activity, astronomy),
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
  availability,
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
          availability,
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
    availability,
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
  availability,
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
          availability,
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
    availability,
    disclaimer: RECOMMENDATION_DISCLAIMER,
  };
}

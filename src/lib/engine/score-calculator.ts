import type {
  Activity,
  DailyAstronomy,
  HourlyWeather,
  HourScore,
  WeatherContext,
} from "@/types";
import {
  buildWeatherContext,
  formatHourLabel,
  getLocalDatePart,
} from "./weather-context";

export interface CalculateHourScoreInput {
  activity: Activity;
  weather: HourlyWeather;
  context: WeatherContext;
}

export interface CalculateDayScoresInput {
  activity: Activity;
  hourly: HourlyWeather[];
  astronomy: DailyAstronomy;
  now: string;
}

const MAX_HOURS_PER_DAY = 24;

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateHourScore({
  activity,
  weather,
  context,
}: CalculateHourScoreInput): HourScore {
  const breakdown = activity.rules.map((rule) =>
    rule.evaluate(weather, context),
  );
  const totalWeight = breakdown.reduce((sum, rule) => sum + rule.weight, 0);
  const weightedScore =
    totalWeight === 0
      ? 0
      : breakdown.reduce(
          (sum, rule) => sum + rule.score * rule.weight,
          0,
        ) / totalWeight;

  return {
    time: weather.time,
    hourLabel: formatHourLabel(weather.time),
    score: context.isPastHour ? 0 : clampScore(weightedScore),
    breakdown,
  };
}

export function calculateDayScores({
  activity,
  hourly,
  astronomy,
  now,
}: CalculateDayScoresInput): HourScore[] {
  return hourly
    .filter((weather) => getLocalDatePart(weather.time) === astronomy.date)
    .slice(0, MAX_HOURS_PER_DAY)
    .map((weather) =>
      calculateHourScore({
        activity,
        weather,
        context: buildWeatherContext({ weather, astronomy, now }),
      }),
    );
}


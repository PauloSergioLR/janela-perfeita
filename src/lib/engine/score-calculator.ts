import type {
  Activity,
  DailyAstronomy,
  HourlyWeather,
  HourScore,
  RuleResult,
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
const CAR_WASH_FUTURE_RAIN_LOOKAHEAD_HOURS = 3;
const FUTURE_RAIN_MAX_SCORE = 30;
const FUTURE_RAIN_PENALIZED_SCORE = 30;

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildFutureRainPenalty(weather: HourlyWeather): RuleResult {
  return {
    factor: "chuva_futura",
    label: "Chuva futura",
    weight: 0,
    score: 0,
    reason: `Chuva relevante às ${formatHourLabel(weather.time)} pode comprometer a lavagem do carro.`,
  };
}

function findCarWashFutureRainPenalty(input: {
  activity: Activity;
  hourly: HourlyWeather[];
  currentIndex: number;
  astronomy: DailyAstronomy;
  now: string;
}): RuleResult | null {
  if (input.activity.id !== "lavar_carro") {
    return null;
  }

  const rainRule = input.activity.rules.find((rule) => rule.factor === "chuva");

  if (!rainRule) {
    return null;
  }

  const futureWeather = input.hourly
    .slice(
      input.currentIndex + 1,
      input.currentIndex + 1 + CAR_WASH_FUTURE_RAIN_LOOKAHEAD_HOURS,
    )
    .find((weather) => {
      const context = buildWeatherContext({
        weather,
        astronomy: input.astronomy,
        now: input.now,
      });
      const rainResult = rainRule.evaluate(weather, context);

      return rainResult.score <= FUTURE_RAIN_MAX_SCORE;
    });

  return futureWeather ? buildFutureRainPenalty(futureWeather) : null;
}

function applyFutureRainPenalty(
  score: HourScore,
  penalty: RuleResult | null,
): HourScore {
  if (!penalty) {
    return score;
  }

  return {
    ...score,
    score: Math.min(score.score, FUTURE_RAIN_PENALIZED_SCORE),
    breakdown: [...score.breakdown, penalty],
  };
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
  const dailyHourly = hourly
    .filter((weather) => getLocalDatePart(weather.time) === astronomy.date)
    .slice(0, MAX_HOURS_PER_DAY);

  return dailyHourly.map((weather, index) => {
    const context = buildWeatherContext({ weather, astronomy, now });
    const score = calculateHourScore({
      activity,
      weather,
      context,
    });
    const futureRainPenalty = findCarWashFutureRainPenalty({
      activity,
      hourly: dailyHourly,
      currentIndex: index,
      astronomy,
      now,
    });

    return applyFutureRainPenalty(score, futureRainPenalty);
  });
}


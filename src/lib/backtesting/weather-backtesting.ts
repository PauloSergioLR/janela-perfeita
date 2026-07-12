import { buildRecommendation } from "@/lib/engine/recommendation-exploration";
import { calculateDayScores } from "@/lib/engine/score-calculator";
import type {
  Activity,
  City,
  DailyAstronomy,
  HourScore,
  HourlyWeather,
  WindowResult,
} from "@/types";

const DRY_PRECIPITATION_THRESHOLD_MM = 0.2;

interface BacktestFactorRule {
  factor: string;
  label: string;
  unit: string;
  threshold: number;
  getDifference: (forecast: HourlyWeather, observed: HourlyWeather) => number;
}

export interface BacktestDayInput {
  date: string;
  astronomy: DailyAstronomy;
  forecastHourly: HourlyWeather[];
  observedHourly: HourlyWeather[];
}

export interface WeatherBacktestInput {
  activity: Activity;
  city: City;
  days: BacktestDayInput[];
  generatedAt: string;
}

export interface BacktestFactorError {
  factor: string;
  label: string;
  averageError: number;
  unit: string;
  impactScore: number;
}

export interface BacktestDayResult {
  date: string;
  recommendedWindow: Pick<
    WindowResult,
    "startTime" | "endTime" | "startLabel" | "endLabel" | "avgScore"
  > | null;
  stayedDry: boolean | null;
  averageObservedScore: number | null;
  hit: boolean | null;
  factorErrors: BacktestFactorError[];
}

export interface WeatherBacktestReport {
  city: City;
  activity: Activity;
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  evaluatedWindows: number;
  dryWindows: number;
  dryWindowRate: number;
  averageRecommendedScore: number;
  averageObservedScore: number;
  averageTemperatureErrorC: number;
  estimatedHitRate: number;
  topErrorFactors: BacktestFactorError[];
  days: BacktestDayResult[];
  limitations: string[];
}

const FACTOR_RULES = [
  {
    factor: "temperature",
    label: "Temperatura",
    unit: "°C",
    threshold: 5,
    getDifference: (forecast, observed) =>
      Math.max(
        Math.abs(forecast.temperature_2m - observed.temperature_2m),
        Math.abs(forecast.apparent_temperature - observed.apparent_temperature),
      ),
  },
  {
    factor: "precipitation",
    label: "Chuva",
    unit: "mm",
    threshold: 2,
    getDifference: (forecast, observed) =>
      Math.abs(forecast.precipitation - observed.precipitation),
  },
  {
    factor: "wind",
    label: "Vento",
    unit: "km/h",
    threshold: 15,
    getDifference: (forecast, observed) =>
      Math.max(
        Math.abs(forecast.wind_speed_10m - observed.wind_speed_10m),
        Math.abs(forecast.wind_gusts_10m - observed.wind_gusts_10m),
      ),
  },
  {
    factor: "cloud_cover",
    label: "Nuvens",
    unit: "%",
    threshold: 35,
    getDifference: (forecast, observed) =>
      Math.abs(forecast.cloud_cover - observed.cloud_cover),
  },
] satisfies BacktestFactorRule[];

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function percentage(part: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

function isInsideWindow(score: HourScore, window: WindowResult): boolean {
  return score.time >= window.startTime && score.time < window.endTime;
}

function getWindowWeatherByTime(
  hourly: HourlyWeather[],
  window: WindowResult,
): Map<string, HourlyWeather> {
  return new Map(
    hourly
      .filter(
        (weather) => weather.time >= window.startTime && weather.time < window.endTime,
      )
      .map((weather) => [weather.time, weather]),
  );
}

function calculateFactorErrors(input: {
  window: WindowResult;
  forecastHourly: HourlyWeather[];
  observedHourly: HourlyWeather[];
}): BacktestFactorError[] {
  const forecastByTime = getWindowWeatherByTime(
    input.forecastHourly,
    input.window,
  );
  const observedByTime = getWindowWeatherByTime(
    input.observedHourly,
    input.window,
  );

  return FACTOR_RULES.map((rule) => {
    const differences = [...forecastByTime.entries()]
      .map(([time, forecastWeather]) => {
        const observedWeather = observedByTime.get(time);

        return observedWeather
          ? rule.getDifference(forecastWeather, observedWeather)
          : null;
      })
      .filter((value): value is number => value !== null);
    const averageError = round(average(differences));

    return {
      factor: rule.factor,
      label: rule.label,
      averageError,
      unit: rule.unit,
      impactScore: Math.round(Math.min(averageError / rule.threshold, 1) * 100),
    };
  }).sort((a, b) => b.impactScore - a.impactScore || b.averageError - a.averageError);
}

function aggregateFactorErrors(
  days: BacktestDayResult[],
): BacktestFactorError[] {
  return FACTOR_RULES.map((rule) => {
    const factorDays = days
      .flatMap((day) => day.factorErrors)
      .filter((error) => error.factor === rule.factor);
    const averageError = round(
      average(factorDays.map((error) => error.averageError)),
    );

    return {
      factor: rule.factor,
      label: rule.label,
      averageError,
      unit: rule.unit,
      impactScore: Math.round(Math.min(averageError / rule.threshold, 1) * 100),
    };
  })
    .filter((error) => error.averageError > 0)
    .sort((a, b) => b.impactScore - a.impactScore || b.averageError - a.averageError);
}

function evaluateDay(input: {
  activity: Activity;
  city: City;
  day: BacktestDayInput;
  generatedAt: string;
}): BacktestDayResult {
  const now = `${input.day.date}T00:00:00`;
  const recommendation = buildRecommendation({
    activity: input.activity,
    city: input.city,
    hourly: input.day.forecastHourly,
    astronomy: input.day.astronomy,
    generatedAt: input.generatedAt,
    now,
  });
  const bestWindow = recommendation.bestWindow;

  if (!bestWindow) {
    return {
      date: input.day.date,
      recommendedWindow: null,
      stayedDry: null,
      averageObservedScore: null,
      hit: null,
      factorErrors: [],
    };
  }

  const observedScores = calculateDayScores({
    activity: input.activity,
    hourly: input.day.observedHourly,
    astronomy: input.day.astronomy,
    now,
  }).filter((score) => isInsideWindow(score, bestWindow));
  const averageObservedScore = Math.round(
    average(observedScores.map((score) => score.score)),
  );
  const stayedDry = observedScores.every(
    (score) => score.weather.precipitation <= DRY_PRECIPITATION_THRESHOLD_MM,
  );
  const hit =
    stayedDry && averageObservedScore >= input.activity.minRecommendedScore;

  return {
    date: input.day.date,
    recommendedWindow: {
      startTime: bestWindow.startTime,
      endTime: bestWindow.endTime,
      startLabel: bestWindow.startLabel,
      endLabel: bestWindow.endLabel,
      avgScore: bestWindow.avgScore,
    },
    stayedDry,
    averageObservedScore,
    hit,
    factorErrors: calculateFactorErrors({
      window: bestWindow,
      forecastHourly: input.day.forecastHourly,
      observedHourly: input.day.observedHourly,
    }),
  };
}

export function runWeatherBacktest(
  input: WeatherBacktestInput,
): WeatherBacktestReport {
  const days = input.days.map((day) =>
    evaluateDay({
      activity: input.activity,
      city: input.city,
      day,
      generatedAt: input.generatedAt,
    }),
  );
  const evaluatedDays = days.filter((day) => day.recommendedWindow !== null);
  const dryWindows = evaluatedDays.filter((day) => day.stayedDry).length;
  const hits = evaluatedDays.filter((day) => day.hit).length;
  const recommendedScores = evaluatedDays.map(
    (day) => day.recommendedWindow?.avgScore ?? 0,
  );
  const observedScores = evaluatedDays
    .map((day) => day.averageObservedScore)
    .filter((score): score is number => score !== null);
  const topErrorFactors = aggregateFactorErrors(evaluatedDays);
  const temperatureError =
    topErrorFactors.find((error) => error.factor === "temperature")
      ?.averageError ?? 0;

  return {
    city: input.city,
    activity: input.activity,
    generatedAt: input.generatedAt,
    period: {
      startDate: input.days[0]?.date ?? "",
      endDate: input.days[input.days.length - 1]?.date ?? "",
      days: input.days.length,
    },
    evaluatedWindows: evaluatedDays.length,
    dryWindows,
    dryWindowRate: percentage(dryWindows, evaluatedDays.length),
    averageRecommendedScore: Math.round(average(recommendedScores)),
    averageObservedScore: Math.round(average(observedScores)),
    averageTemperatureErrorC: temperatureError,
    estimatedHitRate: percentage(hits, evaluatedDays.length),
    topErrorFactors: topErrorFactors.slice(0, 3),
    days,
    limitations: [
      "Amostra local preparada para validar a metodologia; não representa auditoria meteorológica oficial.",
      "O backtesting compara a janela recomendada com condições históricas normalizadas, sem prometer precisão absoluta.",
      "Sem banco de dados: os resultados dependem do conjunto de dados fornecido ao módulo.",
    ],
  };
}

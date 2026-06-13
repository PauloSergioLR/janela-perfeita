import type {
  HourlyWeather,
  ModelAgreementLevel,
  ModelDivergence,
} from "@/types";
import type { NormalizedForecast } from "./weather-provider";

export interface ForecastAgreementInput {
  id: string;
  forecast: NormalizedForecast;
}

export interface ForecastAgreementResult {
  level: ModelAgreementLevel;
  score: number;
  comparedItems: string[];
  divergences: ModelDivergence[];
  reason: string;
}

interface ForecastAgreementOptions {
  comparedLabel: string;
  highReason: string;
  mediumReason: string;
  lowReason: string;
}

interface DivergenceRule {
  factor: string;
  label: string;
  threshold: number;
  getDifference: (base: HourlyWeather, compared: HourlyWeather) => number;
  buildReason: (maxDifference: number, comparedLabel: string) => string;
}

const DIVERGENCE_RULES = [
  {
    factor: "precipitation_probability",
    label: "Probabilidade de chuva",
    threshold: 30,
    getDifference: (base, compared) =>
      Math.abs(
        base.precipitation_probability - compared.precipitation_probability,
      ),
    buildReason: (maxDifference, comparedLabel) =>
      `${comparedLabel} diferem em até ${Math.round(maxDifference)} p.p. na chance de chuva.`,
  },
  {
    factor: "precipitation",
    label: "Chuva",
    threshold: 2,
    getDifference: (base, compared) =>
      Math.abs(base.precipitation - compared.precipitation),
    buildReason: (maxDifference, comparedLabel) =>
      `${comparedLabel} diferem em até ${maxDifference.toFixed(1)} mm de chuva.`,
  },
  {
    factor: "temperature",
    label: "Temperatura",
    threshold: 5,
    getDifference: (base, compared) =>
      Math.max(
        Math.abs(base.temperature_2m - compared.temperature_2m),
        Math.abs(base.apparent_temperature - compared.apparent_temperature),
      ),
    buildReason: (maxDifference, comparedLabel) =>
      `${comparedLabel} diferem em até ${maxDifference.toFixed(1)}°C na temperatura.`,
  },
  {
    factor: "wind",
    label: "Vento",
    threshold: 15,
    getDifference: (base, compared) =>
      Math.max(
        Math.abs(base.wind_speed_10m - compared.wind_speed_10m),
        Math.abs(base.wind_gusts_10m - compared.wind_gusts_10m),
      ),
    buildReason: (maxDifference, comparedLabel) =>
      `${comparedLabel} diferem em até ${Math.round(maxDifference)} km/h no vento.`,
  },
  {
    factor: "cloud_cover",
    label: "Nuvens",
    threshold: 35,
    getDifference: (base, compared) =>
      Math.abs(base.cloud_cover - compared.cloud_cover),
    buildReason: (maxDifference, comparedLabel) =>
      `${comparedLabel} diferem em até ${Math.round(maxDifference)}% na cobertura de nuvens.`,
  },
] satisfies DivergenceRule[];

function getForecastByTime(forecast: NormalizedForecast): Map<string, HourlyWeather> {
  return new Map(forecast.hourly.map((weather) => [weather.time, weather]));
}

function getLevel(score: number): ModelAgreementLevel {
  if (score >= 75) {
    return "alta";
  }

  if (score >= 50) {
    return "media";
  }

  return "baixa";
}

function getLevelReason(
  level: ModelAgreementLevel,
  options: ForecastAgreementOptions,
): string {
  if (level === "alta") {
    return options.highReason;
  }

  if (level === "media") {
    return options.mediumReason;
  }

  return options.lowReason;
}

function calculateRuleDivergence(
  rule: DivergenceRule,
  baseForecast: NormalizedForecast,
  comparedForecasts: NormalizedForecast[],
  comparedLabel: string,
): ModelDivergence {
  const comparedByTime = comparedForecasts.map(getForecastByTime);
  const differences = baseForecast.hourly.flatMap((baseWeather) =>
    comparedByTime
      .map((forecast) => forecast.get(baseWeather.time))
      .filter((weather): weather is HourlyWeather => weather !== undefined)
      .map((weather) => rule.getDifference(baseWeather, weather)),
  );
  const maxDifference = Math.max(0, ...differences);
  const avgRatio =
    differences.length === 0
      ? 0
      : differences.reduce(
          (sum, difference) => sum + Math.min(difference / rule.threshold, 1),
          0,
        ) / differences.length;
  const score = Math.max(0, Math.round(100 - avgRatio * 100));

  return {
    factor: rule.factor,
    label: rule.label,
    score,
    maxDifference,
    threshold: rule.threshold,
    reason: rule.buildReason(maxDifference, comparedLabel),
  };
}

export function calculateForecastAgreement(
  forecasts: ForecastAgreementInput[],
  options: ForecastAgreementOptions,
): ForecastAgreementResult | null {
  const [baseForecast, ...comparedForecasts] = forecasts;

  if (!baseForecast || comparedForecasts.length === 0) {
    return null;
  }

  const divergences = DIVERGENCE_RULES.map((rule) =>
    calculateRuleDivergence(
      rule,
      baseForecast.forecast,
      comparedForecasts.map((forecast) => forecast.forecast),
      options.comparedLabel,
    ),
  ).sort((a, b) => a.score - b.score);
  const score = Math.round(
    divergences.reduce((sum, divergence) => sum + divergence.score, 0) /
      divergences.length,
  );
  const level = getLevel(score);

  return {
    level,
    score,
    comparedItems: forecasts.map((forecast) => forecast.id),
    divergences,
    reason: getLevelReason(level, options),
  };
}

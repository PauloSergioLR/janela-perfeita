import type {
  ForecastConfidence,
  ForecastConfidenceLevel,
  HourScore,
  HourlyWeather,
} from "@/types";

const DRIZZLE_CODES = new Set([51, 53, 55, 56, 57]);
const RAIN_CODES = new Set([61, 63, 65, 66, 67]);
const SHOWER_CODES = new Set([80, 81, 82]);
const THUNDERSTORM_CODES = new Set([95, 96, 99]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

type ConfidencePenalty = {
  value: number;
  reason: string;
};

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function maxOf(values: number[]): number {
  return values.length > 0 ? Math.max(...values) : 0;
}

function variationOf(values: number[]): number {
  return values.length > 0 ? Math.max(...values) - Math.min(...values) : 0;
}

function precipitationAmount(weather: HourlyWeather): number {
  return Math.max(weather.precipitation, weather.rain, weather.showers);
}

function hasBadWeatherCode(weather: HourlyWeather): boolean {
  return (
    THUNDERSTORM_CODES.has(weather.weather_code) ||
    RAIN_CODES.has(weather.weather_code) ||
    SHOWER_CODES.has(weather.weather_code) ||
    SNOW_CODES.has(weather.weather_code)
  );
}

function hasModerateWeatherCode(weather: HourlyWeather): boolean {
  return DRIZZLE_CODES.has(weather.weather_code);
}

function levelFromScore(score: number): ForecastConfidenceLevel {
  if (score >= 75) {
    return "alta";
  }

  if (score >= 50) {
    return "media";
  }

  return "baixa";
}

function labelFromLevel(level: ForecastConfidenceLevel): string {
  const labels: Record<ForecastConfidenceLevel, string> = {
    alta: "Confiança alta",
    media: "Confiança média",
    baixa: "Confiança baixa",
  };

  return labels[level];
}

function collectRainPenalty(weather: HourlyWeather[]): ConfidencePenalty | null {
  const maxPrecipitation = maxOf(weather.map(precipitationAmount));
  const maxRainProbability = maxOf(
    weather.map((hour) => hour.precipitation_probability),
  );
  const badCode = weather.some(hasBadWeatherCode);
  const moderateCode = weather.some(hasModerateWeatherCode);

  if (maxPrecipitation >= 1 || badCode) {
    return {
      value: 45,
      reason: "chuva ou código meteorológico ruim na janela",
    };
  }

  if (maxPrecipitation > 0 || maxRainProbability >= 70) {
    return {
      value: 35,
      reason: "risco alto de chuva no período",
    };
  }

  if (maxRainProbability >= 40 || moderateCode) {
    return {
      value: 20,
      reason: "risco moderado de chuva",
    };
  }

  return null;
}

function collectWindPenalty(weather: HourlyWeather[]): ConfidencePenalty | null {
  const maxGusts = maxOf(weather.map((hour) => hour.wind_gusts_10m));

  if (maxGusts >= 55) {
    return {
      value: 24,
      reason: "rajadas fortes deixam a previsão menos estável",
    };
  }

  if (maxGusts >= 35) {
    return {
      value: 12,
      reason: "vento moderado pode variar durante a janela",
    };
  }

  return null;
}

function collectCloudPenalty(weather: HourlyWeather[]): ConfidencePenalty | null {
  const cloudVariation = variationOf(weather.map((hour) => hour.cloud_cover));

  if (cloudVariation >= 45) {
    return {
      value: 20,
      reason: "nuvens variam bastante entre as horas",
    };
  }

  if (cloudVariation >= 25) {
    return {
      value: 10,
      reason: "nuvens variam de forma moderada",
    };
  }

  return null;
}

function collectScorePenalty(scores: HourScore[]): ConfidencePenalty | null {
  const scoreVariation = variationOf(scores.map((hour) => hour.score));

  if (scoreVariation >= 30) {
    return {
      value: 18,
      reason: "scores oscilam bastante na janela",
    };
  }

  if (scoreVariation >= 15) {
    return {
      value: 8,
      reason: "scores oscilam um pouco na janela",
    };
  }

  return null;
}

export function calculateForecastConfidence(
  scores: HourScore[],
): ForecastConfidence {
  if (scores.length === 0) {
    return {
      level: "baixa",
      score: 0,
      reason: "Confiança baixa: janela sem horas avaliadas.",
    };
  }

  const weather = scores.map((score) => score.weather);
  const penalties = [
    collectRainPenalty(weather),
    collectWindPenalty(weather),
    collectCloudPenalty(weather),
    collectScorePenalty(scores),
  ].filter((penalty): penalty is ConfidencePenalty => penalty !== null);
  const score = clampScore(
    100 - penalties.reduce((sum, penalty) => sum + penalty.value, 0),
  );
  const level = levelFromScore(score);

  if (penalties.length === 0) {
    return {
      level,
      score,
      reason: `${labelFromLevel(level)}: baixa chance de chuva, vento estável e scores consistentes.`,
    };
  }

  return {
    level,
    score,
    reason: `${labelFromLevel(level)}: ${penalties
      .sort((a, b) => b.value - a.value)
      .slice(0, 2)
      .map((penalty) => penalty.reason)
      .join("; ")}.`,
  };
}

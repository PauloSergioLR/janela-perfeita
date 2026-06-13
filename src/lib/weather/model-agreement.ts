import type { ModelAgreement } from "@/types";
import type { NormalizedForecast, WeatherModelId } from "./weather-provider";
import { calculateForecastAgreement } from "./forecast-agreement";

interface ModelForecast {
  model: WeatherModelId;
  forecast: NormalizedForecast;
}

export function calculateModelAgreement(
  forecasts: ModelForecast[],
): ModelAgreement | null {
  const agreement = calculateForecastAgreement(
    forecasts.map((forecast) => ({
      id: forecast.model,
      forecast: forecast.forecast,
    })),
    {
      comparedLabel: "Modelos",
      highReason: "Concordância alta entre os modelos comparados.",
      mediumReason: "Concordância média: alguns fatores variam entre modelos.",
      lowReason: "Concordância baixa: modelos divergem em fatores relevantes.",
    },
  );

  if (!agreement) {
    return null;
  }

  return {
    level: agreement.level,
    score: agreement.score,
    comparedModels: agreement.comparedItems,
    divergences: agreement.divergences,
    reason: agreement.reason,
  };
}

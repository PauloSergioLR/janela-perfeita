import type { WeatherProviderComparison } from "@/types";
import type { NormalizedForecast } from "./weather-provider";
import { calculateForecastAgreement } from "./forecast-agreement";

interface ProviderForecast {
  provider: string;
  forecast: NormalizedForecast;
}

export function calculateProviderComparison(
  forecasts: ProviderForecast[],
): WeatherProviderComparison | null {
  const comparison = calculateForecastAgreement(
    forecasts.map((forecast) => ({
      id: forecast.provider,
      forecast: forecast.forecast,
    })),
    {
      comparedLabel: "Fontes",
      highReason: "As fontes meteorológicas estão próximas nesta janela.",
      mediumReason: "As fontes meteorológicas variam em alguns fatores.",
      lowReason: "As fontes meteorológicas divergem em fatores relevantes.",
    },
  );

  if (!comparison) {
    return null;
  }

  return {
    level: comparison.level,
    score: comparison.score,
    comparedProviders: comparison.comparedItems,
    divergences: comparison.divergences,
    reason: comparison.reason,
  };
}

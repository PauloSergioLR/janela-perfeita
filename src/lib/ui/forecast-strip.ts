import type { WeeklyWeatherDayOverview } from "@/types";

export type ForecastClassificationTone =
  | "excellent"
  | "good"
  | "regular"
  | "rain";

export interface ForecastClassification {
  label: string;
  tone: ForecastClassificationTone;
}

type ForecastConditionInput = Pick<
  WeeklyWeatherDayOverview,
  "comfortScore" | "precipitationProbabilityMax" | "precipitationSum"
>;

export function getForecastClassification(
  day: ForecastConditionInput,
): ForecastClassification {
  if (
    (day.precipitationProbabilityMax ?? 0) >= 50 ||
    (day.precipitationSum ?? 0) >= 2
  ) {
    return { label: "Atenção à chuva", tone: "rain" };
  }

  if (day.comfortScore >= 85) {
    return { label: "Ótimo", tone: "excellent" };
  }

  if (day.comfortScore >= 70) {
    return { label: "Bom", tone: "good" };
  }

  return { label: "Regular", tone: "regular" };
}

export function formatForecastDayLabel(date: string, todayDate: string): string {
  if (date === todayDate) {
    return "Hoje";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
  }).format(new Date(`${date}T00:00:00`));
}

export function formatForecastDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T00:00:00`));
}

export function formatTemperatureRange(
  minimum: number | null,
  maximum: number | null,
): string {
  const formatTemperature = (value: number | null): string =>
    value === null ? "—" : `${Math.round(value)}°`;

  return `${formatTemperature(minimum)} / ${formatTemperature(maximum)}`;
}

export function getForecastShortSummary(summary: string, fallback: string): string {
  return summary.split(".")[0]?.trim() || fallback;
}

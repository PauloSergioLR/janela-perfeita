import type { HourlyWeather } from "@/types";

export interface DailyClimateSummary {
  averageHumidity: number | null;
  sunshineHours: number | null;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function getDailyClimateSummary(
  hourly: HourlyWeather[],
): DailyClimateSummary {
  const humidities = hourly
    .map((weather) => weather.relative_humidity_2m)
    .filter(Number.isFinite);
  const sunshineDurations = hourly
    .map((weather) => weather.sunshine_duration)
    .filter(Number.isFinite);

  return {
    averageHumidity: average(humidities),
    sunshineHours:
      sunshineDurations.length > 0
        ? Math.round((sunshineDurations.reduce((sum, value) => sum + value, 0) / 3600) * 10) / 10
        : null,
  };
}

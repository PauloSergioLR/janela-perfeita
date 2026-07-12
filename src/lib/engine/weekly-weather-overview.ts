import type {
  City,
  DailyAstronomy,
  HourlyWeather,
  WeeklyWeatherDayOverview,
  WeeklyWeatherHighlights,
  WeeklyWeatherOverview,
} from "@/types";
import {
  buildDailyWeatherOverview,
  DAILY_OVERVIEW_DISCLAIMER,
} from "./daily-weather-overview";

interface BuildWeeklyWeatherOverviewInput {
  city: City;
  hourly: HourlyWeather[];
  dailyAstronomy: DailyAstronomy[];
  generatedAt: string;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateComfortScore(day: {
  temperatureMin: number | null;
  temperatureMax: number | null;
  precipitationProbabilityMax: number | null;
  precipitationSum: number | null;
  windSpeedMax: number | null;
  uvIndexMax: number | null;
}): number {
  const averageTemperature =
    day.temperatureMin !== null && day.temperatureMax !== null
      ? (day.temperatureMin + day.temperatureMax) / 2
      : 22;
  const temperaturePenalty = Math.abs(averageTemperature - 22) * 2.2;
  const rainPenalty = (day.precipitationProbabilityMax ?? 0) * 0.35;
  const precipitationPenalty = Math.min((day.precipitationSum ?? 0) * 6, 30);
  const windPenalty = Math.max(0, (day.windSpeedMax ?? 0) - 25) * 1.2;
  const uvPenalty = Math.max(0, (day.uvIndexMax ?? 0) - 8) * 4;

  return clampScore(
    100 -
      temperaturePenalty -
      rainPenalty -
      precipitationPenalty -
      windPenalty -
      uvPenalty,
  );
}

function buildSummary(day: {
  weatherLabel: string;
  precipitationProbabilityMax: number | null;
  precipitationSum: number | null;
  windSpeedMax: number | null;
  temperatureMin: number | null;
  temperatureMax: number | null;
}): string {
  const parts = [day.weatherLabel];

  if ((day.precipitationProbabilityMax ?? 0) >= 60) {
    parts.push("alta chance de chuva");
  } else if ((day.precipitationSum ?? 0) > 0) {
    parts.push("chuva fraca possível");
  } else {
    parts.push("baixo risco de chuva");
  }

  if ((day.windSpeedMax ?? 0) >= 30) {
    parts.push("vento forte");
  }

  if ((day.temperatureMax ?? 0) >= 30) {
    parts.push("dia quente");
  } else if ((day.temperatureMin ?? 99) <= 10) {
    parts.push("manha fria");
  }

  return parts.join(", ") + ".";
}

function byScore(day: WeeklyWeatherDayOverview): number {
  return day.comfortScore;
}

function byRain(day: WeeklyWeatherDayOverview): number {
  return (
    (day.precipitationSum ?? 0) * 100 +
    (day.precipitationProbabilityMax ?? 0)
  );
}

function byHeat(day: WeeklyWeatherDayOverview): number {
  return day.temperatureMax ?? -Infinity;
}

function byCold(day: WeeklyWeatherDayOverview): number {
  return day.temperatureMin ?? Infinity;
}

function maxBy(
  days: WeeklyWeatherDayOverview[],
  selector: (day: WeeklyWeatherDayOverview) => number,
): WeeklyWeatherDayOverview | null {
  return [...days].sort((a, b) => selector(b) - selector(a))[0] ?? null;
}

function minBy(
  days: WeeklyWeatherDayOverview[],
  selector: (day: WeeklyWeatherDayOverview) => number,
): WeeklyWeatherDayOverview | null {
  return [...days].sort((a, b) => selector(a) - selector(b))[0] ?? null;
}

function buildHighlights(
  days: WeeklyWeatherDayOverview[],
): WeeklyWeatherHighlights {
  return {
    bestDay: maxBy(days, byScore),
    worstDay: minBy(days, byScore),
    rainiestDay: maxBy(days, byRain),
    hottestDay: maxBy(days, byHeat),
    coldestDay: minBy(days, byCold),
  };
}

export function buildWeeklyWeatherOverview({
  city,
  hourly,
  dailyAstronomy,
  generatedAt,
}: BuildWeeklyWeatherOverviewInput): WeeklyWeatherOverview {
  const days = dailyAstronomy.map((astronomy) => {
    const overview = buildDailyWeatherOverview({
      city,
      hourly,
      astronomy,
      generatedAt,
    });

    return {
      ...overview,
      comfortScore: calculateComfortScore(overview),
      summary: buildSummary(overview),
    };
  });

  return {
    city,
    startDate: days[0]?.date ?? "",
    endDate: days[days.length - 1]?.date ?? "",
    generatedAt,
    days,
    highlights: buildHighlights(days),
    disclaimer: DAILY_OVERVIEW_DISCLAIMER,
  };
}

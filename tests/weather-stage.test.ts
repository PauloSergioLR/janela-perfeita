import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getActivityById } from "@/lib/domain/activities";
import { getWeatherStageVariant } from "@/lib/ui/weather-stage";
import type {
  City,
  DailyWeatherOverview,
  HourlyWeather,
  Recommendation,
  WeeklyWeatherDayOverview,
  WeeklyWeatherOverview,
} from "@/types";
import { makeHourlyWeather } from "./fixtures/weather";

const city = {
  name: "Criciuma",
  country: "Brasil",
  coordinates: { lat: -28.68, lon: -49.37 },
} satisfies City;

function makeDailyOverview(
  weatherCode: number | null,
  hourly: HourlyWeather[] = [],
): DailyWeatherOverview {
  return {
    city,
    date: "2030-06-05",
    generatedAt: "2030-06-05T09:00:00.000Z",
    sunrise: "2030-06-05T06:30",
    sunset: "2030-06-05T17:30",
    weatherCode,
    weatherLabel: "Tempo previsto",
    temperatureMax: null,
    temperatureMin: null,
    apparentTemperatureMax: null,
    apparentTemperatureMin: null,
    precipitationSum: null,
    precipitationProbabilityMax: null,
    windSpeedMax: null,
    windGustsMax: null,
    uvIndexMax: null,
    hourly,
    disclaimer: "Previsao estimada.",
  };
}

function makeWeeklyOverview(
  weatherCode: number,
  hourly: HourlyWeather[] = [],
): WeeklyWeatherOverview {
  const day = {
    ...makeDailyOverview(weatherCode, hourly),
    comfortScore: 75,
    summary: "Dia estavel.",
  } satisfies WeeklyWeatherDayOverview;

  return {
    city,
    startDate: day.date,
    endDate: day.date,
    generatedAt: day.generatedAt,
    days: [day],
    highlights: {
      bestDay: day,
      worstDay: null,
      rainiestDay: null,
      hottestDay: null,
      coldestDay: null,
    },
    disclaimer: day.disclaimer,
  };
}

describe("WeatherStage", () => {
  const globalsCss = readFileSync(
    join(process.cwd(), "src/app/globals.css"),
    "utf8",
  );

  it("usa fundo neutro antes de haver dados climaticos", () => {
    expect(getWeatherStageVariant({})).toBe("neutral");
  });

  it("prioriza chuva para condicoes com precipitacao", () => {
    expect(
      getWeatherStageVariant({
        weather: makeHourlyWeather("2030-06-05T14:00", {
          precipitation: 1.2,
        }),
      }),
    ).toBe("rain");
  });

  it("usa estados semanticos para atividades de por do sol e estrelas", () => {
    expect(
      getWeatherStageVariant({ activityId: "fotografar_por_do_sol" }),
    ).toBe("sunset");
    expect(getWeatherStageVariant({ activityId: "observar_estrelas" })).toBe(
      "night",
    );
  });

  it("mapeia tempo limpo, nublado e noturno", () => {
    expect(
      getWeatherStageVariant({
        weather: makeHourlyWeather("2030-06-05T14:00", { weather_code: 0 }),
      }),
    ).toBe("clear");
    expect(
      getWeatherStageVariant({
        weather: makeHourlyWeather("2030-06-05T14:00", { weather_code: 3 }),
      }),
    ).toBe("cloudy");
    expect(
      getWeatherStageVariant({
        weather: makeHourlyWeather("2030-06-05T21:00", { weather_code: 0 }),
      }),
    ).toBe("night");
  });

  it("usa dados de recomendacao, dia e semana quando existirem", () => {
    const weather = makeHourlyWeather("2030-06-05T14:00", {
      weather_code: 0,
    });
    const recommendation = {
      activity: getActivityById("correr")!,
      city,
      date: "2030-06-05",
      generatedAt: "2030-06-05T09:00:00.000Z",
      scores: [
        {
          time: weather.time,
          hourLabel: "14:00",
          score: 80,
          weather,
          breakdown: [],
        },
      ],
      windows: [],
      bestWindow: null,
      disclaimer: "Previsao estimada.",
    } satisfies Recommendation;

    expect(getWeatherStageVariant({ recommendation })).toBe("clear");
    expect(
      getWeatherStageVariant({
        dailyOverview: makeDailyOverview(3),
      }),
    ).toBe("cloudy");
    expect(
      getWeatherStageVariant({
        weeklyOverview: makeWeeklyOverview(0),
      }),
    ).toBe("clear");
    expect(
      getWeatherStageVariant({
        dailyOverview: makeDailyOverview(3, [
          makeHourlyWeather("2030-06-05T14:00", { weather_code: 0 }),
        ]),
      }),
    ).toBe("clear");
    expect(
      getWeatherStageVariant({
        weeklyOverview: makeWeeklyOverview(3, [
          makeHourlyWeather("2030-06-05T14:00", { weather_code: 0 }),
        ]),
      }),
    ).toBe("clear");
  });

  it("mantem animacoes discretas com suporte a reduced motion", () => {
    expect(globalsCss).toContain(".weather-stage");
    expect(globalsCss).toContain('[data-variant="rain"]');
    expect(globalsCss).toContain('[data-variant="sunset"]');
    expect(globalsCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(globalsCss).not.toContain("maplibre");
  });
});

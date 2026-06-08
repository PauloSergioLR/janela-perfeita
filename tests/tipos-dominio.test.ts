import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  Activity,
  ActivityId,
  ActivityRule,
  City,
  DailyAstronomy,
  HourScore,
  HourlyWeather,
  Recommendation,
  RuleResult,
  WeatherContext,
  WindowResult,
} from "@/types";

const weather: HourlyWeather = {
  time: "2026-06-05T10:00",
  temperature_2m: 20,
  apparent_temperature: 20,
  precipitation: 0,
  precipitation_probability: 0,
  rain: 0,
  showers: 0,
  weather_code: 0,
  wind_speed_10m: 8,
  wind_gusts_10m: 12,
  cloud_cover: 35,
  uv_index: 2,
  relative_humidity_2m: 62,
};

const context: WeatherContext = {
  localHour: 10,
  isToday: true,
  isPastHour: false,
  isNight: false,
  isGoldenHour: false,
  minutesFromSunset: -420,
  sunrise: "2026-06-05T06:30",
  sunset: "2026-06-05T17:58",
};

describe("tipos centrais do domínio", () => {
  it("mantém ActivityId restrito às atividades do MVP", () => {
    expectTypeOf<ActivityId>().toEqualTypeOf<
      | "correr"
      | "caminhar"
      | "pedalar"
      | "fotografar_por_do_sol"
      | "observar_estrelas"
      | "lavar_carro"
    >();
  });

  it("modela uma recomendação com timestamps em WindowResult", () => {
    const rule: ActivityRule = {
      factor: "temperatura",
      label: "Temperatura",
      weight: 40,
      evaluate: (): RuleResult => ({
        factor: "temperatura",
        label: "Temperatura",
        score: 95,
        weight: 40,
        reason: "Temperatura agradável para correr.",
      }),
    };

    const activity: Activity = {
      id: "correr",
      name: "Correr",
      shortDescription: "Melhor janela para corrida ao ar livre.",
      minRecommendedScore: 60,
      minDurationHours: 1,
      rules: [rule],
    };

    const city: City = {
      id: 3460428,
      name: "Criciúma",
      country: "Brasil",
      admin1: "Santa Catarina",
      timezone: "America/Sao_Paulo",
      coordinates: {
        lat: -28.6775,
        lon: -49.3697,
      },
    };

    const astronomy: DailyAstronomy = {
      date: "2026-06-05",
      sunrise: context.sunrise,
      sunset: context.sunset,
    };

    const hourScore: HourScore = {
      time: weather.time,
      hourLabel: "10:00",
      score: 95,
      breakdown: [rule.evaluate(weather, context)],
    };

    const bestWindow: WindowResult = {
      startTime: "2026-06-05T10:00",
      endTime: "2026-06-05T11:00",
      startLabel: "10:00",
      endLabel: "11:00",
      durationHours: 1,
      avgScore: 95,
      peakScore: 95,
      highlights: ["Temperatura agradável"],
      scores: [hourScore],
    };

    const recommendation: Recommendation = {
      activity,
      city,
      date: astronomy.date,
      generatedAt: "2026-06-05T09:00:00-03:00",
      scores: [hourScore],
      windows: [bestWindow],
      bestWindow,
      disclaimer: "Recomendação estimada com base na previsão meteorológica.",
    };

    expect(recommendation.bestWindow?.startTime).toBe("2026-06-05T10:00");
    expect(recommendation.bestWindow?.endTime).toBe("2026-06-05T11:00");
  });
});

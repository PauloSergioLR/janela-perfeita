import { describe, expect, it } from "vitest";
import { buildWeeklyWeatherOverview } from "@/lib/engine/weekly-weather-overview";
import { baseAstronomy, criciumaCity, makeHourlyWeather } from "./fixtures/weather";

describe("overview semanal do clima", () => {
  it("consolida dias, destaques e resumo da semana", () => {
    const secondAstronomy = {
      date: "2026-06-06",
      sunrise: "2026-06-06T06:31",
      sunset: "2026-06-06T18:01",
    };

    const overview = buildWeeklyWeatherOverview({
      city: criciumaCity,
      hourly: [
        makeHourlyWeather("2026-06-05T08:00", {
          temperature_2m: 18,
          precipitation_probability: 0,
          precipitation: 0,
          weather_code: 0,
          wind_speed_10m: 8,
          uv_index: 2,
        }),
        makeHourlyWeather("2026-06-05T15:00", {
          temperature_2m: 24,
          precipitation_probability: 10,
          precipitation: 0,
          weather_code: 0,
          wind_speed_10m: 12,
          uv_index: 4,
        }),
        makeHourlyWeather("2026-06-06T08:00", {
          temperature_2m: 29,
          precipitation_probability: 65,
          precipitation: 3,
          weather_code: 63,
          wind_speed_10m: 31,
          uv_index: 8,
        }),
        makeHourlyWeather("2026-06-06T15:00", {
          temperature_2m: 34,
          precipitation_probability: 80,
          precipitation: 5,
          weather_code: 63,
          wind_speed_10m: 34,
          uv_index: 10,
        }),
      ],
      dailyAstronomy: [baseAstronomy, secondAstronomy],
      generatedAt: "2026-06-05T06:00:00.000Z",
    });

    expect(overview.startDate).toBe("2026-06-05");
    expect(overview.endDate).toBe("2026-06-06");
    expect(overview.days).toHaveLength(2);
    expect(overview.days[0].comfortScore).toBeGreaterThan(
      overview.days[1].comfortScore,
    );
    expect(overview.days[1].summary).toContain("alta chance de chuva");
    expect(overview.highlights.bestDay?.date).toBe("2026-06-05");
    expect(overview.highlights.worstDay?.date).toBe("2026-06-06");
    expect(overview.highlights.rainiestDay?.date).toBe("2026-06-06");
    expect(overview.highlights.hottestDay?.date).toBe("2026-06-06");
    expect(overview.highlights.coldestDay?.date).toBe("2026-06-05");
    expect(overview.disclaimer).toContain("Open-Meteo");
  });

  it("mantem estrutura vazia quando nao ha astronomia diaria", () => {
    const overview = buildWeeklyWeatherOverview({
      city: criciumaCity,
      hourly: [],
      dailyAstronomy: [],
      generatedAt: "2026-06-05T06:00:00.000Z",
    });

    expect(overview.startDate).toBe("");
    expect(overview.endDate).toBe("");
    expect(overview.days).toEqual([]);
    expect(overview.highlights.bestDay).toBeNull();
    expect(overview.highlights.rainiestDay).toBeNull();
  });
});

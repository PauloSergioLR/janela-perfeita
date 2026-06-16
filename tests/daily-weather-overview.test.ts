import { describe, expect, it } from "vitest";
import {
  buildDailyWeatherOverview,
  getWeatherCodeLabel,
} from "@/lib/engine/daily-weather-overview";
import { baseAstronomy, criciumaCity, makeHourlyWeather } from "./fixtures/weather";

describe("overview diario do clima", () => {
  it("consolida principais metricas do dia a partir das horas", () => {
    const overview = buildDailyWeatherOverview({
      city: criciumaCity,
      hourly: [
        makeHourlyWeather("2026-06-04T23:00", { temperature_2m: 8 }),
        makeHourlyWeather("2026-06-05T08:00", {
          temperature_2m: 12,
          apparent_temperature: 11,
          precipitation: 0.4,
          precipitation_probability: 25,
          wind_speed_10m: 9,
          wind_gusts_10m: 16,
          uv_index: 2,
          weather_code: 3,
        }),
        makeHourlyWeather("2026-06-05T15:00", {
          temperature_2m: 24,
          apparent_temperature: 27,
          rain: 1.2,
          precipitation_probability: 70,
          wind_speed_10m: 18,
          wind_gusts_10m: 32,
          uv_index: 7,
          weather_code: 63,
        }),
      ],
      astronomy: baseAstronomy,
      generatedAt: "2026-06-05T06:00:00.000Z",
    });

    expect(overview.date).toBe("2026-06-05");
    expect(overview.hourly).toHaveLength(2);
    expect(overview.weatherCode).toBe(63);
    expect(overview.weatherLabel).toBe("Chuva");
    expect(overview.temperatureMin).toBe(12);
    expect(overview.temperatureMax).toBe(24);
    expect(overview.apparentTemperatureMin).toBe(11);
    expect(overview.apparentTemperatureMax).toBe(27);
    expect(overview.precipitationSum).toBe(1.6);
    expect(overview.precipitationProbabilityMax).toBe(70);
    expect(overview.windSpeedMax).toBe(18);
    expect(overview.windGustsMax).toBe(32);
    expect(overview.uvIndexMax).toBe(7);
  });

  it("retorna campos nulos quando nao ha horas no dia", () => {
    const overview = buildDailyWeatherOverview({
      city: criciumaCity,
      hourly: [makeHourlyWeather("2026-06-04T23:00")],
      astronomy: baseAstronomy,
      generatedAt: "2026-06-05T06:00:00.000Z",
    });

    expect(overview.hourly).toEqual([]);
    expect(overview.weatherCode).toBeNull();
    expect(overview.temperatureMax).toBeNull();
    expect(overview.precipitationSum).toBeNull();
    expect(overview.weatherLabel).toBe("Sem dados");
  });

  it("nomeia weather codes principais", () => {
    expect(getWeatherCodeLabel(0)).toBe("Céu limpo");
    expect(getWeatherCodeLabel(45)).toBe("Nevoeiro");
    expect(getWeatherCodeLabel(95)).toBe("Tempestade");
    expect(getWeatherCodeLabel(null)).toBe("Sem dados");
  });
});

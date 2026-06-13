import { describe, expect, it } from "vitest";
import { calculateModelAgreement } from "@/lib/weather/model-agreement";
import type { NormalizedForecast } from "@/lib/weather/weather-provider";
import { baseAstronomy, makeHourlyWeather } from "./fixtures/weather";

function makeForecast(
  overrides: Parameters<typeof makeHourlyWeather>[1] = {},
): NormalizedForecast {
  return {
    hourly: [
      makeHourlyWeather("2030-06-05T07:00", overrides),
      makeHourlyWeather("2030-06-05T08:00", overrides),
    ],
    astronomy: baseAstronomy,
    dailyAstronomy: [baseAstronomy],
  };
}

describe("comparacao de modelos meteorologicos", () => {
  it("retorna concordancia alta quando os modelos divergem pouco", () => {
    const agreement = calculateModelAgreement([
      { model: "best_match", forecast: makeForecast() },
      {
        model: "gfs_global",
        forecast: makeForecast({
          precipitation_probability: 4,
          precipitation: 0.1,
          temperature_2m: 20,
          apparent_temperature: 20,
          wind_speed_10m: 9,
          wind_gusts_10m: 13,
          cloud_cover: 32,
        }),
      },
    ]);

    expect(agreement).toEqual(
      expect.objectContaining({
        level: "alta",
        comparedModels: ["best_match", "gfs_global"],
      }),
    );
    expect(agreement?.score).toBeGreaterThanOrEqual(75);
  });

  it("retorna concordancia baixa quando chuva, temperatura, vento e nuvens divergem", () => {
    const agreement = calculateModelAgreement([
      { model: "best_match", forecast: makeForecast() },
      {
        model: "gfs_global",
        forecast: makeForecast({
          precipitation_probability: 80,
          precipitation: 6,
          temperature_2m: 30,
          apparent_temperature: 31,
          wind_speed_10m: 34,
          wind_gusts_10m: 42,
          cloud_cover: 95,
        }),
      },
      {
        model: "ecmwf_ifs025",
        forecast: makeForecast({
          precipitation_probability: 70,
          precipitation: 4,
          temperature_2m: 28,
          apparent_temperature: 29,
          wind_speed_10m: 28,
          wind_gusts_10m: 35,
          cloud_cover: 90,
        }),
      },
    ]);

    expect(agreement).toEqual(
      expect.objectContaining({
        level: "baixa",
        comparedModels: ["best_match", "gfs_global", "ecmwf_ifs025"],
      }),
    );
    expect(agreement?.score).toBeLessThan(50);
    expect(agreement?.divergences[0]?.score).toBeLessThanOrEqual(
      agreement?.divergences.at(-1)?.score ?? 100,
    );
  });

  it("retorna null quando nao ha modelo para comparar", () => {
    expect(
      calculateModelAgreement([{ model: "best_match", forecast: makeForecast() }]),
    ).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { calculateProviderComparison } from "@/lib/weather/provider-comparison";
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

describe("comparacao entre providers meteorologicos", () => {
  it("retorna concordancia alta quando Open-Meteo e MET Norway divergem pouco", () => {
    const comparison = calculateProviderComparison([
      { provider: "Open-Meteo", forecast: makeForecast() },
      {
        provider: "MET Norway",
        forecast: makeForecast({
          precipitation_probability: 5,
          precipitation: 0.1,
          temperature_2m: 20,
          apparent_temperature: 20,
          wind_speed_10m: 10,
          wind_gusts_10m: 14,
          cloud_cover: 35,
          relative_humidity_2m: 65,
        }),
      },
    ]);

    expect(comparison).toEqual(
      expect.objectContaining({
        level: "alta",
        providerAgreementLevel: "alta",
        comparedProviders: ["Open-Meteo", "MET Norway"],
      }),
    );
    expect(comparison?.providerAgreementScore).toBeGreaterThanOrEqual(75);
    expect(comparison?.providerDisagreementReasons).toEqual([]);
  });

  it("retorna concordancia media quando ha variacao moderada", () => {
    const comparison = calculateProviderComparison([
      { provider: "Open-Meteo", forecast: makeForecast() },
      {
        provider: "MET Norway",
        forecast: makeForecast({
          precipitation_probability: 20,
          precipitation: 0.6,
          temperature_2m: 21,
          apparent_temperature: 21,
          wind_speed_10m: 12,
          wind_gusts_10m: 16,
          cloud_cover: 45,
          relative_humidity_2m: 72,
        }),
      },
    ]);

    expect(comparison).toEqual(
      expect.objectContaining({
        level: "media",
        providerAgreementLevel: "media",
        providerAgreementScore: expect.any(Number),
      }),
    );
    expect(comparison?.providerAgreementScore).toBeGreaterThanOrEqual(50);
    expect(comparison?.providerAgreementScore).toBeLessThan(75);
    expect(comparison?.providerDisagreementReasons.length).toBeGreaterThan(0);
  });

  it("retorna concordancia baixa quando chuva, temperatura, vento, umidade e nuvens divergem", () => {
    const comparison = calculateProviderComparison([
      { provider: "Open-Meteo", forecast: makeForecast() },
      {
        provider: "MET Norway",
        forecast: makeForecast({
          precipitation_probability: 80,
          precipitation: 6,
          temperature_2m: 30,
          apparent_temperature: 31,
          wind_speed_10m: 34,
          wind_gusts_10m: 42,
          cloud_cover: 95,
          relative_humidity_2m: 95,
        }),
      },
    ]);

    expect(comparison).toEqual(
      expect.objectContaining({
        level: "baixa",
        providerAgreementLevel: "baixa",
        comparedProviders: ["Open-Meteo", "MET Norway"],
      }),
    );
    expect(comparison?.providerAgreementScore).toBeLessThan(50);
    expect(comparison?.providerDisagreementReasons).toEqual(
      expect.arrayContaining([
        expect.stringContaining("chuva"),
        expect.stringContaining("temperatura"),
        expect.stringContaining("vento"),
        expect.stringContaining("umidade"),
      ]),
    );
  });

  it("retorna null quando nao ha provider secundario para comparar", () => {
    expect(
      calculateProviderComparison([
        { provider: "Open-Meteo", forecast: makeForecast() },
      ]),
    ).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  openMeteoErrorSchema,
  openMeteoForecastResponseSchema,
  openMeteoGeocodingResponseSchema,
  parseForecastResponse,
  parseGeocodingResponse,
} from "@/lib/services/open-meteo.schemas";
import {
  invalidOpenMeteoForecastFixture,
  invalidOpenMeteoGeocodingFixture,
  openMeteoErrorFixture,
  openMeteoForecastFixture,
  openMeteoGeocodingFixture,
} from "./fixtures/open-meteo";

describe("schemas da API Open-Meteo", () => {
  it("aceita fixture valida de forecast e mapeia para o dominio", () => {
    expect(() =>
      openMeteoForecastResponseSchema.parse(openMeteoForecastFixture),
    ).not.toThrow();

    const forecast = parseForecastResponse(openMeteoForecastFixture);

    expect(forecast.hourly).toHaveLength(24);
    expect(forecast.hourly[0]).toMatchObject({
      time: "2026-06-05T00:00",
      temperature_2m: 20,
      precipitation: 0,
      wind_speed_10m: 10,
      cloud_cover: 40,
      uv_index: 2,
      relative_humidity_2m: 60,
    });
    expect(forecast.astronomy).toEqual({
      date: "2026-06-05",
      sunrise: "2026-06-05T06:30",
      sunset: "2026-06-05T17:58",
    });
  });

  it("rejeita fixture invalida de forecast", () => {
    expect(() =>
      openMeteoForecastResponseSchema.parse(invalidOpenMeteoForecastFixture),
    ).toThrow();
    expect(() => parseForecastResponse(invalidOpenMeteoForecastFixture)).toThrow();
  });

  it("aceita fixture valida de geocoding e mapeia cidades", () => {
    expect(() =>
      openMeteoGeocodingResponseSchema.parse(openMeteoGeocodingFixture),
    ).not.toThrow();

    expect(parseGeocodingResponse(openMeteoGeocodingFixture)).toEqual([
      {
        id: 3460428,
        name: "Criciuma",
        country: "Brasil",
        admin1: "Santa Catarina",
        timezone: "America/Sao_Paulo",
        coordinates: {
          lat: -28.6775,
          lon: -49.3697,
        },
      },
    ]);
  });

  it("rejeita fixture invalida de geocoding", () => {
    expect(() =>
      openMeteoGeocodingResponseSchema.parse(invalidOpenMeteoGeocodingFixture),
    ).toThrow();
    expect(() =>
      parseGeocodingResponse(invalidOpenMeteoGeocodingFixture),
    ).toThrow();
  });

  it("aceita payload de erro oficial da Open-Meteo", () => {
    expect(openMeteoErrorSchema.parse(openMeteoErrorFixture)).toEqual(
      openMeteoErrorFixture,
    );
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildMetNorwayForecastUrl,
  getMetNorwayForecast,
  mapMetNorwaySymbolToWeatherCode,
  parseMetNorwayForecastResponse,
} from "@/lib/services/met-norway-weather.service";
import { MetNorwayWeatherProvider } from "@/lib/weather/met-norway-weather-provider";
import type { DailyAstronomy } from "@/types";

const referenceAstronomy: DailyAstronomy = {
  date: "2030-06-05",
  sunrise: "2030-06-05T06:30",
  sunset: "2030-06-05T18:00",
};

function createMetNorwayFixture() {
  return {
    properties: {
      timeseries: [
        {
          time: "2030-06-05T10:00:00Z",
          data: {
            instant: {
              details: {
                air_temperature: 18.5,
                relative_humidity: 72,
                wind_speed: 4,
                wind_speed_of_gust: 7,
                wind_from_direction: 220,
                cloud_area_fraction: 48,
                cloud_area_fraction_low: 20,
                cloud_area_fraction_medium: 30,
                cloud_area_fraction_high: 55,
                ultraviolet_index_clear_sky: 3,
              },
            },
            next_1_hours: {
              summary: {
                symbol_code: "rainshowers_day",
              },
              details: {
                precipitation_amount: 1.2,
                probability_of_precipitation: 65,
              },
            },
          },
        },
        {
          time: "2030-06-06T10:00:00Z",
          data: {
            instant: {
              details: {
                air_temperature: 20,
                relative_humidity: 60,
                wind_speed: 3,
                cloud_area_fraction: 20,
              },
            },
            next_1_hours: {
              summary: {
                symbol_code: "fair_day",
              },
              details: {
                precipitation_amount: 0,
              },
            },
          },
        },
      ],
    },
  };
}

function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("provider MET Norway", () => {
  it("monta URL com coordenadas", () => {
    const url = buildMetNorwayForecastUrl({
      lat: -28.6775,
      lon: -49.3697,
      date: "2030-06-05",
      userAgent: "JanelaPerfeita/1.1 contato@example.com",
      referenceAstronomy: [referenceAstronomy],
    });

    expect(url.origin).toBe("https://api.met.no");
    expect(url.pathname).toBe("/weatherapi/locationforecast/2.0/compact");
    expect(url.searchParams.get("lat")).toBe("-28.6775");
    expect(url.searchParams.get("lon")).toBe("-49.3697");
  });

  it("normaliza forecast para NormalizedForecast", () => {
    const forecast = parseMetNorwayForecastResponse(createMetNorwayFixture(), {
      lat: -28.6775,
      lon: -49.3697,
      date: "2030-06-05",
      userAgent: "JanelaPerfeita/1.1 contato@example.com",
      referenceAstronomy: [referenceAstronomy],
    });

    expect(forecast.astronomy).toEqual(referenceAstronomy);
    expect(forecast.hourly).toHaveLength(1);
    expect(forecast.hourly[0]).toEqual(
      expect.objectContaining({
        time: "2030-06-05T10:00",
        temperature_2m: 18.5,
        apparent_temperature: 18.5,
        precipitation: 1.2,
        precipitation_probability: 65,
        rain: 1.2,
        showers: 1.2,
        weather_code: 81,
        weather_symbol: "rainshowers_day",
        wind_speed_10m: 14.4,
        wind_gusts_10m: 25.2,
        wind_direction_10m: 220,
        cloud_cover: 48,
        relative_humidity_2m: 72,
      }),
    );
  });

  it("mapeia simbolos meteorologicos para weather code aproximado", () => {
    expect(mapMetNorwaySymbolToWeatherCode("clearsky_day")).toBe(0);
    expect(mapMetNorwaySymbolToWeatherCode("cloudy")).toBe(3);
    expect(mapMetNorwaySymbolToWeatherCode("heavyrainshowers_night")).toBe(82);
    expect(mapMetNorwaySymbolToWeatherCode("snow")).toBe(73);
    expect(mapMetNorwaySymbolToWeatherCode("rainandthunder")).toBe(95);
  });

  it("provider sem User-Agent nao chama API externa", async () => {
    const provider = new MetNorwayWeatherProvider("");

    await expect(
      provider.getForecast({
        lat: -28.6775,
        lon: -49.3697,
        date: "2030-06-05",
        referenceAstronomy: [referenceAstronomy],
      }),
    ).rejects.toThrow("MET_NORWAY_USER_AGENT nao configurado.");
  });

  it("busca forecast com User-Agent configurado", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(createJsonResponse(createMetNorwayFixture()));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new MetNorwayWeatherProvider(
      "JanelaPerfeita/1.1 contato@example.com",
    );
    const forecast = await provider.getForecast({
      lat: -28.6775,
      lon: -49.3697,
      date: "2030-06-05",
      referenceAstronomy: [referenceAstronomy],
    });

    expect(fetchMock).toHaveBeenCalledWith(expect.any(URL), {
      headers: {
        "User-Agent": "JanelaPerfeita/1.1 contato@example.com",
      },
    });
    expect(forecast.hourly).toHaveLength(1);
  });

  it("propaga erro amigavel da MET Norway", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse(
        {
          error: {
            message: "Bad request.",
          },
        },
        400,
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getMetNorwayForecast({
        lat: -28.6775,
        lon: -49.3697,
        date: "2030-06-05",
        userAgent: "JanelaPerfeita/1.1 contato@example.com",
        referenceAstronomy: [referenceAstronomy],
      }),
    ).rejects.toThrow("MET Norway retornou erro na previsao: Bad request.");
  });
});

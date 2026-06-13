import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildWeatherApiForecastUrl,
  getWeatherApiForecast,
  parseWeatherApiForecastResponse,
} from "@/lib/services/weatherapi-weather.service";
import { WeatherApiWeatherProvider } from "@/lib/weather/weatherapi-weather-provider";

function createWeatherApiFixture() {
  const hours = Array.from({ length: 24 }, (_, hour) => ({
    time: `2030-06-05 ${String(hour).padStart(2, "0")}:00`,
    temp_c: 20,
    feelslike_c: 21,
    precip_mm: 0.2,
    chance_of_rain: 35,
    wind_kph: 12,
    gust_kph: 18,
    cloud: 45,
    humidity: 70,
    vis_km: 10,
    uv: 2,
    condition: {
      code: 1003,
    },
  }));

  return {
    forecast: {
      forecastday: [
        {
          date: "2030-06-05",
          astro: {
            sunrise: "06:30 AM",
            sunset: "06:00 PM",
          },
          hour: hours,
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

describe("provider opcional WeatherAPI", () => {
  it("monta URL com chave, coordenadas, dias e data", () => {
    const url = buildWeatherApiForecastUrl({
      lat: -28.6775,
      lon: -49.3697,
      date: "2030-06-05",
      endDate: "2030-06-07",
      apiKey: "secret",
    });

    expect(url.origin).toBe("https://api.weatherapi.com");
    expect(url.pathname).toBe("/v1/forecast.json");
    expect(url.searchParams.get("key")).toBe("secret");
    expect(url.searchParams.get("q")).toBe("-28.6775,-49.3697");
    expect(url.searchParams.get("days")).toBe("3");
    expect(url.searchParams.get("dt")).toBe("2030-06-05");
    expect(url.searchParams.get("aqi")).toBe("no");
    expect(url.searchParams.get("alerts")).toBe("no");
    expect(url.searchParams.get("lang")).toBe("pt");
  });

  it("normaliza forecast para NormalizedForecast", () => {
    const forecast = parseWeatherApiForecastResponse(createWeatherApiFixture());

    expect(forecast.astronomy).toEqual({
      date: "2030-06-05",
      sunrise: "2030-06-05T06:30",
      sunset: "2030-06-05T18:00",
    });
    expect(forecast.hourly[0]).toEqual(
      expect.objectContaining({
        time: "2030-06-05T00:00",
        temperature_2m: 20,
        apparent_temperature: 21,
        precipitation: 0.2,
        precipitation_probability: 35,
        wind_speed_10m: 12,
        wind_gusts_10m: 18,
        cloud_cover: 45,
        weather_code: 1003,
      }),
    );
  });

  it("provider sem chave nao chama API externa", async () => {
    const provider = new WeatherApiWeatherProvider("");

    await expect(
      provider.getForecast({
        lat: -28.6775,
        lon: -49.3697,
        date: "2030-06-05",
      }),
    ).rejects.toThrow("WEATHERAPI_KEY não configurada.");
  });

  it("busca forecast com chave configurada", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(createJsonResponse(createWeatherApiFixture()));
    vi.stubGlobal("fetch", fetchMock);

    const provider = new WeatherApiWeatherProvider("secret");
    const forecast = await provider.getForecast({
      lat: -28.6775,
      lon: -49.3697,
      date: "2030-06-05",
    });

    expect(fetchMock).toHaveBeenCalledWith(expect.any(URL));
    expect(forecast.hourly).toHaveLength(24);
  });

  it("propaga erro amigavel da WeatherAPI", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse(
        {
          error: {
            message: "API key invalid.",
          },
        },
        401,
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getWeatherApiForecast({
        lat: -28.6775,
        lon: -49.3697,
        date: "2030-06-05",
        apiKey: "invalid",
      }),
    ).rejects.toThrow("WeatherAPI retornou erro na previsão: API key invalid.");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildGeocodingUrl,
  getCitySuggestions,
} from "@/lib/services/open-meteo-geocoding.service";
import {
  buildForecastUrl,
  getWeatherForecast,
} from "@/lib/services/open-meteo-weather.service";
import {
  parseForecastResponse,
  parseGeocodingResponse,
} from "@/lib/services/open-meteo.schemas";

function createForecastFixture() {
  const hours = Array.from(
    { length: 24 },
    (_, hour) => `2026-06-05T${String(hour).padStart(2, "0")}:00`,
  );

  return {
    hourly: {
      time: hours,
      temperature_2m: hours.map(() => 20),
      apparent_temperature: hours.map(() => 20),
      precipitation: hours.map(() => 0),
      precipitation_probability: hours.map(() => 0),
      rain: hours.map(() => 0),
      showers: hours.map(() => 0),
      weather_code: hours.map(() => 0),
      wind_speed_10m: hours.map(() => 10),
      wind_gusts_10m: hours.map(() => 14),
      cloud_cover: hours.map(() => 40),
      uv_index: hours.map(() => 2),
      relative_humidity_2m: hours.map(() => 60),
    },
    daily: {
      time: ["2026-06-05"],
      sunrise: ["2026-06-05T06:30"],
      sunset: ["2026-06-05T17:58"],
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

describe("serviço de previsão Open-Meteo", () => {
  it("monta a URL de forecast com variáveis e data escolhida", () => {
    const url = buildForecastUrl({
      lat: -28.6775,
      lon: -49.3697,
      date: "2026-06-05",
    });

    expect(url.origin).toBe("https://api.open-meteo.com");
    expect(url.pathname).toBe("/v1/forecast");
    expect(url.searchParams.get("latitude")).toBe("-28.6775");
    expect(url.searchParams.get("longitude")).toBe("-49.3697");
    expect(url.searchParams.get("timezone")).toBe("auto");
    expect(url.searchParams.get("start_date")).toBe("2026-06-05");
    expect(url.searchParams.get("end_date")).toBe("2026-06-05");
    expect(url.searchParams.get("daily")).toBe("sunrise,sunset");
    expect(url.searchParams.get("hourly")).toContain("apparent_temperature");
    expect(url.searchParams.get("hourly")).toContain(
      "precipitation_probability",
    );
    expect(url.searchParams.get("hourly")).toContain("rain");
    expect(url.searchParams.get("hourly")).toContain("showers");
    expect(url.searchParams.get("hourly")).toContain("weather_code");
    expect(url.searchParams.get("hourly")).toContain("wind_speed_10m");
    expect(url.searchParams.get("hourly")).toContain("wind_gusts_10m");
    expect(url.searchParams.get("hourly")).toContain("cloud_cover");
    expect(url.searchParams.get("hourly")).toContain("relative_humidity_2m");
  });

  it("mapeia resposta válida para clima horário e astronomia diária", () => {
    const forecast = parseForecastResponse(createForecastFixture());

    expect(forecast.hourly).toHaveLength(24);
    expect(forecast.hourly[0]).toMatchObject({
      time: "2026-06-05T00:00",
      temperature_2m: 20,
      apparent_temperature: 20,
      precipitation: 0,
      precipitation_probability: 0,
      rain: 0,
      showers: 0,
      weather_code: 0,
      wind_speed_10m: 10,
      wind_gusts_10m: 14,
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

  it("rejeita resposta de forecast em formato inválido", () => {
    expect(() =>
      parseForecastResponse({
        hourly: {
          time: ["2026-06-05T00:00"],
        },
        daily: {
          time: ["2026-06-05"],
          sunrise: ["2026-06-05T06:30"],
          sunset: ["2026-06-05T17:58"],
        },
      }),
    ).toThrow();
  });

  it("propaga erro amigável quando a API de forecast retorna erro", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        createJsonResponse(
          { error: true, reason: "Parameter hourly is invalid." },
          400,
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getWeatherForecast({
        lat: -28.6775,
        lon: -49.3697,
        date: "2026-06-05",
      }),
    ).rejects.toThrow(
      "Open-Meteo retornou erro na previsão: Parameter hourly is invalid.",
    );
  });

  it("busca forecast e transforma resposta válida", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(createJsonResponse(createForecastFixture()));
    vi.stubGlobal("fetch", fetchMock);

    const forecast = await getWeatherForecast({
      lat: -28.6775,
      lon: -49.3697,
      date: "2026-06-05",
    });

    expect(fetchMock).toHaveBeenCalledWith(expect.any(URL));
    expect(forecast.hourly).toHaveLength(24);
    expect(forecast.astronomy.sunset).toBe("2026-06-05T17:58");
  });

  it("retorna erro amigável quando o forecast vem em formato inválido", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(createJsonResponse({ hourly: { time: [] } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getWeatherForecast({
        lat: -28.6775,
        lon: -49.3697,
        date: "2026-06-05",
      }),
    ).rejects.toThrow("Resposta da previsão veio em formato inesperado.");
  });
});

describe("serviço de geocoding Open-Meteo", () => {
  it("monta a URL de geocoding em português com cinco resultados", () => {
    const url = buildGeocodingUrl("Criciúma");

    expect(url.origin).toBe("https://geocoding-api.open-meteo.com");
    expect(url.pathname).toBe("/v1/search");
    expect(url.searchParams.get("name")).toBe("Criciúma");
    expect(url.searchParams.get("count")).toBe("5");
    expect(url.searchParams.get("language")).toBe("pt");
    expect(url.searchParams.get("format")).toBe("json");
  });

  it("não chama a API quando a busca tem menos de 3 caracteres", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCitySuggestions("Cr")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("mapeia sugestões de cidade para o modelo do domínio", () => {
    const cities = parseGeocodingResponse({
      results: [
        {
          id: 3460428,
          name: "Criciúma",
          latitude: -28.6775,
          longitude: -49.3697,
          country: "Brasil",
          admin1: "Santa Catarina",
          timezone: "America/Sao_Paulo",
        },
      ],
    });

    expect(cities).toEqual([
      {
        id: 3460428,
        name: "Criciúma",
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

  it("retorna lista vazia quando a API não traz resultados", () => {
    expect(parseGeocodingResponse({})).toEqual([]);
  });

  it("busca cidades e transforma resposta válida", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        results: [
          {
            id: 3460428,
            name: "Criciúma",
            latitude: -28.6775,
            longitude: -49.3697,
            country: "Brasil",
            admin1: "Santa Catarina",
            timezone: "America/Sao_Paulo",
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const cities = await getCitySuggestions("Criciúma");

    expect(fetchMock).toHaveBeenCalledWith(expect.any(URL));
    expect(cities).toHaveLength(1);
    expect(cities[0]?.coordinates).toEqual({
      lat: -28.6775,
      lon: -49.3697,
    });
  });

  it("propaga erro amigável quando a API de geocoding retorna erro", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        createJsonResponse(
          { error: true, reason: "Parameter count must be between 1 and 100." },
          400,
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCitySuggestions("Criciúma")).rejects.toThrow(
      "Open-Meteo retornou erro no geocoding: Parameter count must be between 1 and 100.",
    );
  });

  it("retorna erro amigável quando o geocoding vem em formato inválido", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(createJsonResponse({ results: [{ name: "Cidade" }] }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCitySuggestions("Cidade")).rejects.toThrow(
      "Resposta de cidades veio em formato inesperado.",
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { City, DailyAstronomy, HourlyWeather } from "@/types";

const getCitySuggestionsMock = vi.fn();
const getWeatherForecastMock = vi.fn();

vi.mock("@/lib/services/open-meteo-geocoding.service", () => ({
  getCitySuggestions: getCitySuggestionsMock,
}));

vi.mock("@/lib/services/open-meteo-weather.service", () => ({
  getWeatherForecast: getWeatherForecastMock,
}));

const city: City = {
  id: 3460428,
  name: "Criciuma",
  country: "Brasil",
  admin1: "Santa Catarina",
  timezone: "America/Sao_Paulo",
  coordinates: {
    lat: -28.6775,
    lon: -49.3697,
  },
};

const astronomy: DailyAstronomy = {
  date: "2030-06-05",
  sunrise: "2030-06-05T06:30",
  sunset: "2030-06-05T18:00",
};

function makeWeather(
  time: string,
  overrides: Partial<HourlyWeather> = {},
): HourlyWeather {
  return {
    time,
    temperature_2m: 19,
    apparent_temperature: 19,
    precipitation: 0,
    precipitation_probability: 0,
    rain: 0,
    showers: 0,
    weather_code: 0,
    wind_speed_10m: 8,
    wind_gusts_10m: 12,
    cloud_cover: 30,
    cloud_cover_low: 10,
    cloud_cover_mid: 35,
    cloud_cover_high: 35,
    visibility: 15000,
    sunshine_duration: 2400,
    uv_index: 2,
    relative_humidity_2m: 60,
    ...overrides,
  };
}

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/recommendation", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("rotas internas da API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCitySuggestionsMock.mockResolvedValue([city]);
    getWeatherForecastMock.mockResolvedValue({
      hourly: [
        makeWeather("2030-06-05T07:00"),
        makeWeather("2030-06-05T08:00"),
      ],
      astronomy,
      dailyAstronomy: [astronomy],
    });
  });

  it("GET /api/geocoding valida query com mínimo de 3 caracteres", async () => {
    const { GET } = await import("@/app/api/geocoding/route");
    const response = await GET(new Request("http://localhost/api/geocoding?q=cr"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.message).toContain("3 caracteres");
    expect(getCitySuggestionsMock).not.toHaveBeenCalled();
  });

  it("GET /api/geocoding retorna cidades", async () => {
    const { GET } = await import("@/app/api/geocoding/route");
    const response = await GET(
      new Request("http://localhost/api/geocoding?q=Criciuma"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ cities: [city] });
    expect(getCitySuggestionsMock).toHaveBeenCalledWith("Criciuma");
  });

  it("GET /api/geocoding retorna 502 em erro externo", async () => {
    getCitySuggestionsMock.mockRejectedValueOnce(new Error("falha externa"));

    const { GET } = await import("@/app/api/geocoding/route");
    const response = await GET(
      new Request("http://localhost/api/geocoding?q=Criciuma"),
    );
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload.error).toEqual({
      message: "Não foi possível buscar cidades agora.",
    });
    expect(payload.stack).toBeUndefined();
  });

  it("POST /api/recommendation valida body com Zod", async () => {
    const { POST } = await import("@/app/api/recommendation/route");
    const response = await POST(makePostRequest({ activityId: "", date: "x" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.message).toBe("Dados inválidos para gerar recomendação.");
    expect(payload.stack).toBeUndefined();
  });

  it("POST /api/recommendation retorna 404 para atividade inexistente", async () => {
    const { POST } = await import("@/app/api/recommendation/route");
    const response = await POST(
      makePostRequest({
        city,
        activityId: "surfar",
        date: astronomy.date,
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error.message).toBe("Atividade não encontrada.");
  });

  it("POST /api/recommendation retorna 404 quando cidade não existe", async () => {
    getCitySuggestionsMock.mockResolvedValueOnce([]);

    const { POST } = await import("@/app/api/recommendation/route");
    const response = await POST(
      makePostRequest({
        cityQuery: "Cidade inexistente",
        activityId: "correr",
        date: astronomy.date,
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error.message).toBe("Cidade não encontrada.");
  });

  it("POST /api/recommendation retorna 502 em falha de forecast", async () => {
    getWeatherForecastMock.mockRejectedValueOnce(new Error("falha externa"));

    const { POST } = await import("@/app/api/recommendation/route");
    const response = await POST(
      makePostRequest({
        city,
        activityId: "correr",
        date: astronomy.date,
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload.error.message).toBe("Não foi possível buscar a previsão agora.");
  });

  it("POST /api/recommendation orquestra cidade, forecast, atividade, score e janelas", async () => {
    const { POST } = await import("@/app/api/recommendation/route");
    const response = await POST(
      makePostRequest({
        cityQuery: "Criciuma",
        activityId: "correr",
        date: astronomy.date,
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getCitySuggestionsMock).toHaveBeenCalledWith("Criciuma");
    expect(getWeatherForecastMock).toHaveBeenCalledWith({
      lat: city.coordinates.lat,
      lon: city.coordinates.lon,
      date: astronomy.date,
      endDate: undefined,
    });
    expect(payload.recommendation.activity.id).toBe("correr");
    expect(payload.recommendation.city).toEqual(city);
    expect(payload.recommendation.date).toBe(astronomy.date);
    expect(payload.recommendation.scores).toHaveLength(2);
    expect(payload.recommendation.bestWindow.startTime).toBe(
      "2030-06-05T07:00",
    );
    expect(payload.recommendation.bestWindow.confidence).toEqual(
      expect.objectContaining({
        level: "alta",
        score: expect.any(Number),
      }),
    );
    expect(payload.recommendation.disclaimer).toContain("Open-Meteo");
    expect(payload.stack).toBeUndefined();
  });

  it("POST /api/recommendation retorna ranking de atividades no modo inverso", async () => {
    const { POST } = await import("@/app/api/recommendation/route");
    const response = await POST(
      makePostRequest({
        city,
        mode: "atividades",
        date: astronomy.date,
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getWeatherForecastMock).toHaveBeenCalledTimes(1);
    expect(payload.activityRanking.items).toHaveLength(6);
    expect(payload.activityRanking.bestActivity).toEqual(
      expect.objectContaining({
        position: 1,
        recommendation: expect.objectContaining({
          activity: expect.objectContaining({
            id: expect.any(String),
          }),
        }),
      }),
    );
  });

  it("POST /api/recommendation compara dias usando uma chamada de forecast", async () => {
    const secondAstronomy: DailyAstronomy = {
      date: "2030-06-06",
      sunrise: "2030-06-06T06:30",
      sunset: "2030-06-06T18:00",
    };
    getWeatherForecastMock.mockResolvedValueOnce({
      hourly: [
        makeWeather("2030-06-05T07:00", { precipitation: 1 }),
        makeWeather("2030-06-06T07:00"),
      ],
      astronomy,
      dailyAstronomy: [astronomy, secondAstronomy],
    });

    const { POST } = await import("@/app/api/recommendation/route");
    const response = await POST(
      makePostRequest({
        city,
        mode: "semana",
        activityId: "correr",
        date: astronomy.date,
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getWeatherForecastMock).toHaveBeenCalledWith({
      lat: city.coordinates.lat,
      lon: city.coordinates.lon,
      date: astronomy.date,
      endDate: "2030-06-11",
    });
    expect(payload.weekComparison.activity.id).toBe("correr");
    expect(payload.weekComparison.days).toHaveLength(2);
    expect(payload.weekComparison.bestDay.position).toBe(1);
  });
});


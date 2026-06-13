import { z } from "zod";
import type { ForecastParams, NormalizedForecast } from "@/lib/weather/weather-provider";

const WEATHERAPI_FORECAST_ENDPOINT = "https://api.weatherapi.com/v1/forecast.json";
const MIN_DATE_LENGTH = 10;

const weatherApiForecastParamsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  apiKey: z.string().trim().min(1),
});

const weatherApiConditionSchema = z.object({
  code: z.number().optional().default(0),
});

const weatherApiHourSchema = z.object({
  time: z.string(),
  temp_c: z.number(),
  feelslike_c: z.number(),
  precip_mm: z.number(),
  chance_of_rain: z.number().optional().default(0),
  wind_kph: z.number(),
  gust_kph: z.number(),
  cloud: z.number(),
  humidity: z.number(),
  vis_km: z.number().optional().default(10),
  uv: z.number().optional().default(0),
  condition: weatherApiConditionSchema.optional().default({ code: 0 }),
});

const weatherApiForecastDaySchema = z.object({
  date: z.string(),
  astro: z.object({
    sunrise: z.string(),
    sunset: z.string(),
  }),
  hour: z.array(weatherApiHourSchema),
});

const weatherApiForecastResponseSchema = z.object({
  forecast: z.object({
    forecastday: z.array(weatherApiForecastDaySchema).min(1),
  }),
});

const weatherApiErrorSchema = z.object({
  error: z.object({
    message: z.string(),
  }),
});

export type WeatherApiForecastParams = ForecastParams & {
  apiKey: string;
};

function getInclusiveDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.max(1, Math.round((end.getTime() - start.getTime()) / millisecondsPerDay) + 1);
}

function formatWeatherApiTime(date: string, value: string): string {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return `${date}T00:00`;
  }

  const [, rawHour, minute, period] = match;
  const parsedHour = Number(rawHour);
  const hour =
    period.toUpperCase() === "PM"
      ? parsedHour === 12
        ? 12
        : parsedHour + 12
      : parsedHour === 12
        ? 0
        : parsedHour;

  return `${date}T${String(hour).padStart(2, "0")}:${minute}`;
}

export function buildWeatherApiForecastUrl(params: WeatherApiForecastParams): URL {
  const parsedParams = weatherApiForecastParamsSchema.parse(params);
  const url = new URL(WEATHERAPI_FORECAST_ENDPOINT);
  const endDate = parsedParams.endDate ?? parsedParams.date;

  url.searchParams.set("key", parsedParams.apiKey);
  url.searchParams.set("q", `${parsedParams.lat},${parsedParams.lon}`);
  url.searchParams.set("days", String(getInclusiveDays(parsedParams.date, endDate)));
  url.searchParams.set("dt", parsedParams.date);
  url.searchParams.set("aqi", "no");
  url.searchParams.set("alerts", "no");
  url.searchParams.set("lang", "pt");

  return url;
}

export function parseWeatherApiForecastResponse(
  payload: unknown,
): NormalizedForecast {
  const parsed = weatherApiForecastResponseSchema.parse(payload);
  const dailyAstronomy = parsed.forecast.forecastday.map((day) => ({
    date: day.date,
    sunrise: formatWeatherApiTime(day.date, day.astro.sunrise),
    sunset: formatWeatherApiTime(day.date, day.astro.sunset),
  }));
  const hourly = parsed.forecast.forecastday.flatMap((day) =>
    day.hour.map((hour) => ({
      time: hour.time.replace(" ", "T").slice(0, MIN_DATE_LENGTH + 6),
      temperature_2m: hour.temp_c,
      apparent_temperature: hour.feelslike_c,
      precipitation: hour.precip_mm,
      precipitation_probability: hour.chance_of_rain,
      rain: hour.precip_mm,
      showers: 0,
      weather_code: hour.condition.code,
      wind_speed_10m: hour.wind_kph,
      wind_gusts_10m: hour.gust_kph,
      cloud_cover: hour.cloud,
      cloud_cover_low: hour.cloud,
      cloud_cover_mid: hour.cloud,
      cloud_cover_high: hour.cloud,
      visibility: hour.vis_km * 1000,
      sunshine_duration: 0,
      uv_index: hour.uv,
      relative_humidity_2m: hour.humidity,
    })),
  );
  const [astronomy] = dailyAstronomy;

  if (!astronomy) {
    throw new Error("Resposta da WeatherAPI veio sem astronomia diária.");
  }

  return {
    hourly,
    astronomy,
    dailyAstronomy,
  };
}

async function readWeatherApiJson(response: Response): Promise<unknown> {
  const payload = await response.json().catch(() => undefined);

  if (!response.ok) {
    const apiError = weatherApiErrorSchema.safeParse(payload);
    const reason = apiError.success
      ? apiError.data.error.message
      : `HTTP ${response.status}`;

    throw new Error(`WeatherAPI retornou erro na previsão: ${reason}`);
  }

  return payload;
}

export async function getWeatherApiForecast(
  params: WeatherApiForecastParams,
): Promise<NormalizedForecast> {
  const url = buildWeatherApiForecastUrl(params);

  try {
    const response = await fetch(url);
    const payload = await readWeatherApiJson(response);

    return parseWeatherApiForecastResponse(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error("Resposta da WeatherAPI veio em formato inesperado.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Não foi possível buscar a previsão na WeatherAPI.");
  }
}

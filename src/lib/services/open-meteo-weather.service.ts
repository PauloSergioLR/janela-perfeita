import { z } from "zod";
import { openMeteoErrorSchema, parseForecastResponse } from "./open-meteo.schemas";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";

const forecastParamsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type WeatherForecastParams = z.infer<typeof forecastParamsSchema>;

export function buildForecastUrl(params: WeatherForecastParams): URL {
  const parsedParams = forecastParamsSchema.parse(params);
  const url = new URL(FORECAST_ENDPOINT);

  url.searchParams.set("latitude", String(parsedParams.lat));
  url.searchParams.set("longitude", String(parsedParams.lon));
  url.searchParams.set(
    "hourly",
    [
      "temperature_2m",
      "apparent_temperature",
      "precipitation",
      "precipitation_probability",
      "rain",
      "showers",
      "weather_code",
      "wind_speed_10m",
      "wind_gusts_10m",
      "cloud_cover",
      "uv_index",
      "relative_humidity_2m",
    ].join(","),
  );
  url.searchParams.set("daily", "sunrise,sunset");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("start_date", parsedParams.date);
  url.searchParams.set("end_date", parsedParams.date);

  return url;
}

async function readOpenMeteoJson(response: Response): Promise<unknown> {
  const payload = await response.json().catch(() => undefined);

  if (!response.ok) {
    const apiError = openMeteoErrorSchema.safeParse(payload);
    const reason = apiError.success
      ? apiError.data.reason
      : `HTTP ${response.status}`;

    throw new Error(`Open-Meteo retornou erro na previsão: ${reason}`);
  }

  return payload;
}

export async function getWeatherForecast(params: WeatherForecastParams) {
  const url = buildForecastUrl(params);

  try {
    const response = await fetch(url);
    const payload = await readOpenMeteoJson(response);

    return parseForecastResponse(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error("Resposta da previsão veio em formato inesperado.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Não foi possível buscar a previsão na Open-Meteo.");
  }
}

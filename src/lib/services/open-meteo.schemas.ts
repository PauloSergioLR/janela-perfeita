import { z } from "zod";
import type { City, DailyAstronomy, HourlyWeather } from "@/types";

const hourlyWeatherSchema = z.object({
  time: z.array(z.string()),
  temperature_2m: z.array(z.number()),
  apparent_temperature: z.array(z.number()),
  precipitation: z.array(z.number()),
  precipitation_probability: z.array(z.number()),
  rain: z.array(z.number()),
  showers: z.array(z.number()),
  weather_code: z.array(z.number()),
  wind_speed_10m: z.array(z.number()),
  wind_gusts_10m: z.array(z.number()),
  cloud_cover: z.array(z.number()),
  uv_index: z.array(z.number()),
  relative_humidity_2m: z.array(z.number()),
});

const dailyAstronomySchema = z.object({
  time: z.array(z.string()).min(1),
  sunrise: z.array(z.string()).min(1),
  sunset: z.array(z.string()).min(1),
});

export const openMeteoErrorSchema = z.object({
  error: z.literal(true),
  reason: z.string(),
});

export const openMeteoForecastResponseSchema = z.object({
  hourly: hourlyWeatherSchema,
  daily: dailyAstronomySchema,
});

export const openMeteoGeocodingResponseSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number().int().optional(),
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        country: z.string(),
        admin1: z.string().optional(),
        timezone: z.string().optional(),
      }),
    )
    .optional(),
});

export function parseForecastResponse(payload: unknown): {
  hourly: HourlyWeather[];
  astronomy: DailyAstronomy;
} {
  const response = openMeteoForecastResponseSchema.parse(payload);
  const times = response.hourly.time;

  const hourly = times.map((time, index) => ({
    time,
    temperature_2m: response.hourly.temperature_2m[index] ?? 0,
    apparent_temperature: response.hourly.apparent_temperature[index] ?? 0,
    precipitation: response.hourly.precipitation[index] ?? 0,
    precipitation_probability:
      response.hourly.precipitation_probability[index] ?? 0,
    rain: response.hourly.rain[index] ?? 0,
    showers: response.hourly.showers[index] ?? 0,
    weather_code: response.hourly.weather_code[index] ?? 0,
    wind_speed_10m: response.hourly.wind_speed_10m[index] ?? 0,
    wind_gusts_10m: response.hourly.wind_gusts_10m[index] ?? 0,
    cloud_cover: response.hourly.cloud_cover[index] ?? 0,
    uv_index: response.hourly.uv_index[index] ?? 0,
    relative_humidity_2m: response.hourly.relative_humidity_2m[index] ?? 0,
  }));

  return {
    hourly,
    astronomy: {
      date: response.daily.time[0],
      sunrise: response.daily.sunrise[0],
      sunset: response.daily.sunset[0],
    },
  };
}

export function parseGeocodingResponse(payload: unknown): City[] {
  const response = openMeteoGeocodingResponseSchema.parse(payload);

  return (response.results ?? []).map((result) => ({
    id: result.id,
    name: result.name,
    country: result.country,
    admin1: result.admin1,
    timezone: result.timezone,
    coordinates: {
      lat: result.latitude,
      lon: result.longitude,
    },
  }));
}

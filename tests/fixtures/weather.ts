import type { City, DailyAstronomy, HourlyWeather } from "@/types";

export const criciumaCity: City = {
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

export const baseAstronomy: DailyAstronomy = {
  date: "2026-06-05",
  sunrise: "2026-06-05T06:30",
  sunset: "2026-06-05T18:00",
};

export function makeHourlyWeather(
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
    uv_index: 2,
    relative_humidity_2m: 60,
    ...overrides,
  };
}

export function makeDailyHourlyWeather(date = baseAstronomy.date): HourlyWeather[] {
  return Array.from({ length: 24 }, (_, hour) =>
    makeHourlyWeather(`${date}T${String(hour).padStart(2, "0")}:00`),
  );
}

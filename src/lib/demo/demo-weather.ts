import type { City, DailyAstronomy, HourlyWeather } from "@/types";
import type { ForecastParams, NormalizedForecast } from "@/lib/weather/weather-provider";

export const DEMO_DISCLAIMER =
  "Modo demo com dados locais representativos; não usa API externa e não substitui previsão real.";

export const demoCity: City = {
  id: 900001,
  name: "Criciúma",
  country: "Brasil",
  admin1: "Santa Catarina",
  timezone: "America/Sao_Paulo",
  coordinates: {
    lat: -28.6775,
    lon: -49.3697,
  },
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function addDays(date: string, days: number): string {
  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  parsedDate.setUTCDate(parsedDate.getUTCDate() + days);

  return [
    parsedDate.getUTCFullYear(),
    pad2(parsedDate.getUTCMonth() + 1),
    pad2(parsedDate.getUTCDate()),
  ].join("-");
}

function getDaysBetween(startDate: string, endDate: string): string[] {
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T00:00:00.000Z`).getTime();
  const days = Math.max(1, Math.round((end - start) / 86_400_000) + 1);

  return Array.from({ length: days }, (_, index) => addDays(startDate, index));
}

function makeAstronomy(date: string): DailyAstronomy {
  return {
    date,
    sunrise: `${date}T06:28`,
    sunset: `${date}T17:54`,
  };
}

function getBaseTemperature(hour: number): number {
  if (hour < 6) {
    return 15;
  }

  if (hour < 11) {
    return 20;
  }

  if (hour < 16) {
    return 26;
  }

  return 21;
}

function makeHourlyWeather(date: string, hour: number, dayIndex: number): HourlyWeather {
  const goldenHour = hour >= 16 && hour <= 18;
  const night = hour <= 5 || hour >= 19;
  const showerWindow = dayIndex % 5 === 3 && hour >= 14 && hour <= 15;
  const temperature = getBaseTemperature(hour) + (dayIndex % 3);
  const cloudCover = goldenHour ? 35 : night ? 12 : 28 + (dayIndex % 4) * 8;

  return {
    time: `${date}T${pad2(hour)}:00`,
    temperature_2m: temperature,
    apparent_temperature: temperature + (hour >= 12 && hour <= 15 ? 2 : 0),
    precipitation: showerWindow ? 1.8 : 0,
    precipitation_probability: showerWindow ? 70 : 8 + dayIndex * 2,
    rain: showerWindow ? 1.8 : 0,
    showers: 0,
    weather_code: showerWindow ? 61 : 1,
    wind_speed_10m: goldenHour ? 7 : 10 + (dayIndex % 3) * 2,
    wind_gusts_10m: goldenHour ? 12 : 18 + (dayIndex % 3) * 4,
    cloud_cover: cloudCover,
    cloud_cover_low: Math.max(0, cloudCover - 12),
    cloud_cover_mid: cloudCover,
    cloud_cover_high: Math.min(100, cloudCover + 10),
    visibility: 18000,
    sunshine_duration: showerWindow ? 600 : 2700,
    uv_index: hour >= 10 && hour <= 15 ? 6 : 2,
    relative_humidity_2m: showerWindow ? 84 : night ? 72 : 58,
  };
}

function buildDayHourly(date: string, dayIndex: number): HourlyWeather[] {
  return Array.from({ length: 24 }, (_, hour) =>
    makeHourlyWeather(date, hour, dayIndex),
  );
}

export function getDemoCitySuggestions(query: string): City[] {
  if (query.trim().length < 3) {
    return [];
  }

  return [demoCity];
}

export function getDemoForecast(params: ForecastParams): NormalizedForecast {
  const dates = getDaysBetween(params.date, params.endDate ?? params.date);
  const dailyAstronomy = dates.map(makeAstronomy);

  return {
    hourly: dates.flatMap((date, dayIndex) => buildDayHourly(date, dayIndex)),
    astronomy: dailyAstronomy[0] ?? makeAstronomy(params.date),
    dailyAstronomy,
  };
}

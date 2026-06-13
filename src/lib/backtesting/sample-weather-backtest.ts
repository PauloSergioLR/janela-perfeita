import type { City, DailyAstronomy, HourlyWeather } from "@/types";
import type { BacktestDayInput } from "./weather-backtesting";

const SAMPLE_START_DATE = "2026-05-01";
const SAMPLE_DAYS = 30;

export const sampleBacktestCity: City = {
  id: 3460428,
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

function makeAstronomy(date: string): DailyAstronomy {
  return {
    date,
    sunrise: `${date}T06:35`,
    sunset: `${date}T17:48`,
  };
}

function getBaseTemperature(hour: number): number {
  if (hour < 6) {
    return 16;
  }

  if (hour < 11) {
    return 19;
  }

  if (hour < 16) {
    return 25;
  }

  return 21;
}

function makeHourlyWeather(
  date: string,
  hour: number,
  overrides: Partial<HourlyWeather> = {},
): HourlyWeather {
  const temperature = getBaseTemperature(hour);

  return {
    time: `${date}T${pad2(hour)}:00`,
    temperature_2m: temperature,
    apparent_temperature: temperature,
    precipitation: 0,
    precipitation_probability: 10,
    rain: 0,
    showers: 0,
    weather_code: 0,
    wind_speed_10m: 9,
    wind_gusts_10m: 14,
    cloud_cover: 35,
    cloud_cover_low: 15,
    cloud_cover_mid: 25,
    cloud_cover_high: 30,
    visibility: 15000,
    sunshine_duration: 2400,
    uv_index: hour >= 10 && hour <= 15 ? 6 : 2,
    relative_humidity_2m: 66,
    ...overrides,
  };
}

function buildForecastHourly(date: string, dayIndex: number): HourlyWeather[] {
  return Array.from({ length: 24 }, (_, hour) =>
    makeHourlyWeather(date, hour, {
      cloud_cover: dayIndex % 6 === 0 ? 50 : 30,
      wind_speed_10m: dayIndex % 8 === 0 ? 14 : 9,
      wind_gusts_10m: dayIndex % 8 === 0 ? 24 : 14,
      precipitation_probability: dayIndex % 9 === 0 ? 35 : 10,
    }),
  );
}

function buildObservedHourly(date: string, dayIndex: number): HourlyWeather[] {
  const rainDay = dayIndex % 5 === 0;
  const hotterDay = dayIndex % 7 === 0;
  const windyDay = dayIndex % 6 === 0;
  const cloudyDay = dayIndex % 4 === 0;

  return Array.from({ length: 24 }, (_, hour) => {
    const rainWindow = rainDay && hour >= 7 && hour <= 9;
    const temperatureDelta = hotterDay && hour >= 7 && hour <= 11 ? 5 : 1;
    const windDelta = windyDay && hour >= 8 && hour <= 12 ? 15 : 3;
    const cloudDelta = cloudyDay ? 35 : 8;

    return makeHourlyWeather(date, hour, {
      temperature_2m: getBaseTemperature(hour) + temperatureDelta,
      apparent_temperature: getBaseTemperature(hour) + temperatureDelta + 1,
      precipitation: rainWindow ? 3.5 : 0,
      precipitation_probability: rainWindow ? 90 : 20,
      rain: rainWindow ? 3.5 : 0,
      weather_code: rainWindow ? 61 : 1,
      wind_speed_10m: 9 + windDelta,
      wind_gusts_10m: 14 + windDelta,
      cloud_cover: Math.min(100, 30 + cloudDelta),
      cloud_cover_low: Math.min(100, 15 + cloudDelta),
      cloud_cover_mid: Math.min(100, 25 + cloudDelta),
      cloud_cover_high: Math.min(100, 30 + cloudDelta),
      relative_humidity_2m: rainWindow ? 88 : 70,
    });
  });
}

export function buildSampleBacktestDays(): BacktestDayInput[] {
  return Array.from({ length: SAMPLE_DAYS }, (_, dayIndex) => {
    const date = addDays(SAMPLE_START_DATE, dayIndex);

    return {
      date,
      astronomy: makeAstronomy(date),
      forecastHourly: buildForecastHourly(date, dayIndex),
      observedHourly: buildObservedHourly(date, dayIndex),
    };
  });
}

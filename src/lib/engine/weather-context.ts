import type { DailyAstronomy, HourlyWeather, WeatherContext } from "@/types";

export interface BuildWeatherContextInput {
  weather: HourlyWeather;
  astronomy: DailyAstronomy;
  now: string;
}

const GOLDEN_HOUR_START_MINUTES = -60;
const GOLDEN_HOUR_END_MINUTES = 15;
const MINUTES_IN_HOUR = 60;
const LOCAL_DATE_TIME_PATTERN =
  /^(\d{4}-\d{2}-\d{2})T(\d{2})(?::(\d{2}))?(?::(\d{2}))?/;

interface LocalDateTimeParts {
  date: string;
  hour: number;
  minute: number;
  second: number;
  timestamp: number;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function parseLocalDateTime(value: string): LocalDateTimeParts {
  const match = LOCAL_DATE_TIME_PATTERN.exec(value);

  if (!match) {
    throw new Error(`Data local inválida: ${value}`);
  }

  const [year, month, day] = match[1].split("-").map(Number);
  const hour = Number(match[2]);
  const minute = Number(match[3] ?? 0);
  const second = Number(match[4] ?? 0);

  return {
    date: match[1],
    hour,
    minute,
    second,
    timestamp: Date.UTC(year, month - 1, day, hour, minute, second),
  };
}

export function getLocalDatePart(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);

  if (!match) {
    throw new Error(`Data local inválida: ${value}`);
  }

  return match[1];
}

export function formatHourLabel(value: string): string {
  const parts = parseLocalDateTime(value);

  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function minutesBetweenLocalIso(later: string, earlier: string): number {
  const laterTime = parseLocalDateTime(later).timestamp;
  const earlierTime = parseLocalDateTime(earlier).timestamp;

  return Math.round((laterTime - earlierTime) / 60_000);
}

export function addHoursToLocalIso(value: string, hours: number): string {
  const timestamp =
    parseLocalDateTime(value).timestamp + hours * MINUTES_IN_HOUR * 60_000;
  const date = new Date(timestamp);

  return [
    `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
      date.getUTCDate(),
    )}`,
    `${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}`,
  ].join("T");
}

export function buildWeatherContext({
  weather,
  astronomy,
  now,
}: BuildWeatherContextInput): WeatherContext {
  const weatherTime = parseLocalDateTime(weather.time);
  const sunriseTime = parseLocalDateTime(astronomy.sunrise);
  const sunsetTime = parseLocalDateTime(astronomy.sunset);
  const nowTime = parseLocalDateTime(now);
  const minutesFromSunset = Math.round(
    (weatherTime.timestamp - sunsetTime.timestamp) / 60_000,
  );
  const isToday = weatherTime.date === nowTime.date;

  return {
    localHour: weatherTime.hour,
    isToday,
    isPastHour: isToday && weatherTime.timestamp < nowTime.timestamp,
    isNight:
      weatherTime.timestamp < sunriseTime.timestamp ||
      weatherTime.timestamp >= sunsetTime.timestamp,
    isGoldenHour:
      minutesFromSunset >= GOLDEN_HOUR_START_MINUTES &&
      minutesFromSunset <= GOLDEN_HOUR_END_MINUTES,
    minutesFromSunset,
    sunrise: astronomy.sunrise,
    sunset: astronomy.sunset,
  };
}


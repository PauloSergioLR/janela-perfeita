import type { City, DailyAstronomy, DailyWeatherOverview, HourlyWeather } from "@/types";
import { getLocalDatePart } from "./weather-context";

export const DAILY_OVERVIEW_DISCLAIMER =
  "Resumo estimado com base na previsão meteorológica da Open-Meteo; não substitui avaliação local das condições.";

interface BuildDailyWeatherOverviewInput {
  city: City;
  hourly: HourlyWeather[];
  astronomy: DailyAstronomy;
  generatedAt: string;
}

const THUNDERSTORM_CODES = new Set([95, 96, 99]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const RAIN_CODES = new Set([61, 63, 65, 66, 67, 80, 81, 82]);
const DRIZZLE_CODES = new Set([51, 53, 55, 56, 57]);
const FOG_CODES = new Set([45, 48]);
const CLOUD_CODES = new Set([1, 2, 3]);

function maxValue(values: number[]): number | null {
  return values.length ? Math.max(...values) : null;
}

function minValue(values: number[]): number | null {
  return values.length ? Math.min(...values) : null;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function getWeatherCodePriority(code: number): number {
  if (THUNDERSTORM_CODES.has(code)) {
    return 6;
  }

  if (SNOW_CODES.has(code)) {
    return 5;
  }

  if (RAIN_CODES.has(code)) {
    return 4;
  }

  if (DRIZZLE_CODES.has(code)) {
    return 3;
  }

  if (FOG_CODES.has(code)) {
    return 2;
  }

  if (CLOUD_CODES.has(code)) {
    return 1;
  }

  return 0;
}

export function getWeatherCodeLabel(code: number | null): string {
  if (code === null) {
    return "Sem dados";
  }

  if (THUNDERSTORM_CODES.has(code)) {
    return "Tempestade";
  }

  if (SNOW_CODES.has(code)) {
    return "Precipitação congelada";
  }

  if (RAIN_CODES.has(code)) {
    return "Chuva";
  }

  if (DRIZZLE_CODES.has(code)) {
    return "Garoa";
  }

  if (FOG_CODES.has(code)) {
    return "Nevoeiro";
  }

  if (code === 0) {
    return "Céu limpo";
  }

  if (CLOUD_CODES.has(code)) {
    return "Nuvens";
  }

  return "Condição variável";
}

function getRepresentativeWeatherCode(hourly: HourlyWeather[]): number | null {
  const codes = hourly.map((weather) => weather.weather_code);

  if (!codes.length) {
    return null;
  }

  return [...codes].sort(
    (a, b) => getWeatherCodePriority(b) - getWeatherCodePriority(a) || b - a,
  )[0];
}

export function buildDailyWeatherOverview({
  city,
  hourly,
  astronomy,
  generatedAt,
}: BuildDailyWeatherOverviewInput): DailyWeatherOverview {
  const dailyHourly = hourly.filter(
    (weather) => getLocalDatePart(weather.time) === astronomy.date,
  );
  const weatherCode = getRepresentativeWeatherCode(dailyHourly);
  const precipitationSum = dailyHourly.reduce(
    (sum, weather) =>
      sum + Math.max(weather.precipitation, weather.rain, weather.showers),
    0,
  );

  return {
    city,
    date: astronomy.date,
    generatedAt,
    sunrise: astronomy.sunrise,
    sunset: astronomy.sunset,
    weatherCode,
    weatherLabel: getWeatherCodeLabel(weatherCode),
    temperatureMax: maxValue(dailyHourly.map((weather) => weather.temperature_2m)),
    temperatureMin: minValue(dailyHourly.map((weather) => weather.temperature_2m)),
    apparentTemperatureMax: maxValue(
      dailyHourly.map((weather) => weather.apparent_temperature),
    ),
    apparentTemperatureMin: minValue(
      dailyHourly.map((weather) => weather.apparent_temperature),
    ),
    precipitationSum: dailyHourly.length ? round1(precipitationSum) : null,
    precipitationProbabilityMax: maxValue(
      dailyHourly.map((weather) => weather.precipitation_probability),
    ),
    windSpeedMax: maxValue(dailyHourly.map((weather) => weather.wind_speed_10m)),
    windGustsMax: maxValue(dailyHourly.map((weather) => weather.wind_gusts_10m)),
    uvIndexMax: maxValue(dailyHourly.map((weather) => weather.uv_index)),
    hourly: dailyHourly,
    disclaimer: DAILY_OVERVIEW_DISCLAIMER,
  };
}

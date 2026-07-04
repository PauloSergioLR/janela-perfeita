import type { HourlyWeather } from "@/types";

export type WeatherStatId =
  | "temperature"
  | "apparent-temperature"
  | "precipitation"
  | "wind"
  | "gusts"
  | "humidity"
  | "uv"
  | "cloud-cover"
  | "sunrise"
  | "sunset";

export interface WeatherStat {
  id: WeatherStatId;
  label: string;
  value: string;
  detail?: string;
}

export interface WeatherStatsInput {
  weather: HourlyWeather | null;
  sunrise?: string | null;
  sunset?: string | null;
}

const UNAVAILABLE_VALUE = "Indisponível";

function formatNumber(value: number, suffix: string, digits = 0): string {
  if (!Number.isFinite(value)) {
    return UNAVAILABLE_VALUE;
  }

  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
  }).format(value)}${suffix}`;
}

function formatLocalTime(value?: string | null): string {
  const match = value?.match(/T(\d{2}:\d{2})/);

  return match?.[1] ?? UNAVAILABLE_VALUE;
}

function unavailableStat(id: WeatherStatId, label: string): WeatherStat {
  return { id, label, value: UNAVAILABLE_VALUE };
}

function findStat(
  stats: WeatherStat[],
  id: WeatherStatId,
  label: string,
): WeatherStat {
  return stats.find((stat) => stat.id === id) ?? unavailableStat(id, label);
}

function withAvailableDetail(stat: WeatherStat, detail?: string): WeatherStat {
  if (stat.value === UNAVAILABLE_VALUE || !detail) {
    return stat;
  }

  return { ...stat, detail };
}

function buildSolarWindow(sunrise?: string | null, sunset?: string | null): WeatherStat {
  const sunriseTime = formatLocalTime(sunrise);
  const sunsetTime = formatLocalTime(sunset);

  if (sunriseTime === UNAVAILABLE_VALUE && sunsetTime === UNAVAILABLE_VALUE) {
    return unavailableStat("sunrise", "Sol");
  }

  if (sunriseTime === UNAVAILABLE_VALUE) {
    return {
      id: "sunrise",
      label: "Sol",
      value: sunsetTime,
      detail: "Pôr do sol",
    };
  }

  if (sunsetTime === UNAVAILABLE_VALUE) {
    return {
      id: "sunrise",
      label: "Sol",
      value: sunriseTime,
      detail: "Nascer do sol",
    };
  }

  return {
    id: "sunrise",
    label: "Sol",
    value: `${sunriseTime} - ${sunsetTime}`,
    detail: "Nascer / pôr",
  };
}

function buildWeatherStats(weather: HourlyWeather): WeatherStat[] {
  const precipitation = Math.max(
    weather.precipitation,
    weather.rain,
    weather.showers,
  );
  const precipitationDetail = formatNumber(precipitation, " mm", 1);

  return [
    {
      id: "temperature",
      label: "Temperatura",
      value: formatNumber(weather.temperature_2m, "°C"),
    },
    {
      id: "apparent-temperature",
      label: "Sensação",
      value: formatNumber(weather.apparent_temperature, "°C"),
    },
    {
      id: "precipitation",
      label: "Chuva",
      value: formatNumber(weather.precipitation_probability, "%"),
      detail:
        precipitationDetail === UNAVAILABLE_VALUE
          ? undefined
          : `${precipitationDetail} previsto`,
    },
    {
      id: "wind",
      label: "Vento",
      value: formatNumber(weather.wind_speed_10m, " km/h"),
    },
    {
      id: "gusts",
      label: "Rajadas",
      value: formatNumber(weather.wind_gusts_10m, " km/h"),
    },
    {
      id: "humidity",
      label: "Umidade",
      value: formatNumber(weather.relative_humidity_2m, "%"),
    },
    {
      id: "uv",
      label: "UV",
      value: formatNumber(weather.uv_index, "", 1),
    },
    {
      id: "cloud-cover",
      label: "Nuvens",
      value: formatNumber(weather.cloud_cover, "%"),
    },
  ];
}

export function getWeatherStats({
  weather,
  sunrise,
  sunset,
}: WeatherStatsInput): WeatherStat[] {
  const solarStats: WeatherStat[] = [
    {
      id: "sunrise",
      label: "Nascer do sol",
      value: formatLocalTime(sunrise),
    },
    {
      id: "sunset",
      label: "Pôr do sol",
      value: formatLocalTime(sunset),
    },
  ];

  if (!weather) {
    return [
      unavailableStat("temperature", "Temperatura"),
      unavailableStat("apparent-temperature", "Sensação"),
      unavailableStat("precipitation", "Chuva"),
      unavailableStat("wind", "Vento"),
      unavailableStat("gusts", "Rajadas"),
      unavailableStat("humidity", "Umidade"),
      unavailableStat("uv", "UV"),
      unavailableStat("cloud-cover", "Nuvens"),
      ...solarStats,
    ];
  }

  return [...buildWeatherStats(weather), ...solarStats];
}

export function getCompactWeatherStats(input: WeatherStatsInput): WeatherStat[] {
  const stats = getWeatherStats(input);
  const temperature = findStat(stats, "temperature", "Temperatura");
  const apparentTemperature = findStat(stats, "apparent-temperature", "Sensação");
  const precipitation = findStat(stats, "precipitation", "Chuva");
  const wind = findStat(stats, "wind", "Vento");
  const gusts = findStat(stats, "gusts", "Rajadas");
  const humidity = findStat(stats, "humidity", "Umidade");
  const uv = findStat(stats, "uv", "UV");

  return [
    withAvailableDetail(temperature, `Sensação ${apparentTemperature.value}`),
    withAvailableDetail(precipitation, precipitation.detail ?? "Probabilidade"),
    withAvailableDetail(wind, `Rajadas ${gusts.value}`),
    withAvailableDetail(humidity, "Umidade relativa"),
    withAvailableDetail(uv, "Índice UV"),
    buildSolarWindow(input.sunrise, input.sunset),
  ];
}

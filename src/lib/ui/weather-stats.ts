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

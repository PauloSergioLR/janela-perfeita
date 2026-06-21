import {
  Bike,
  CalendarRange,
  CalendarSearch,
  Camera,
  Car,
  CircleAlert,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Footprints,
  Gauge,
  ListChecks,
  Moon,
  Route,
  Search,
  ShieldCheck,
  Shirt,
  Sun,
  SunMedium,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { WeatherStatId } from "@/lib/ui/weather-stats";
import type {
  ActivityId,
  ForecastConfidenceLevel,
  SearchMode,
} from "@/types";

const activityIcons = {
  correr: Footprints,
  caminhar: Route,
  pedalar: Bike,
  fotografar_por_do_sol: Camera,
  observar_estrelas: Moon,
  lavar_carro: Car,
  lavar_roupa: Shirt,
} satisfies Record<ActivityId, LucideIcon>;

const searchModeIcons = {
  janela: Search,
  atividades: ListChecks,
  dia: CloudSun,
  clima_semana: CalendarSearch,
  semana: CalendarRange,
} satisfies Record<SearchMode, LucideIcon>;

const weatherMetricIcons = {
  temperature: Thermometer,
  "apparent-temperature": Gauge,
  precipitation: CloudRain,
  wind: Wind,
  gusts: Wind,
  humidity: Droplets,
  uv: SunMedium,
  "cloud-cover": Cloud,
  sunrise: Sunrise,
  sunset: Sunset,
} satisfies Record<WeatherStatId, LucideIcon>;

const confidenceIcons = {
  alta: ShieldCheck,
  media: CircleAlert,
  baixa: CircleAlert,
} satisfies Record<ForecastConfidenceLevel, LucideIcon>;

export function getActivityIcon(activityId: ActivityId): LucideIcon {
  return activityIcons[activityId];
}

export function getSearchModeIcon(mode: SearchMode): LucideIcon {
  return searchModeIcons[mode];
}

export function getWeatherIcon(weatherCode: number | null): LucideIcon {
  if (weatherCode === null) {
    return Cloud;
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return CloudLightning;
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return CloudSnow;
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return CloudRain;
  }

  if ([45, 48].includes(weatherCode)) {
    return CloudFog;
  }

  return weatherCode === 0 ? Sun : CloudSun;
}

export function getWeatherMetricIcon(metric: WeatherStatId): LucideIcon {
  return weatherMetricIcons[metric];
}

export function getForecastConfidenceIcon(
  level: ForecastConfidenceLevel,
): LucideIcon {
  return confidenceIcons[level];
}

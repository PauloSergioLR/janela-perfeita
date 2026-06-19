import type {
  ActivityId,
  ActivityRanking,
  DailyWeatherOverview,
  HourlyWeather,
  Recommendation,
  WeekComparison,
  WeeklyWeatherOverview,
} from "@/types";

export type WeatherStageVariant =
  | "neutral"
  | "clear"
  | "cloudy"
  | "rain"
  | "night"
  | "sunset";

export interface WeatherStageInput {
  activityId?: ActivityId;
  weather?: HourlyWeather;
  weatherCode?: number | null;
  recommendation?: Recommendation;
  activityRanking?: ActivityRanking;
  weekComparison?: WeekComparison;
  dailyOverview?: DailyWeatherOverview;
  weeklyOverview?: WeeklyWeatherOverview;
}

function getRepresentativeWeather(input: WeatherStageInput): HourlyWeather | null {
  if (input.weather) {
    return input.weather;
  }

  const recommendation =
    input.recommendation ??
    input.activityRanking?.bestActivity?.recommendation ??
    input.weekComparison?.bestDay?.recommendation;
  const scores = recommendation?.bestWindow?.scores ?? recommendation?.scores;

  if (scores?.[0]?.weather) {
    return scores[0].weather;
  }

  if (input.dailyOverview?.hourly[0]) {
    return input.dailyOverview.hourly[0];
  }

  if (input.weeklyOverview?.days[0]?.hourly[0]) {
    return input.weeklyOverview.days[0].hourly[0];
  }

  return null;
}

function getWeatherCode(input: WeatherStageInput, weather: HourlyWeather | null) {
  return (
    weather?.weather_code ??
    input.weatherCode ??
    input.dailyOverview?.weatherCode ??
    input.weeklyOverview?.days[0]?.weatherCode ??
    null
  );
}

function isRainyWeather(weather: HourlyWeather | null, weatherCode: number | null) {
  const precipitation = weather
    ? Math.max(weather.precipitation, weather.rain, weather.showers)
    : 0;

  return (
    precipitation > 0 ||
    (weatherCode !== null &&
      [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(
        weatherCode,
      ))
  );
}

function isNight(weather: HourlyWeather | null) {
  const hour = Number(weather?.time.slice(11, 13));

  return Number.isInteger(hour) && (hour < 6 || hour >= 20);
}

export function getWeatherStageVariant(
  input: WeatherStageInput,
): WeatherStageVariant {
  const weather = getRepresentativeWeather(input);
  const weatherCode = getWeatherCode(input, weather);

  if (isRainyWeather(weather, weatherCode)) {
    return "rain";
  }

  if (input.activityId === "fotografar_por_do_sol") {
    return "sunset";
  }

  if (input.activityId === "observar_estrelas" || isNight(weather)) {
    return "night";
  }

  if (weatherCode === 0 || weatherCode === 1) {
    return "clear";
  }

  if (weatherCode !== null) {
    return "cloudy";
  }

  return "neutral";
}

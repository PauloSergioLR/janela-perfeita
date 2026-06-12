import type { DailyAstronomy, HourlyWeather } from "@/types";

export interface ForecastParams {
  lat: number;
  lon: number;
  date: string;
  endDate?: string;
}

export interface NormalizedForecast {
  hourly: HourlyWeather[];
  astronomy: DailyAstronomy;
  dailyAstronomy: DailyAstronomy[];
}

export interface WeatherProvider {
  name: string;
  getForecast(params: ForecastParams): Promise<NormalizedForecast>;
}

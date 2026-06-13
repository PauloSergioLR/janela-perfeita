import type { DailyAstronomy, HourlyWeather } from "@/types";

export type WeatherModelId = "best_match" | "gfs_global" | "ecmwf_ifs025";

export interface ForecastParams {
  lat: number;
  lon: number;
  date: string;
  endDate?: string;
  model?: WeatherModelId;
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

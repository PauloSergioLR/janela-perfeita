import { getWeatherForecast } from "@/lib/services/open-meteo-weather.service";
import type {
  ForecastParams,
  NormalizedForecast,
  WeatherProvider,
} from "./weather-provider";

export class OpenMeteoWeatherProvider implements WeatherProvider {
  readonly name = "Open-Meteo";

  getForecast(params: ForecastParams): Promise<NormalizedForecast> {
    return getWeatherForecast(params);
  }
}

export const openMeteoWeatherProvider = new OpenMeteoWeatherProvider();

import { getWeatherApiForecast } from "@/lib/services/weatherapi-weather.service";
import type {
  ForecastParams,
  NormalizedForecast,
  WeatherProvider,
} from "./weather-provider";

const WEATHERAPI_KEY_ENV = "WEATHERAPI_KEY";

export class WeatherApiWeatherProvider implements WeatherProvider {
  readonly name = "WeatherAPI.com";

  constructor(private readonly apiKey = process.env[WEATHERAPI_KEY_ENV] ?? "") {}

  get isConfigured(): boolean {
    return this.apiKey.trim().length > 0;
  }

  async getForecast(params: ForecastParams): Promise<NormalizedForecast> {
    if (!this.isConfigured) {
      throw new Error(`${WEATHERAPI_KEY_ENV} não configurada.`);
    }

    return getWeatherApiForecast({
      ...params,
      apiKey: this.apiKey,
    });
  }
}

export const weatherApiWeatherProvider = new WeatherApiWeatherProvider();

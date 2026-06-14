import { getMetNorwayForecast } from "@/lib/services/met-norway-weather.service";
import type {
  ForecastParams,
  NormalizedForecast,
  WeatherProvider,
} from "./weather-provider";

const MET_NORWAY_USER_AGENT_ENV = "MET_NORWAY_USER_AGENT";

export class MetNorwayWeatherProvider implements WeatherProvider {
  readonly name = "MET Norway";

  constructor(
    private readonly userAgent = process.env[MET_NORWAY_USER_AGENT_ENV] ?? "",
  ) {}

  get isConfigured(): boolean {
    return this.userAgent.trim().length > 0;
  }

  async getForecast(params: ForecastParams): Promise<NormalizedForecast> {
    if (!this.isConfigured) {
      throw new Error(`${MET_NORWAY_USER_AGENT_ENV} nao configurado.`);
    }

    if (!params.referenceAstronomy?.length) {
      throw new Error("MET Norway precisa de astronomia de referencia.");
    }

    return getMetNorwayForecast({
      ...params,
      userAgent: this.userAgent,
      referenceAstronomy: params.referenceAstronomy,
    });
  }
}

export const metNorwayWeatherProvider = new MetNorwayWeatherProvider();

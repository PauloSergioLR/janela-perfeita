import { z } from "zod";
import type { DailyAstronomy } from "@/types";
import type {
  ForecastParams,
  NormalizedForecast,
} from "@/lib/weather/weather-provider";

const MET_NORWAY_FORECAST_ENDPOINT =
  "https://api.met.no/weatherapi/locationforecast/2.0/compact";
const MS_TO_KMH = 3.6;
const DEFAULT_VISIBILITY_METERS = 10_000;
const DEFAULT_SUNSHINE_DURATION_SECONDS = 0;
const DEFAULT_UV_INDEX = 0;

const referenceAstronomySchema = z.object({
  date: z.string(),
  sunrise: z.string(),
  sunset: z.string(),
});

const metNorwayForecastParamsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  timezone: z.string().trim().min(1).optional(),
  userAgent: z.string().trim().min(1),
  referenceAstronomy: z.array(referenceAstronomySchema).min(1),
});

const metNorwayDetailsSchema = z.object({
  air_temperature: z.number().optional(),
  relative_humidity: z.number().optional(),
  wind_speed: z.number().optional(),
  wind_speed_of_gust: z.number().optional(),
  wind_from_direction: z.number().optional(),
  cloud_area_fraction: z.number().optional(),
  cloud_area_fraction_low: z.number().optional(),
  cloud_area_fraction_medium: z.number().optional(),
  cloud_area_fraction_high: z.number().optional(),
  ultraviolet_index_clear_sky: z.number().optional(),
});

const metNorwayPeriodSchema = z.object({
  summary: z
    .object({
      symbol_code: z.string().optional(),
    })
    .optional(),
  details: z
    .object({
      precipitation_amount: z.number().optional(),
      probability_of_precipitation: z.number().optional(),
    })
    .optional(),
});

const metNorwayTimeseriesSchema = z.object({
  time: z.string(),
  data: z.object({
    instant: z.object({
      details: metNorwayDetailsSchema,
    }),
    next_1_hours: metNorwayPeriodSchema.optional(),
    next_6_hours: metNorwayPeriodSchema.optional(),
  }),
});

const metNorwayForecastResponseSchema = z.object({
  properties: z.object({
    timeseries: z.array(metNorwayTimeseriesSchema),
  }),
});

const metNorwayErrorSchema = z.object({
  error: z
    .object({
      message: z.string().optional(),
    })
    .optional(),
});

export type MetNorwayForecastParams = ForecastParams & {
  userAgent: string;
  referenceAstronomy: DailyAstronomy[];
};

type MetNorwayDetails = z.infer<typeof metNorwayDetailsSchema>;
type MetNorwayPeriod = z.infer<typeof metNorwayPeriodSchema>;

interface PeriodForecast {
  precipitation: number;
  precipitationProbability: number;
  symbol: string | undefined;
}

interface RequiredDetails {
  temperature: number;
  humidity: number;
  windSpeed: number;
  cloudCover: number;
}

function formatMetNorwayTime(isoTime: string, timezone?: string): string {
  const date = new Date(isoTime);

  if (Number.isNaN(date.getTime())) {
    return isoTime.slice(0, 16);
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function isInsideDateRange(time: string, startDate: string, endDate: string): boolean {
  const date = time.slice(0, 10);

  return date >= startDate && date <= endDate;
}

function getRequiredDetails(details: MetNorwayDetails): RequiredDetails | null {
  if (
    details.air_temperature === undefined ||
    details.relative_humidity === undefined ||
    details.wind_speed === undefined ||
    details.cloud_area_fraction === undefined
  ) {
    return null;
  }

  return {
    temperature: details.air_temperature,
    humidity: details.relative_humidity,
    windSpeed: details.wind_speed,
    cloudCover: details.cloud_area_fraction,
  };
}

function getPeriodForecast(
  nextHour: MetNorwayPeriod | undefined,
  nextSixHours: MetNorwayPeriod | undefined,
): PeriodForecast {
  const period = nextHour ?? nextSixHours;
  const precipitationDivider = nextHour ? 1 : 6;
  const precipitation =
    (period?.details?.precipitation_amount ?? 0) / precipitationDivider;

  return {
    precipitation,
    precipitationProbability: period?.details?.probability_of_precipitation ?? 0,
    symbol: period?.summary?.symbol_code,
  };
}

export function mapMetNorwaySymbolToWeatherCode(
  symbol: string | undefined,
): number {
  const normalized = symbol?.replace(/_(day|night|polartwilight)$/u, "") ?? "";

  if (normalized === "clearsky") {
    return 0;
  }

  if (normalized === "fair") {
    return 1;
  }

  if (normalized === "partlycloudy") {
    return 2;
  }

  if (normalized === "cloudy") {
    return 3;
  }

  if (normalized === "fog") {
    return 45;
  }

  if (normalized.includes("thunder")) {
    return 95;
  }

  if (normalized.includes("heavyrain")) {
    return normalized.includes("showers") ? 82 : 65;
  }

  if (normalized.includes("rain")) {
    return normalized.includes("showers") ? 81 : 63;
  }

  if (normalized.includes("sleet")) {
    return 67;
  }

  if (normalized.includes("heavysnow")) {
    return 75;
  }

  if (normalized.includes("snow")) {
    return normalized.includes("showers") ? 85 : 73;
  }

  return 0;
}

export function buildMetNorwayForecastUrl(
  params: MetNorwayForecastParams,
): URL {
  const parsedParams = metNorwayForecastParamsSchema.parse(params);
  const url = new URL(MET_NORWAY_FORECAST_ENDPOINT);

  url.searchParams.set("lat", String(parsedParams.lat));
  url.searchParams.set("lon", String(parsedParams.lon));

  return url;
}

export function parseMetNorwayForecastResponse(
  payload: unknown,
  params: MetNorwayForecastParams,
): NormalizedForecast {
  const parsedParams = metNorwayForecastParamsSchema.parse(params);
  const parsed = metNorwayForecastResponseSchema.parse(payload);
  const endDate = parsedParams.endDate ?? parsedParams.date;
  const hourly = parsed.properties.timeseries.flatMap((item) => {
    const time = formatMetNorwayTime(item.time, parsedParams.timezone);
    const details = getRequiredDetails(item.data.instant.details);

    if (!details || !isInsideDateRange(time, parsedParams.date, endDate)) {
      return [];
    }

    const period = getPeriodForecast(
      item.data.next_1_hours,
      item.data.next_6_hours,
    );
    const gustSpeed =
      item.data.instant.details.wind_speed_of_gust ?? details.windSpeed;
    const rain = period.symbol?.includes("snow") ? 0 : period.precipitation;

    return [
      {
        time,
        temperature_2m: details.temperature,
        apparent_temperature: details.temperature,
        precipitation: period.precipitation,
        precipitation_probability: period.precipitationProbability,
        rain,
        showers: period.symbol?.includes("showers") ? rain : 0,
        weather_code: mapMetNorwaySymbolToWeatherCode(period.symbol),
        weather_symbol: period.symbol,
        wind_speed_10m: details.windSpeed * MS_TO_KMH,
        wind_gusts_10m: gustSpeed * MS_TO_KMH,
        wind_direction_10m: item.data.instant.details.wind_from_direction,
        cloud_cover: details.cloudCover,
        cloud_cover_low:
          item.data.instant.details.cloud_area_fraction_low ?? details.cloudCover,
        cloud_cover_mid:
          item.data.instant.details.cloud_area_fraction_medium ??
          details.cloudCover,
        cloud_cover_high:
          item.data.instant.details.cloud_area_fraction_high ??
          details.cloudCover,
        visibility: DEFAULT_VISIBILITY_METERS,
        sunshine_duration: DEFAULT_SUNSHINE_DURATION_SECONDS,
        uv_index:
          item.data.instant.details.ultraviolet_index_clear_sky ??
          DEFAULT_UV_INDEX,
        relative_humidity_2m: details.humidity,
      },
    ];
  });
  const dailyAstronomy = parsedParams.referenceAstronomy.filter(
    (astronomy) => astronomy.date >= parsedParams.date && astronomy.date <= endDate,
  );
  const [astronomy] = dailyAstronomy;

  if (!astronomy) {
    throw new Error("MET Norway precisa de astronomia de referencia.");
  }

  return {
    hourly,
    astronomy,
    dailyAstronomy,
  };
}

async function readMetNorwayJson(response: Response): Promise<unknown> {
  const payload = await response.json().catch(() => undefined);

  if (!response.ok) {
    const apiError = metNorwayErrorSchema.safeParse(payload);
    const reason = apiError.success
      ? apiError.data.error?.message ?? `HTTP ${response.status}`
      : `HTTP ${response.status}`;

    throw new Error(`MET Norway retornou erro na previsao: ${reason}`);
  }

  return payload;
}

export async function getMetNorwayForecast(
  params: MetNorwayForecastParams,
): Promise<NormalizedForecast> {
  const parsedParams = metNorwayForecastParamsSchema.parse(params);
  const url = buildMetNorwayForecastUrl(parsedParams);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": parsedParams.userAgent,
      },
    });
    const payload = await readMetNorwayJson(response);

    return parseMetNorwayForecastResponse(payload, parsedParams);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error("Resposta da MET Norway veio em formato inesperado.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Nao foi possivel buscar a previsao na MET Norway.");
  }
}

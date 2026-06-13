import { NextResponse } from "next/server";
import { z } from "zod";
import { getActivityById, getAllActivities } from "@/lib/domain/activities";
import {
  buildActivityRanking,
  buildRecommendation,
  buildWeekComparison,
} from "@/lib/engine/recommendation-exploration";
import { getCitySuggestions } from "@/lib/services/open-meteo-geocoding.service";
import { calculateModelAgreement } from "@/lib/weather/model-agreement";
import { openMeteoWeatherProvider } from "@/lib/weather/open-meteo-weather-provider";
import type {
  ForecastParams,
  NormalizedForecast,
  WeatherModelId,
} from "@/lib/weather/weather-provider";
import type { Activity, ActivityId, City, ModelAgreement } from "@/types";

const ACTIVITY_IDS = [
  "correr",
  "caminhar",
  "pedalar",
  "fotografar_por_do_sol",
  "observar_estrelas",
  "lavar_carro",
] as const satisfies readonly ActivityId[];

const citySchema = z.object({
  id: z.number().int().optional(),
  name: z.string().trim().min(1),
  country: z.string().trim().min(1),
  admin1: z.string().trim().min(1).optional(),
  timezone: z.string().trim().min(1).optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
});

const recommendationModeSchema = z.enum(["janela", "atividades", "semana"]);
const MODES_WITH_ACTIVITY = new Set(["janela", "semana"]);
const WEEK_COMPARISON_DAYS = 7;
const MODEL_COMPARISON_MODELS = [
  "gfs_global",
  "ecmwf_ifs025",
] as const satisfies readonly WeatherModelId[];
const weatherProvider = openMeteoWeatherProvider;

const recommendationRequestSchema = z
  .object({
    mode: recommendationModeSchema.default("janela"),
    activityId: z.string().trim().min(1).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    compareModels: z.boolean().optional().default(false),
    city: citySchema.optional(),
    cityQuery: z.string().trim().min(3).optional(),
  })
  .refine((data) => data.city !== undefined || data.cityQuery !== undefined, {
    message: "Informe uma cidade para gerar a recomendação.",
    path: ["city"],
  })
  .superRefine((data, ctx) => {
    if (MODES_WITH_ACTIVITY.has(data.mode) && !data.activityId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe uma atividade para gerar a recomendação.",
        path: ["activityId"],
      });
    }
  });

class ApiRouteError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: { message } }, { status });
}

function isActivityId(value: string): value is ActivityId {
  return (ACTIVITY_IDS as readonly string[]).includes(value);
}

function addDaysToDate(date: string, days: number): string {
  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  parsedDate.setUTCDate(parsedDate.getUTCDate() + days);

  return parsedDate.toISOString().slice(0, 10);
}

function getLocalDateTimeForZone(date: Date, timeZone?: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

async function readRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiRouteError(400, "JSON inválido no corpo da requisição.");
  }
}

async function resolveCity(city: City | undefined, cityQuery: string | undefined) {
  if (city) {
    return city;
  }

  try {
    const cities = await getCitySuggestions(cityQuery ?? "");
    const [firstCity] = cities;

    if (!firstCity) {
      throw new ApiRouteError(404, "Cidade não encontrada.");
    }

    return firstCity;
  } catch (error) {
    if (error instanceof ApiRouteError) {
      throw error;
    }

    throw new ApiRouteError(502, "Não foi possível buscar a cidade agora.");
  }
}

function resolveActivity(activityId: string | undefined): Activity {
  const activity =
    activityId && isActivityId(activityId) ? getActivityById(activityId) : undefined;

  if (!activity) {
    throw new ApiRouteError(404, "Atividade não encontrada.");
  }

  return activity;
}

async function getOptionalModelAgreement(input: {
  enabled: boolean;
  forecastParams: ForecastParams;
  primaryForecast: NormalizedForecast;
}): Promise<ModelAgreement | null> {
  if (!input.enabled) {
    return null;
  }

  try {
    const comparedForecasts = await Promise.all(
      MODEL_COMPARISON_MODELS.map(async (model) => ({
        model,
        forecast: await weatherProvider.getForecast({
          ...input.forecastParams,
          model,
        }),
      })),
    );

    return calculateModelAgreement([
      {
        model: "best_match",
        forecast: input.primaryForecast,
      },
      ...comparedForecasts,
    ]);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readRequestBody(request);
    const body = recommendationRequestSchema.parse(payload);
    const city = await resolveCity(body.city, body.cityQuery);
    const generatedAtDate = new Date();
    const generatedAt = generatedAtDate.toISOString();
    const now = getLocalDateTimeForZone(generatedAtDate, city.timezone);
    const forecastParams: ForecastParams = {
      lat: city.coordinates.lat,
      lon: city.coordinates.lon,
      date: body.date,
      endDate:
        body.mode === "semana"
          ? addDaysToDate(body.date, WEEK_COMPARISON_DAYS - 1)
          : undefined,
    };
    const forecast = await weatherProvider.getForecast(forecastParams).catch(() => {
      throw new ApiRouteError(502, "Não foi possível buscar a previsão agora.");
    });
    const modelAgreement = await getOptionalModelAgreement({
      enabled: body.compareModels && body.mode === "janela",
      forecastParams,
      primaryForecast: forecast,
    });

    if (body.mode === "atividades") {
      const activityRanking = buildActivityRanking({
        activities: getAllActivities(),
        city,
        hourly: forecast.hourly,
        astronomy: forecast.astronomy,
        generatedAt,
        now,
      });

      return NextResponse.json({ activityRanking });
    }

    const activity = resolveActivity(body.activityId);

    if (body.mode === "semana") {
      const weekComparison = buildWeekComparison({
        activity,
        city,
        hourly: forecast.hourly,
        dailyAstronomy: forecast.dailyAstronomy.slice(0, WEEK_COMPARISON_DAYS),
        generatedAt,
        now,
      });

      return NextResponse.json({ weekComparison });
    }

    const recommendation = buildRecommendation({
      activity,
      city,
      hourly: forecast.hourly,
      astronomy: forecast.astronomy,
      generatedAt,
      now,
    });

    if (modelAgreement) {
      recommendation.modelAgreement = modelAgreement;
    }

    return NextResponse.json({ recommendation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(400, "Dados inválidos para gerar recomendação.");
    }

    if (error instanceof ApiRouteError) {
      return jsonError(error.status, error.message);
    }

    return jsonError(500, "Erro inesperado ao gerar recomendação.");
  }
}


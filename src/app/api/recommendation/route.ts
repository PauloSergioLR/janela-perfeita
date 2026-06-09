import { NextResponse } from "next/server";
import { z } from "zod";
import { getActivityById } from "@/lib/domain/activities";
import { calculateDayScores } from "@/lib/engine/score-calculator";
import { findBestWindows } from "@/lib/engine/window-finder";
import { getCitySuggestions } from "@/lib/services/open-meteo-geocoding.service";
import { getWeatherForecast } from "@/lib/services/open-meteo-weather.service";
import type { ActivityId, City, Recommendation } from "@/types";

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

const recommendationRequestSchema = z
  .object({
    activityId: z.string().trim().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    city: citySchema.optional(),
    cityQuery: z.string().trim().min(3).optional(),
  })
  .refine((data) => data.city !== undefined || data.cityQuery !== undefined, {
    message: "Informe uma cidade para gerar a recomendação.",
    path: ["city"],
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

export async function POST(request: Request) {
  try {
    const payload = await readRequestBody(request);
    const body = recommendationRequestSchema.parse(payload);
    const activity = isActivityId(body.activityId)
      ? getActivityById(body.activityId)
      : undefined;

    if (!activity) {
      throw new ApiRouteError(404, "Atividade não encontrada.");
    }

    const city = await resolveCity(body.city, body.cityQuery);
    const forecast = await getWeatherForecast({
      lat: city.coordinates.lat,
      lon: city.coordinates.lon,
      date: body.date,
    }).catch(() => {
      throw new ApiRouteError(502, "Não foi possível buscar a previsão agora.");
    });
    const generatedAtDate = new Date();
    const scores = calculateDayScores({
      activity,
      hourly: forecast.hourly,
      astronomy: forecast.astronomy,
      now: getLocalDateTimeForZone(generatedAtDate, city.timezone),
    });
    const windows = findBestWindows(scores, activity);
    const recommendation: Recommendation = {
      activity,
      city,
      date: forecast.astronomy.date,
      generatedAt: generatedAtDate.toISOString(),
      scores,
      windows,
      bestWindow: windows[0] ?? null,
      disclaimer:
        "Recomendação estimada com base na previsão meteorológica da Open-Meteo; não substitui avaliação local das condições.",
    };

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


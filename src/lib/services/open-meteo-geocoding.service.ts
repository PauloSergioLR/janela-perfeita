import { z } from "zod";
import { openMeteoErrorSchema, parseGeocodingResponse } from "./open-meteo.schemas";

const GEOCODING_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";

export function buildGeocodingUrl(query: string): URL {
  const url = new URL(GEOCODING_ENDPOINT);

  url.searchParams.set("name", query.trim());
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "pt");
  url.searchParams.set("format", "json");

  return url;
}

async function readOpenMeteoJson(response: Response): Promise<unknown> {
  const payload = await response.json().catch(() => undefined);

  if (!response.ok) {
    const apiError = openMeteoErrorSchema.safeParse(payload);
    const reason = apiError.success
      ? apiError.data.reason
      : `HTTP ${response.status}`;

    throw new Error(`Open-Meteo retornou erro no geocoding: ${reason}`);
  }

  return payload;
}

export async function getCitySuggestions(query: string) {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 3) {
    return [];
  }

  try {
    const response = await fetch(buildGeocodingUrl(normalizedQuery));
    const payload = await readOpenMeteoJson(response);

    return parseGeocodingResponse(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error("Resposta de cidades veio em formato inesperado.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Não foi possível buscar sugestões de cidade na Open-Meteo.");
  }
}

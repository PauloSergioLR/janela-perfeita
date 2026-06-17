import { NextResponse } from "next/server";
import { z } from "zod";
import { getCityByCoordinates } from "@/lib/services/nominatim-reverse-geocoding.service";

const reverseGeocodingQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  timezone: z.string().trim().min(1).optional(),
});

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: { message } }, { status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsedQuery = reverseGeocodingQuerySchema.safeParse({
    lat: searchParams.get("lat"),
    lon: searchParams.get("lon"),
    timezone: searchParams.get("timezone") ?? undefined,
  });

  if (!parsedQuery.success) {
    return jsonError(400, "Coordenadas inválidas para detectar cidade.");
  }

  try {
    const city = await getCityByCoordinates(parsedQuery.data);

    return NextResponse.json({ city });
  } catch {
    return jsonError(502, "Não foi possível detectar a cidade pela localização.");
  }
}

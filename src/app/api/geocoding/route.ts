import { NextResponse } from "next/server";
import { z } from "zod";
import { getCitySuggestions } from "@/lib/services/open-meteo-geocoding.service";

const geocodingQuerySchema = z.string().trim().min(3);

function jsonError(status: number, message: string) {
  return NextResponse.json({ error: { message } }, { status });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = geocodingQuerySchema.safeParse(url.searchParams.get("q") ?? "");

  if (!query.success) {
    return jsonError(400, "Informe pelo menos 3 caracteres para buscar cidades.");
  }

  try {
    const cities = await getCitySuggestions(query.data);

    return NextResponse.json({ cities });
  } catch {
    return jsonError(502, "Não foi possível buscar cidades agora.");
  }
}


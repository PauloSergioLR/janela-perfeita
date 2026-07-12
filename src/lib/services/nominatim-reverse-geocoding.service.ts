import { z } from "zod";
import type { City, Coordinates } from "@/types";

const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_USER_AGENT =
  "JanelaPerfeita/1.1 (https://janela-perfeita.vercel.app)";

const addressSchema = z.object({
  city: z.string().optional(),
  town: z.string().optional(),
  village: z.string().optional(),
  municipality: z.string().optional(),
  city_district: z.string().optional(),
  suburb: z.string().optional(),
  county: z.string().optional(),
  state: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
});

const nominatimReverseSchema = z.object({
  address: addressSchema.optional(),
});

interface ReverseGeocodingParams extends Coordinates {
  timezone?: string;
}

export function buildNominatimReverseUrl({ lat, lon }: Coordinates): URL {
  const url = new URL(NOMINATIM_REVERSE_URL);

  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("layer", "address");

  return url;
}

function getAddressCityName(
  address: z.infer<typeof addressSchema>,
): string | undefined {
  return (
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.city_district ??
    address.suburb ??
    address.county
  );
}

export async function getCityByCoordinates({
  lat,
  lon,
  timezone,
}: ReverseGeocodingParams): Promise<City> {
  const response = await fetch(buildNominatimReverseUrl({ lat, lon }), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      "User-Agent": NOMINATIM_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error("Nominatim retornou erro no reverse geocoding.");
  }

  const payload: unknown = await response.json();
  const parsedPayload = nominatimReverseSchema.safeParse(payload);

  if (!parsedPayload.success || !parsedPayload.data.address) {
    throw new Error("Resposta de reverse geocoding veio em formato inesperado.");
  }

  const address = parsedPayload.data.address;
  const cityName = getAddressCityName(address);

  if (!cityName || !address.country) {
    throw new Error("Reverse geocoding não encontrou cidade para as coordenadas.");
  }

  return {
    name: cityName,
    country: address.country,
    admin1: address.state ?? address.region,
    timezone,
    coordinates: {
      lat,
      lon,
    },
  };
}

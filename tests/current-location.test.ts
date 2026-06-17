import { describe, expect, it } from "vitest";
import {
  buildCurrentLocationCity,
  canUseBrowserGeolocation,
  CURRENT_LOCATION_CITY_COUNTRY,
  CURRENT_LOCATION_CITY_NAME,
  getGeolocationErrorMessage,
  isCurrentLocationCity,
} from "@/lib/ui/current-location";
import { formatCityLabel } from "@/lib/ui/search-page";

describe("localizacao atual", () => {
  it("cria cidade temporaria com coordenadas do navegador", () => {
    const city = buildCurrentLocationCity(
      {
        lat: -28.6775,
        lon: -49.3697,
      },
      "America/Sao_Paulo",
    );

    expect(city).toEqual({
      name: CURRENT_LOCATION_CITY_NAME,
      country: CURRENT_LOCATION_CITY_COUNTRY,
      timezone: "America/Sao_Paulo",
      coordinates: {
        lat: -28.6775,
        lon: -49.3697,
      },
    });
    expect(isCurrentLocationCity(city)).toBe(true);
    expect(formatCityLabel(city)).toBe("Localização atual");
  });

  it("identifica suporte a geolocalizacao do navegador", () => {
    const getCurrentPosition: Geolocation["getCurrentPosition"] = () => undefined;

    expect(canUseBrowserGeolocation({ geolocation: { getCurrentPosition } })).toBe(
      true,
    );
    expect(canUseBrowserGeolocation({})).toBe(false);
    expect(canUseBrowserGeolocation(null)).toBe(false);
  });

  it("traduz erros de geolocalizacao para mensagens amigaveis", () => {
    expect(getGeolocationErrorMessage(1)).toContain("Permissão negada");
    expect(getGeolocationErrorMessage(2)).toContain("detectar sua localização");
    expect(getGeolocationErrorMessage(3)).toContain("demorou demais");
    expect(getGeolocationErrorMessage(999)).toContain("Não foi possível");
  });
});
